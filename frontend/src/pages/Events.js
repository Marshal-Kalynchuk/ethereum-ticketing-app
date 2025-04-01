import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { formatDate } from '../utils/constants';

function Events() {
  const { contracts, formatEther } = useWeb3();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!contracts.ticketingSystem) {
          throw new Error('Ticketing system contract not found');
        }
        
        // Get number of events
        const eventCount = await contracts.ticketingSystem.getDeployedEventsCount();
        
        // For each event, get its details
        const eventPromises = [];
        
        for (let i = 0; i < eventCount; i++) {
          const eventAddress = await contracts.ticketingSystem.deployedEvents(i);
          
          // Create contract instance
          const Event = await contracts.ticketingSystem.runner.provider.getCode(eventAddress);
          
          if (Event === '0x') {
            continue; // Skip if contract doesn't exist
          }
          
          // Create interface to interact with this event
          const eventInstance = await contracts.event.attach(eventAddress);
          
          // Get event details
          const eventName = await eventInstance.eventName();
          const ticketPrice = await eventInstance.ticketPrice();
          const ticketsSold = await eventInstance.ticketsSold();
          const maxTickets = await eventInstance.maxTickets();
          
          // Get ticket NFT address
          const nftAddress = await eventInstance.ticketNFT();
          
          // Try to get event details if available
          let eventDate = 0;
          let eventLocation = '';
          let eventDescription = '';
          
          try {
            eventDate = await eventInstance.eventDate();
            eventLocation = await eventInstance.eventLocation();
            eventDescription = await eventInstance.eventDescription();
          } catch (err) {
            // Event details may not be set yet
            console.log('Event details not available:', err);
          }
          
          eventPromises.push({
            address: eventAddress,
            name: eventName,
            ticketPrice,
            ticketsSold,
            maxTickets,
            nftAddress,
            eventDate,
            eventLocation,
            eventDescription
          });
        }
        
        const eventResults = await Promise.all(eventPromises);
        setEvents(eventResults);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (contracts.ticketingSystem) {
      fetchEvents();
    }
  }, [contracts]);

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
            <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Available Events</h1>
        <p className="mt-2 text-gray-600">Browse and purchase tickets for these events</p>
      </div>
      
      {events.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No events found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>There are no events available at the moment.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.address} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 truncate">{event.name}</h3>
                
                <div className="mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium text-gray-900">{formatEther(event.ticketPrice)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Availability:</span>
                    <span className="font-medium text-gray-900">
                      {Number(event.ticketsSold)}/{Number(event.maxTickets)} tickets sold
                    </span>
                  </div>
                  {event.eventDate > 0 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(event.eventDate)}</span>
                    </div>
                  )}
                  {event.eventLocation && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium text-gray-900">{event.eventLocation}</span>
                    </div>
                  )}
                </div>
                
                {event.eventDescription && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{event.eventDescription}</p>
                )}
                
                <div className="mt-4">
                  <Link
                    to={`/events/${event.address}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Events; 