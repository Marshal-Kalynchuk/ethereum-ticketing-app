import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import EventManagement from '../components/admin/EventManagement';
import VenueManagement from '../components/admin/VenueManagement';

function Admin() {
  const { account, signer, contracts } = useWeb3();
  const [activeTab, setActiveTab] = useState('venues');
  const [isVenue, setIsVenue] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!signer || !account || !contracts.ticketingSystem) {
          throw new Error('Please connect your wallet and ensure contracts are loaded');
        }
        
        // Check if the current account is an authorized venue
        const venueAuthorized = await contracts.ticketingSystem.isVenueAuthorized(account);
        // Check if the current account is the contract owner
        const owner = await contracts.ticketingSystem.owner();
        const isOwnerAccount = owner.toLowerCase() === account.toLowerCase();
        
        setIsVenue(venueAuthorized);
        setIsOwner(isOwnerAccount);
        setLoading(false);
      } catch (err) {
        console.error('Error checking authorization:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (signer && account && contracts.ticketingSystem) {
      checkAuthorization();
    }
  }, [signer, account, contracts.ticketingSystem]);

  // Handle tab changes, preventing non-venue users from accessing events tab
  const handleTabChange = (tab) => {
    if (tab === 'events' && !isVenue) {
      return; // Don't allow switching to events tab if not a venue
    }
    setActiveTab(tab);
  };

  // Set default tab to venues if user is admin but not venue
  useEffect(() => {
    if (isOwner && !isVenue) {
      setActiveTab('venues');
    }
  }, [isOwner, isVenue]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-md p-4 max-w-3xl mx-auto">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading admin panel</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isVenue && !isOwner) {
    return (
      <div className="bg-yellow-50 rounded-md p-4 max-w-3xl mx-auto">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Unauthorized Access</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You do not have permission to access the admin panel. Only authorized venues or the contract owner can access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage events and venue authorizations</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {isVenue && (
            <button
              onClick={() => handleTabChange('events')}
              className={`${
                activeTab === 'events'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Event Management
            </button>
          )}
          <button
            onClick={() => handleTabChange('venues')}
            className={`${
              activeTab === 'venues'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Venue Management
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'events' && isVenue ? (
          <EventManagement />
        ) : (
          <VenueManagement />
        )}
      </div>
    </div>
  );
}

export default Admin; 