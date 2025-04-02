import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { formatDate } from '../utils/constants';

// Import ABIs
import EventABI from '../utils/abis/Event.json';
import TicketNFTABI from '../utils/abis/TicketNFT.json';

function ManageEvent() {
  const { address } = useParams();
  const navigate = useNavigate();
  const { account, signer, formatEther, parseEther } = useWeb3();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Form states
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    eventDate: '',
    eventLocation: '',
    eventDescription: '',
    baseURI: '',
  });
  
  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!signer || !account) {
          throw new Error('Please connect your wallet');
        }
        
        // Connect to Event contract
        const eventContract = new ethers.Contract(
          address,
          EventABI.abi,
          signer
        );
        
        // Get event details
        const eventName = await eventContract.eventName();
        const ticketPrice = await eventContract.ticketPrice();
        const maxTickets = await eventContract.maxTickets();
        const ticketsSold = await eventContract.ticketsSold();
        const remainingTickets = await eventContract.remainingTickets();
        const nftAddress = await eventContract.ticketNFT();
        const currentPhase = await eventContract.currentPhase();
        const venueAddress = await eventContract.venue();
        
        // Check if user is the venue
        const isVenue = venueAddress.toLowerCase() === account.toLowerCase();
        setIsAuthorized(isVenue);
        
        if (!isVenue) {
          throw new Error('You are not authorized to manage this event');
        }
        
        // Get optional event details
        let eventDate = 0;
        let eventLocation = '';
        let eventDescription = '';
        
        try {
          eventDate = await eventContract.eventDate();
          eventLocation = await eventContract.eventLocation();
          eventDescription = await eventContract.eventDescription();
        } catch (err) {
          console.log('Optional event details not available');
        }
        
        // Get revenue info
        let primaryRevenue = ethers.parseEther("0");
        let secondaryRevenue = ethers.parseEther("0");
        let totalRevenue = ethers.parseEther("0");
        
        try {
          [primaryRevenue, secondaryRevenue, totalRevenue] = await eventContract.totalRevenue();
        } catch (err) {
          console.log('Revenue info not available');
        }
        
        // Connect to NFT contract
        const nftContract = new ethers.Contract(
          nftAddress,
          TicketNFTABI.abi,
          signer
        );
        
        // Get base URI
        let baseURI = '';
        try {
          baseURI = await nftContract.baseURI();
        } catch (err) {
          console.log('Base URI not available');
        }
        
        setEvent({
          address,
          contract: eventContract,
          nftContract,
          name: eventName,
          ticketPrice,
          ticketsSold,
          maxTickets,
          nftAddress,
          currentPhase,
          remainingTickets,
          eventDate,
          eventLocation,
          eventDescription,
          primaryRevenue,
          secondaryRevenue,
          totalRevenue,
          venueAddress,
          baseURI,
        });
        
        // Initialize form data
        const dateObj = eventDate > 0 ? new Date(Number(eventDate) * 1000) : null;
        const formattedDate = dateObj ? 
          `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}T${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}` : 
          '';
        
        setFormData({
          eventDate: formattedDate,
          eventLocation: eventLocation || '',
          eventDescription: eventDescription || '',
          baseURI: baseURI || '',
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (signer && account && address) {
      fetchEventDetails();
    }
  }, [signer, account, address]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUpdateEventDetails = async () => {
    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionError(null);
      
      if (!event || !event.contract) {
        throw new Error('Event contract not found');
      }
      
      // Convert date to timestamp
      const dateTimestamp = formData.eventDate
        ? Math.floor(new Date(formData.eventDate).getTime() / 1000)
        : 0;
      
      // Call setEventDetails
      const tx = await event.contract.setEventDetails(
        dateTimestamp,
        formData.eventLocation,
        formData.eventDescription
      );
      
      await tx.wait();
      
      setActionSuccess(true);
      setActionMessage('Event details updated successfully!');
      
      // Update event state
      setEvent({
        ...event,
        eventDate: dateTimestamp,
        eventLocation: formData.eventLocation,
        eventDescription: formData.eventDescription
      });
      
      setTimeout(() => {
        setActionSuccess(false);
        setActionMessage('');
      }, 3000);
      
      setActionLoading(false);
    } catch (err) {
      console.error('Error updating event details:', err);
      setActionError(err.message);
      setActionLoading(false);
    }
  };

  const handleSetBaseURI = async () => {
    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionError(null);
      
      if (!event || !event.nftContract) {
        throw new Error('NFT contract not found');
      }
      
      // Call setBaseURI
      const tx = await event.nftContract.setBaseURI(formData.baseURI);
      
      await tx.wait();
      
      setActionSuccess(true);
      setActionMessage('Base URI updated successfully!');
      
      // Update event state
      setEvent({
        ...event,
        baseURI: formData.baseURI
      });
      
      setTimeout(() => {
        setActionSuccess(false);
        setActionMessage('');
      }, 3000);
      
      setActionLoading(false);
    } catch (err) {
      console.error('Error setting base URI:', err);
      setActionError(err.message);
      setActionLoading(false);
    }
  };

  const handleChangePhase = async (newPhase) => {
    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionError(null);
      
      if (!event || !event.contract) {
        throw new Error('Event contract not found');
      }
      
      // Call changeEventPhase with the new phase
      const tx = await event.contract.changeEventPhase(newPhase);
      
      await tx.wait();
      
      setActionSuccess(true);
      setActionMessage(`Event ${newPhase === 0 ? 'reopened' : 'closed'} successfully!`);
      
      // Update event state
      setEvent({
        ...event,
        currentPhase: newPhase
      });
      
      setTimeout(() => {
        setActionSuccess(false);
        setActionMessage('');
      }, 3000);
      
      setActionLoading(false);
    } catch (err) {
      console.error('Error changing event phase:', err);
      setActionError(err.message);
      setActionLoading(false);
    }
  };

  const handleWithdrawFunds = async () => {
    try {
      setActionLoading(true);
      setActionSuccess(false);
      setActionError(null);
      
      if (!event || !event.contract) {
        throw new Error('Event contract not found');
      }
      
      if (ethers.formatEther(event.totalRevenue) === '0.0') {
        throw new Error('No funds to withdraw');
      }
      
      // Call withdrawFunds
      const tx = await event.contract.withdrawFunds();
      
      await tx.wait();
      
      // Store the withdrawn amount for the success message
      const withdrawnAmount = event.totalRevenue;
      
      // Reset revenue in event state
      setEvent({
        ...event,
        primaryRevenue: ethers.parseEther("0"),
        secondaryRevenue: ethers.parseEther("0"),
        totalRevenue: ethers.parseEther("0"),
      });
      
      setActionSuccess(true);
      setActionMessage(`Successfully withdrawn ${formatEther(withdrawnAmount)} ETH!`);
      
      setTimeout(() => {
        setActionSuccess(false);
        setActionMessage('');
      }, 3000);
      
      setActionLoading(false);
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setActionError(err.message);
      setActionLoading(false);
    }
  };

  // Helper to show phase name
  const getPhase = (phase) => {
    switch (Number(phase)) {
      case 0:
        return 'Active';
      case 1:
        return 'Sold Out';
      case 2:
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

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
            <h3 className="text-sm font-medium text-red-800">Error loading event</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-yellow-50 rounded-md p-4 max-w-3xl mx-auto">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Access Denied</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You are not authorized to manage this event.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Event: {event.name}</h1>
          <p className="mt-1 text-gray-600">Make changes to your event settings and manage operations</p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Admin
        </button>
      </div>
      
      {/* Event Status Card */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Event Status</h3>
              <div className="mt-1 space-y-1 text-sm text-gray-500">
                <p>Status: <span className={`font-medium ${
                    Number(event.currentPhase) === 0 
                      ? 'text-green-600' 
                      : Number(event.currentPhase) === 1 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>{getPhase(event.currentPhase)}</span>
                </p>
                <p>Tickets Sold: {event.ticketsSold.toString()}/{event.maxTickets.toString()}</p>
                <p>Remaining: {event.remainingTickets.toString()}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
              <div className="mt-1 space-y-1 text-sm text-gray-500">
                <p>Primary Sales: {formatEther(event.primaryRevenue)} ETH</p>
                <p>Secondary Sales: {formatEther(event.secondaryRevenue)} ETH</p>
                <p className="font-medium text-primary-600">Total: {formatEther(event.totalRevenue)} ETH</p>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <button
                onClick={handleWithdrawFunds}
                disabled={actionLoading || ethers.formatEther(event.totalRevenue) === '0.0'}
                className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  (actionLoading || ethers.formatEther(event.totalRevenue) === '0.0') ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {actionLoading ? 'Processing...' : 'Withdraw Funds'}
              </button>
              
              {Number(event.currentPhase) === 0 ? (
                <button
                  onClick={() => handleChangePhase(2)} // Close event
                  disabled={actionLoading}
                  className={`mt-3 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Close Event
                </button>
              ) : (
                <button
                  onClick={() => handleChangePhase(0)} // Reopen event
                  disabled={actionLoading}
                  className={`mt-3 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Reopen Event
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Success and Error Messages */}
      {actionSuccess && (
        <div className="rounded-md bg-green-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{actionMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {actionError && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{actionError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('details')}
            className={`${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Event Details
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`${
              activeTab === 'metadata'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            NFT Metadata
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Event Details Tab */}
          {activeTab === 'details' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Event Details</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
                    Event Date/Time
                  </label>
                  <div className="mt-1">
                    <input
                      type="datetime-local"
                      name="eventDate"
                      id="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700">
                    Event Location
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="eventLocation"
                      id="eventLocation"
                      value={formData.eventLocation}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Venue, City, Country"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700">
                    Event Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      name="eventDescription"
                      id="eventDescription"
                      rows="4"
                      value={formData.eventDescription}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleUpdateEventDetails}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {actionLoading ? 'Updating...' : 'Update Details'}
                </button>
              </div>
            </div>
          )}
          
          {/* NFT Metadata Tab */}
          {activeTab === 'metadata' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">NFT Metadata Settings</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="baseURI" className="block text-sm font-medium text-gray-700">
                    Base URI for Ticket Metadata
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="baseURI"
                      id="baseURI"
                      value={formData.baseURI}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="https://example.com/api/metadata/"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    The base URI is used to construct the URL for ticket metadata. Token IDs will be appended to this URI.
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSetBaseURI}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {actionLoading ? 'Updating...' : 'Update Base URI'}
                </button>
              </div>
              
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-2">NFT Contract Information</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">NFT Contract Address:</span> {event.nftAddress}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageEvent; 