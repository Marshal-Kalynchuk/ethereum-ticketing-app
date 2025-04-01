import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { formatDate, getContractAddresses } from '../utils/constants';

// Import ABIs
import TicketNFTABI from '../utils/abis/TicketNFT.json';
import EventABI from '../utils/abis/Event.json';

function MyTickets() {
  const { account, signer, formatEther, parseEther, networkId } = useWeb3();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listingData, setListingData] = useState({
    tokenId: null,
    price: '',
    loading: false,
    error: null,
    success: false
  });

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!signer || !account) {
          throw new Error('Please connect your wallet');
        }
        
        // Get addresses from constants based on the current network
        const addresses = getContractAddresses(networkId);
        const nftAddress = addresses.TICKET_NFT;
        const eventAddress = addresses.EVENT;
        
        if (!nftAddress || !eventAddress) {
          throw new Error('Contract addresses not found for this network');
        }
        
        // Connect to contracts
        const nftContract = new ethers.Contract(
          nftAddress,
          TicketNFTABI.abi,
          signer
        );
        
        const eventContract = new ethers.Contract(
          eventAddress,
          EventABI.abi,
          signer
        );
        
        // Get event details
        const eventName = await eventContract.eventName();
        
        // Get number of tickets owned by the user
        const balance = await nftContract.balanceOf(account);
        
        if (balance === 0) {
          setTickets([]);
          setLoading(false);
          return;
        }
        
        // Get token IDs for the user
        const ticketPromises = [];
        
        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
          
          // Get ticket details
          const originalPrice = await nftContract.originalPrice(tokenId);
          const maxResalePrice = await nftContract.getMaxResalePrice(tokenId);
          
          // Check if the ticket is listed for sale
          const listing = await nftContract.marketItems(tokenId);
          
          // Try to get ticket metadata
          let seatInfo = '';
          let ticketType = '';
          let eventDate = 0;
          
          try {
            [seatInfo, ticketType, eventDate] = await nftContract.getTicketMetadata(tokenId);
          } catch (err) {
            console.log('Metadata not available for ticket', tokenId);
          }
          
          ticketPromises.push({
            tokenId,
            originalPrice,
            maxResalePrice,
            isForSale: listing.isForSale,
            askingPrice: listing.askingPrice,
            seller: listing.seller,
            seatInfo,
            ticketType,
            eventDate,
            eventName,
            eventAddress,
            nftAddress
          });
        }
        
        const ticketResults = await Promise.all(ticketPromises);
        setTickets(ticketResults);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (signer && account) {
      fetchTickets();
    }
  }, [signer, account, networkId]);

  const handleListingPriceChange = (e) => {
    setListingData({
      ...listingData,
      price: e.target.value
    });
  };

  const startListing = (ticket) => {
    setListingData({
      tokenId: ticket.tokenId,
      price: formatEther(ticket.maxResalePrice),
      loading: false,
      error: null,
      success: false
    });
  };

  const cancelListing = () => {
    setListingData({
      tokenId: null,
      price: '',
      loading: false,
      error: null,
      success: false
    });
  };

  const listTicketForSale = async () => {
    try {
      setListingData({
        ...listingData,
        loading: true,
        error: null,
        success: false
      });
      
      if (!listingData.tokenId || !listingData.price) {
        throw new Error('Invalid ticket or price');
      }
      
      const ticket = tickets.find(t => t.tokenId.toString() === listingData.tokenId.toString());
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      // Connect to the NFT contract
      const nftContract = new ethers.Contract(
        ticket.nftAddress,
        TicketNFTABI.abi,
        signer
      );
      
      // Check if price is within max resale price
      const priceInWei = parseEther(listingData.price);
      
      if (priceInWei > ticket.maxResalePrice) {
        throw new Error(`Price exceeds maximum allowed (${formatEther(ticket.maxResalePrice)} ETH)`);
      }
      
      // List ticket for sale
      const tx = await nftContract.listTicketForSale(ticket.tokenId, priceInWei);
      await tx.wait();
      
      // Update ticket in state
      const updatedTickets = tickets.map(t => {
        if (t.tokenId.toString() === ticket.tokenId.toString()) {
          return {
            ...t,
            isForSale: true,
            askingPrice: priceInWei
          };
        }
        return t;
      });
      
      setTickets(updatedTickets);
      
      setListingData({
        ...listingData,
        loading: false,
        success: true
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setListingData({
          tokenId: null,
          price: '',
          loading: false,
          error: null,
          success: false
        });
      }, 3000);
    } catch (err) {
      console.error('Error listing ticket:', err);
      setListingData({
        ...listingData,
        loading: false,
        error: err.message
      });
    }
  };

  const cancelTicketListing = async (ticket) => {
    try {
      if (!ticket || !ticket.tokenId) {
        throw new Error('Invalid ticket');
      }
      
      // Connect to the NFT contract
      const nftContract = new ethers.Contract(
        ticket.nftAddress,
        TicketNFTABI.abi,
        signer
      );
      
      // Cancel listing
      const tx = await nftContract.cancelListing(ticket.tokenId);
      await tx.wait();
      
      // Update ticket in state
      const updatedTickets = tickets.map(t => {
        if (t.tokenId.toString() === ticket.tokenId.toString()) {
          return {
            ...t,
            isForSale: false,
            askingPrice: ethers.parseEther("0")
          };
        }
        return t;
      });
      
      setTickets(updatedTickets);
    } catch (err) {
      console.error('Error cancelling listing:', err);
      alert(`Error: ${err.message}`);
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
            <h3 className="text-sm font-medium text-red-800">Error loading tickets</h3>
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
        <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
        <p className="mt-2 text-gray-600">View and manage your NFT tickets</p>
      </div>
      
      {tickets.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No tickets found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You don't have any tickets yet. Visit the Events page to purchase tickets.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <li key={ticket.tokenId.toString()} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600 truncate">
                      {ticket.eventName} - Ticket #{ticket.tokenId.toString()}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Original Price: {formatEther(ticket.originalPrice)} ETH
                    </p>
                    {ticket.seatInfo && (
                      <p className="mt-1 text-sm text-gray-500">
                        Seat: {ticket.seatInfo}
                      </p>
                    )}
                    {ticket.ticketType && (
                      <p className="mt-1 text-sm text-gray-500">
                        Type: {ticket.ticketType}
                      </p>
                    )}
                    {ticket.eventDate > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        Date: {formatDate(ticket.eventDate)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    {ticket.isForSale ? (
                      <div className="text-right">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Listed for {formatEther(ticket.askingPrice)} ETH
                        </div>
                        <button
                          type="button"
                          onClick={() => cancelTicketListing(ticket)}
                          className="ml-3 inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Cancel Listing
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startListing(ticket)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        List For Sale
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Listing Modal */}
      {listingData.tokenId && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    List Ticket For Sale
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Set a price to list your ticket on the marketplace. The maximum allowed price is {formatEther(tickets.find(t => t.tokenId.toString() === listingData.tokenId.toString())?.maxResalePrice || 0)} ETH.
                    </p>
                    
                    {listingData.error && (
                      <div className="mt-2 rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">{listingData.error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {listingData.success && (
                      <div className="mt-2 rounded-md bg-green-50 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">Ticket listed successfully!</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 text-left">
                        Price (ETH)
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="price"
                          id="price"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          value={listingData.price}
                          onChange={handleListingPriceChange}
                          disabled={listingData.loading || listingData.success}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
                  onClick={listTicketForSale}
                  disabled={listingData.loading || listingData.success}
                >
                  {listingData.loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'List Ticket'
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={cancelListing}
                  disabled={listingData.loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTickets; 