import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../contexts/Web3Context';
import { formatDate } from '../../utils/constants';
import { Link } from 'react-router-dom';

function EventManagement() {
  const { account, signer, contracts, formatEther, parseEther } = useWeb3();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    ticketPrice: '',
    maxTickets: '',
    resaleLimitMultiplier: '120',
    venueFeePercentage: '500'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!signer || !account || !contracts.ticketingSystem) {
          throw new Error('Please connect your wallet and ensure contracts are loaded');
        }
        
        // Get the count of deployed events
        const eventCount = await contracts.ticketingSystem.getDeployedEventsCount();
        
        // Fetch all events
        const eventPromises = [];
        
        for (let i = 0; i < eventCount; i++) {
          const eventAddress = await contracts.ticketingSystem.deployedEvents(i);
          
          // Fetch event details (we would need to connect to each event contract)
          const EventABI = (await import('../../utils/abis/Event.json')).default;
          const eventContract = new ethers.Contract(
            eventAddress,
            EventABI.abi,
            signer
          );
          
          // Fetch basic event details
          const eventName = await eventContract.eventName();
          const ticketPrice = await eventContract.ticketPrice();
          const maxTickets = await eventContract.maxTickets();
          const ticketsSold = await eventContract.ticketsSold();
          const nftAddress = await eventContract.ticketNFT();
          const venueAddress = await eventContract.venue();
          const currentPhase = await eventContract.currentPhase();
          
          // Get additional details if available
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
          
          // Get revenue information
          let primaryRevenue = ethers.parseEther("0");
          let secondaryRevenue = ethers.parseEther("0");
          let totalRevenue = ethers.parseEther("0");
          
          try {
            [primaryRevenue, secondaryRevenue, totalRevenue] = await eventContract.totalRevenue();
          } catch (err) {
            console.log('Revenue info not available');
          }
          
          // Check if this event belongs to the current user
          const isOwnedByUser = venueAddress.toLowerCase() === account.toLowerCase();
          
          eventPromises.push({
            address: eventAddress,
            name: eventName,
            ticketPrice,
            maxTickets,
            ticketsSold,
            nftAddress,
            venueAddress,
            currentPhase,
            eventDate,
            eventLocation,
            eventDescription,
            primaryRevenue,
            secondaryRevenue,
            totalRevenue,
            isOwnedByUser
          });
        }
        
        const fetchedEvents = await Promise.all(eventPromises);
        setEvents(fetchedEvents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (signer && account && contracts.ticketingSystem) {
      fetchEvents();
    }
  }, [signer, account, contracts.ticketingSystem, createSuccess, withdrawSuccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      setCreateSuccess(false);
      setCreateError(null);
      
      if (!signer || !account || !contracts.ticketingSystem) {
        throw new Error('Please connect your wallet and ensure contracts are loaded');
      }
      
      // Validate form data
      if (!formData.name || !formData.symbol || !formData.ticketPrice || !formData.maxTickets) {
        throw new Error('Please fill out all required fields');
      }
      
      // Create the event config object
      const eventConfig = {
        name: formData.name,
        symbol: formData.symbol,
        ticketPrice: parseEther(formData.ticketPrice),
        maxTickets: formData.maxTickets,
        resaleLimitMultiplier: formData.resaleLimitMultiplier,
        venueFeePercentage: formData.venueFeePercentage
      };
      
      // Call the createEvent function
      const tx = await contracts.ticketingSystem.createEvent(eventConfig);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      // Get the event address from the logs
      const eventCreatedLog = receipt.logs.find(log => 
        log.topics && log.topics[0] === ethers.id("EventCreated(address,address,address,string,string,uint256,uint256)")
      );
      
      let eventAddress;
      if (eventCreatedLog) {
        const EventABI = (await import('../../utils/abis/Event.json')).default;
        const eventInterface = new ethers.Interface(EventABI.abi);
        try {
          const decodedLog = eventInterface.parseLog({ 
            topics: eventCreatedLog.topics, 
            data: eventCreatedLog.data 
          });
          eventAddress = decodedLog.args.eventContract;
        } catch (e) {
          console.log('Error decoding log:', e);
        }
      }
      
      setCreateSuccess(true);
      setFormData({
        name: '',
        symbol: '',
        ticketPrice: '',
        maxTickets: '',
        resaleLimitMultiplier: '120',
        venueFeePercentage: '500'
      });
      
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating event:', err);
      setCreateError(err.message);
      setIsCreating(false);
    }
  };

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

  const handleWithdrawFunds = async (eventAddress) => {
    try {
      setWithdrawLoading(true);
      setWithdrawSuccess(false);
      setWithdrawError(null);
      
      if (!signer || !account) {
        throw new Error('Please connect your wallet and ensure contracts are loaded');
      }
      
      // Connect to the event contract
      const EventABI = (await import('../../utils/abis/Event.json')).default;
      const eventContract = new ethers.Contract(
        eventAddress,
        EventABI.abi,
        signer
      );
      
      // Get current revenue information before withdrawal
      const [primaryRevenue, secondaryRevenue, totalRevenue] = await eventContract.totalRevenue();
      
      // Call the withdrawFunds function
      const tx = await eventContract.withdrawFunds();
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      // Update the events list with new balances (0)
      const updatedEvents = events.map(event => {
        if (event.address === eventAddress) {
          return {
            ...event,
            primaryRevenue: ethers.parseEther("0"),
            secondaryRevenue: ethers.parseEther("0"),
            totalRevenue: ethers.parseEther("0"),
          };
        }
        return event;
      });
      
      setEvents(updatedEvents);
      setWithdrawSuccess(true);
      
      // Set selected event
      const event = events.find(e => e.address === eventAddress);
      setSelectedEvent({
        ...event,
        withdrawnAmount: totalRevenue
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setWithdrawSuccess(false);
        setSelectedEvent(null);
      }, 3000);
      
      setWithdrawLoading(false);
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setWithdrawError(err.message);
      setWithdrawLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
        <p className="mt-1 text-sm text-gray-600">Fill out the form below to create a new event.</p>
      </div>
      
      {createSuccess && (
        <div className="rounded-md bg-green-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your event has been created successfully.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {createError && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error creating event</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{createError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleCreateEvent} className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Event Name*
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700">
              Ticket Symbol*
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="symbol"
                id="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                required
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="TCKT"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Short symbol for NFT tickets (e.g., TCKT)</p>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700">
              Ticket Price (ETH)*
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="ticketPrice"
                id="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleInputChange}
                required
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="0.1"
              />
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="maxTickets" className="block text-sm font-medium text-gray-700">
              Maximum Tickets*
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="maxTickets"
                id="maxTickets"
                value={formData.maxTickets}
                onChange={handleInputChange}
                required
                min="1"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="100"
              />
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="resaleLimitMultiplier" className="block text-sm font-medium text-gray-700">
              Resale Limit (%)
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="resaleLimitMultiplier"
                id="resaleLimitMultiplier"
                value={formData.resaleLimitMultiplier}
                onChange={handleInputChange}
                min="100"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Maximum % of original price for resale (e.g., 120 = 120%)</p>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="venueFeePercentage" className="block text-sm font-medium text-gray-700">
              Venue Fee (Basis Points)
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="venueFeePercentage"
                id="venueFeePercentage"
                value={formData.venueFeePercentage}
                onChange={handleInputChange}
                min="0"
                max="3000"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Fee for secondary sales in basis points (e.g., 500 = 5%)</p>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isCreating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Event...
              </>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Events</h2>
        
        {withdrawSuccess && selectedEvent && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Funds withdrawn successfully!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>You have withdrawn {formatEther(selectedEvent.withdrawnAmount)} ETH from {selectedEvent.name}.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {withdrawError && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error withdrawing funds</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{withdrawError}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : events.filter(e => e.isOwnedByUser).length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">No events found</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You haven't created any events yet.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {events
                .filter(event => event.isOwnedByUser)
                .map((event) => (
                  <li key={event.address} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="truncate text-sm font-medium text-primary-600">{event.name}</p>
                        <p className="mt-2 flex items-center text-sm text-gray-500">
                          <span className="truncate">
                            {formatEther(event.ticketPrice)} ETH | {event.ticketsSold.toString()}/{event.maxTickets.toString()} tickets sold
                          </span>
                        </p>
                      </div>
                      <div className="ml-2 flex flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          Number(event.currentPhase) === 0 
                            ? 'bg-green-100 text-green-800' 
                            : Number(event.currentPhase) === 1 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {getPhase(event.currentPhase)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        {event.eventDate > 0 && (
                          <p className="flex items-center text-sm text-gray-500">
                            Date: {formatDate(event.eventDate)}
                          </p>
                        )}
                        {event.eventLocation && (
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            Location: {event.eventLocation}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span className="text-xs">
                          Contract: <Link to={`/events/${event.address}`} className="text-primary-600 hover:text-primary-900">{event.address.substr(0, 6)}...{event.address.substr(-4)}</Link>
                        </span>
                      </div>
                    </div>
                    
                    {/* Revenue information and withdraw button */}
                    <div className="mt-4 sm:flex sm:justify-between items-center">
                      <div className="border rounded-md p-2 bg-gray-50">
                        <div className="flex flex-col text-xs text-gray-600">
                          <p>Primary Revenue: {formatEther(event.primaryRevenue)} ETH</p>
                          <p>Secondary Revenue: {formatEther(event.secondaryRevenue)} ETH</p>
                          <p className="font-medium mt-1">Total Revenue: {formatEther(event.totalRevenue)} ETH</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 sm:mt-0">
                        {ethers.formatEther(event.totalRevenue) !== '0.0' ? (
                          <button
                            type="button"
                            onClick={() => handleWithdrawFunds(event.address)}
                            disabled={withdrawLoading}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            {withdrawLoading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Withdrawing...
                              </>
                            ) : (
                              'Withdraw Funds'
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">No funds to withdraw</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Management buttons */}
                    <div className="mt-4 flex space-x-2">
                      <Link 
                        to={`/admin/manage-event/${event.address}`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Manage Event
                      </Link>
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

export default EventManagement; 