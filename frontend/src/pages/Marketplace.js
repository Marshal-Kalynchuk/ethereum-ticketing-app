import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { formatDate } from '../utils/constants';

// Import ABIs
import TicketNFTABI from '../utils/abis/TicketNFT.json';
import EventABI from '../utils/abis/Event.json';

function Marketplace() {
  const { account, signer, formatEther, contracts, networkId } = useWeb3();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!signer || !account || !contracts.ticketingSystem) {
          throw new Error('Please connect your wallet');
        }
        
        // Get number of events from ticketing system
        const eventCount = await contracts.ticketingSystem.getDeployedEventsCount();
        
        // For each event, check for ticket listings
        const allListings = [];

        for (let eventIndex = 0; eventIndex < eventCount; eventIndex++) {
          try {
            // Get event address from ticketing system
            const eventAddress = await contracts.ticketingSystem.deployedEvents(eventIndex);
            
            // Create event contract instance
            const eventInstance = new ethers.Contract(
              eventAddress,
              EventABI.abi,
              signer
            );
            
            // Get event details
            const eventName = await eventInstance.eventName();
            
            // Get NFT contract address from event
            const nftAddress = await eventInstance.ticketNFT();
            
            // Create NFT contract instance
            const nftContract = new ethers.Contract(
              nftAddress,
              TicketNFTABI.abi,
              signer
            );
            
            // For simplicity, we'll scan token IDs 1-30 to find listings
            // In a production app, you would use events to track listings
            for (let i = 1; i <= 30; i++) {
              try {
                // Check if token exists by checking if it has an owner
                const owner = await nftContract.ownerOf(i);
                
                // Get market listing details
                const listing = await nftContract.marketItems(i);
                
                if (listing.isForSale) {
                  // Get ticket details
                  const originalPrice = await nftContract.originalPrice(i);
                  const maxResalePrice = await nftContract.getMaxResalePrice(i);
                  
                  // Try to get ticket metadata
                  let seatInfo = '';
                  let ticketType = '';
                  let eventDate = 0;
                  
                  try {
                    [seatInfo, ticketType, eventDate] = await nftContract.getTicketMetadata(i);
                  } catch (err) {
                    console.log('Metadata not available for ticket', i);
                  }
                  
                  allListings.push({
                    tokenId: i,
                    owner,
                    seller: listing.seller,
                    askingPrice: listing.askingPrice,
                    originalPrice,
                    maxResalePrice,
                    seatInfo,
                    ticketType,
                    eventDate,
                    eventName,
                    eventAddress,
                    nftAddress
                  });
                }
              } catch (err) {
                // Token doesn't exist or other error, skip it
                continue;
              }
            }
          } catch (err) {
            console.error(`Error processing event ${eventIndex}:`, err);
            // Continue to next event even if this one fails
          }
        }
        
        setListings(allListings);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (signer && account && contracts.ticketingSystem) {
      fetchListings();
    }
  }, [signer, account, contracts.ticketingSystem, networkId]);

  const purchaseTicket = async (listing) => {
    try {
      setPurchaseLoading(listing.tokenId);
      setPurchaseSuccess(null);
      setPurchaseError(null);
      
      // Connect to the NFT contract
      const nftContract = new ethers.Contract(
        listing.nftAddress,
        TicketNFTABI.abi,
        signer
      );
      
      // Purchase the ticket
      const tx = await nftContract.purchaseTicket(listing.tokenId, {
        value: listing.askingPrice
      });
      
      await tx.wait();
      
      // Remove the listing from state
      const updatedListings = listings.filter(
        item => item.tokenId.toString() !== listing.tokenId.toString()
      );
      
      setListings(updatedListings);
      setPurchaseSuccess(listing.tokenId);
      setPurchaseLoading(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPurchaseSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      setPurchaseError(err.message);
      setPurchaseLoading(null);
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
            <h3 className="text-sm font-medium text-red-800">Error loading marketplace</h3>
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
        <h1 className="text-2xl font-bold text-gray-900">Ticket Marketplace</h1>
        <p className="mt-2 text-gray-600">Browse and purchase tickets from other users</p>
      </div>
      
      {purchaseSuccess && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
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
        <div className="mb-6 rounded-md bg-red-50 p-4">
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
      
      {listings.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No tickets available</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>There are no tickets listed for sale at the moment.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.tokenId.toString()} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 truncate">
                  {listing.eventName} - Ticket #{listing.tokenId.toString()}
                </h3>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium text-gray-500">Price</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatEther(listing.askingPrice)} ETH
                    </dd>
                  </div>
                  
                  <div className="mt-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium text-gray-500">Original Price</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatEther(listing.originalPrice)} ETH
                    </dd>
                  </div>
                  
                  {listing.seatInfo && (
                    <div className="mt-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium text-gray-500">Seat</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {listing.seatInfo}
                      </dd>
                    </div>
                  )}
                  
                  {listing.ticketType && (
                    <div className="mt-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {listing.ticketType}
                      </dd>
                    </div>
                  )}
                  
                  {listing.eventDate > 0 && (
                    <div className="mt-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium text-gray-500">Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(listing.eventDate)}
                      </dd>
                    </div>
                  )}
                </dl>
                
                <div className="mt-5">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => purchaseTicket(listing)}
                    disabled={purchaseLoading === listing.tokenId || account.toLowerCase() === listing.seller.toLowerCase()}
                  >
                    {purchaseLoading === listing.tokenId ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : account.toLowerCase() === listing.seller.toLowerCase() ? (
                      "This is your listing"
                    ) : (
                      `Buy Now (${formatEther(listing.askingPrice)} ETH)`
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Marketplace; 