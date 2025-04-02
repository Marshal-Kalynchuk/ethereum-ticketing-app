import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../contexts/Web3Context';

function VenueManagement() {
  const { account, signer, contracts, formatEther } = useWeb3();
  
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        if (!signer || !account || !contracts.ticketingSystem) {
          return;
        }
        
        const owner = await contracts.ticketingSystem.owner();
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
      } catch (err) {
        console.error('Error checking ownership:', err);
      }
    };
    
    if (signer && account && contracts.ticketingSystem) {
      checkOwnership();
    }
  }, [signer, account, contracts.ticketingSystem]);

  // Listen for VenueAuthorizationChanged events
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!signer || !account || !contracts.ticketingSystem) {
          throw new Error('Please connect your wallet and ensure contracts are loaded');
        }
        
        // We need to query past VenueAuthorizationChanged events to find all authorized venues
        // This is a simplified approach - in a real app, you'd need pagination and more robust handling
        const filter = contracts.ticketingSystem.filters.VenueAuthorizationChanged();
        const logs = await contracts.ticketingSystem.queryFilter(filter);
        
        // Process the logs to get the current state
        const venueMap = new Map();
        
        for (const log of logs) {
          const venueAddress = log.args.venue.toLowerCase();
          const isAuthorized = log.args.authorized;
          venueMap.set(venueAddress, { address: venueAddress, isAuthorized });
        }
        
        // Convert map to array and filter only authorized venues
        const venueList = Array.from(venueMap.values());
        
        // For each venue, check if it's still authorized (in case the event data is outdated)
        const venuePromises = venueList.map(async (venue) => {
          const isStillAuthorized = await contracts.ticketingSystem.isVenueAuthorized(venue.address);
          return { ...venue, isAuthorized: isStillAuthorized };
        });
        
        const verifiedVenues = await Promise.all(venuePromises);
        setVenues(verifiedVenues);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (signer && account && contracts.ticketingSystem) {
      fetchVenues();
    }
    
    // Set up event listener for real-time updates
    if (contracts.ticketingSystem) {
      const handleVenueAuthorizationChanged = (venue, authorized) => {
        setVenues(prev => {
          const existing = prev.find(v => v.address.toLowerCase() === venue.toLowerCase());
          if (existing) {
            return prev.map(v => 
              v.address.toLowerCase() === venue.toLowerCase() 
                ? { ...v, isAuthorized: authorized } 
                : v
            );
          } else {
            return [...prev, { address: venue.toLowerCase(), isAuthorized: authorized }];
          }
        });
      };
      
      // Attach event listener
      contracts.ticketingSystem.on('VenueAuthorizationChanged', handleVenueAuthorizationChanged);
      
      // Clean up
      return () => {
        contracts.ticketingSystem.off('VenueAuthorizationChanged', handleVenueAuthorizationChanged);
      };
    }
  }, [signer, account, contracts.ticketingSystem, actionSuccess]);

  const handleAuthorizeVenue = async (e) => {
    e.preventDefault();
    
    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionError(null);
      
      if (!signer || !account || !contracts.ticketingSystem) {
        throw new Error('Please connect your wallet and ensure contracts are loaded');
      }
      
      if (!isOwner) {
        throw new Error('Only the contract owner can authorize venues');
      }
      
      if (!ethers.isAddress(newVenueAddress)) {
        throw new Error('Invalid Ethereum address');
      }
      
      // Call the setVenueAuthorization function
      const tx = await contracts.ticketingSystem.setVenueAuthorization(newVenueAddress, true);
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      setActionSuccess(true);
      setNewVenueAddress('');
      setActionLoading(false);
    } catch (err) {
      console.error('Error authorizing venue:', err);
      setActionError(err.message);
      setActionLoading(false);
    }
  };

  const handleRevokeVenue = async (venueAddress) => {
    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionError(null);
      
      if (!signer || !account || !contracts.ticketingSystem) {
        throw new Error('Please connect your wallet and ensure contracts are loaded');
      }
      
      if (!isOwner) {
        throw new Error('Only the contract owner can revoke venues');
      }
      
      // Call the setVenueAuthorization function with false to revoke
      const tx = await contracts.ticketingSystem.setVenueAuthorization(venueAddress, false);
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      setActionSuccess(true);
      setActionLoading(false);
    } catch (err) {
      console.error('Error revoking venue:', err);
      setActionError(err.message);
      setActionLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-yellow-50 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Access Restricted</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Only the contract owner can manage venue authorizations.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">Venue Management</h2>
        <p className="mt-1 text-sm text-gray-600">Authorize and manage venues that can create events.</p>
      </div>
      
      {actionSuccess && (
        <div className="rounded-md bg-green-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>The venue authorization has been updated successfully.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {actionError && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error updating venue</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{actionError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Authorize new venue form */}
      <form onSubmit={handleAuthorizeVenue} className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full">
            <label htmlFor="newVenueAddress" className="block text-sm font-medium text-gray-700 mb-1">
              New Venue Address
            </label>
            <input
              type="text"
              name="newVenueAddress"
              id="newVenueAddress"
              value={newVenueAddress}
              onChange={(e) => setNewVenueAddress(e.target.value)}
              placeholder="0x..."
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              required
            />
          </div>
          <div className="flex-shrink-0">
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {actionLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Authorize Venue'
              )}
            </button>
          </div>
        </div>
      </form>
      
      {/* Venues list */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Authorized Venues</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading venues</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : venues.filter(v => v.isAuthorized).length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">No venues found</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>No venues are currently authorized.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {venues
                .filter(venue => venue.isAuthorized)
                .map((venue) => (
                  <li key={venue.address} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{venue.address}</p>
                      <p className="text-sm text-gray-500">
                        {venue.address.toLowerCase() === account.toLowerCase() ? '(You)' : ''}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleRevokeVenue(venue.address)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Revoke
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default VenueManagement; 