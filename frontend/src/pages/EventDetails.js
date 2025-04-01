import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { formatDate } from '../utils/constants';

// Import ABI
import EventABI from '../utils/abis/Event.json';

function EventDetails() {
  const { address } = useParams();
  const { account, signer, formatEther, parseEther } = useWeb3();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!signer) {
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
        const ticketsSold = await eventContract.ticketsSold();
        const maxTickets = await eventContract.maxTickets();
        const nftAddress = await eventContract.ticketNFT();
        const currentPhase = await eventContract.currentPhase();
        const remainingTickets = await eventContract.remainingTickets();
        
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
        
        setEvent({
          address,
          contract: eventContract,
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
          totalRevenue
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (signer && address) {
      fetchEventDetails();
    }
  }, [signer, address]);

  const purchaseTicket = async () => {
    try {
      setPurchaseLoading(true);
      setPurchaseSuccess(false);
      setPurchaseError(null);
      
      if (!event || !event.contract) {
        throw new Error('Event contract not found');
      }
      
      // Check if tickets are available
      const remaining = await event.contract.remainingTickets();
      if (remaining <= 0) {
        throw new Error('No tickets available');
      }
      
      // Purchase ticket
      const tx = await event.contract.purchaseTicket({
        value: event.ticketPrice
      });
      
      await tx.wait();
      
      setPurchaseSuccess(true);
      setPurchaseLoading(false);
      
      // Refresh event details
      const ticketsSold = await event.contract.ticketsSold();
      const remainingTickets = await event.contract.remainingTickets();
      
      setEvent({
        ...event,
        ticketsSold,
        remainingTickets
      });
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      setPurchaseError(err.message);
      setPurchaseLoading(false);
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

  if (!event) {
    return (
      <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Event not found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The event you're looking for does not exist or has been removed.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{event.name}</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Event Details</p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Ticket Price</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatEther(event.ticketPrice)} ETH
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Availability</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {Number(event.ticketsSold)}/{Number(event.maxTickets)} tickets sold
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getPhase(event.currentPhase)}
                </span>
              </dd>
            </div>
            
            {event.eventDate > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(event.eventDate)}
                </dd>
              </div>
            )}
            
            {event.eventLocation && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {event.eventLocation}
                </dd>
              </div>
            )}
            
            {event.eventDescription && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {event.eventDescription}
                </dd>
              </div>
            )}
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Contract Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <code className="bg-gray-100 rounded px-2 py-1 text-xs">{event.address}</code>
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">NFT Contract</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <code className="bg-gray-100 rounded px-2 py-1 text-xs">{event.nftAddress}</code>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      <div className="mt-8 bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Purchase Tickets</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Buy tickets directly from the venue.</p>
          </div>
          
          {Number(event.remainingTickets) > 0 ? (
            <div className="mt-5">
              {purchaseSuccess && (
                <div className="rounded-md bg-green-50 p-4 mb-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Ticket purchased successfully!</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your ticket has been added to your collection. View it in the My Tickets section.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {purchaseError && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error purchasing ticket</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{purchaseError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={purchaseTicket}
                disabled={purchaseLoading}
              >
                {purchaseLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  `Buy Ticket (${formatEther(event.ticketPrice)} ETH)`
                )}
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">No tickets available</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This event is sold out. Check the marketplace for resale tickets.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventDetails; 