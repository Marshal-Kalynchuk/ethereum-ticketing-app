import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { getNetworkName } from '../utils/constants';

function Home() {
  const { account, networkId } = useWeb3();
  
  return (
    <div>
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Ethereum NFT Ticketing System
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Buy, sell, and manage event tickets as NFTs with price control and royalties
        </p>
        
        <div className="mt-4 text-sm text-gray-500">
          <div className="bg-green-50 rounded-md p-4 border border-green-100">
            <p className="font-medium text-green-800">
              Connected to {getNetworkName(networkId)}
            </p>
            <p className="text-green-700">
              Account: {account}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-primary-600 p-6">
            <h2 className="text-xl font-semibold text-white">Browse Events</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              View all available events and purchase tickets directly from venues.
            </p>
            <Link 
              to="/events"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View Events
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-primary-600 p-6">
            <h2 className="text-xl font-semibold text-white">My Tickets</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              View and manage your purchased tickets as NFTs.
            </p>
            <Link 
              to="/my-tickets"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View My Tickets
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-primary-600 p-6">
            <h2 className="text-xl font-semibold text-white">Marketplace</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Buy and sell tickets in the secondary market with fair pricing.
            </p>
            <Link 
              to="/marketplace"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View Marketplace
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-12 max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              About this application
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              This application demonstrates a fair ticketing system that uses Ethereum smart contracts and NFTs to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Issue event tickets as NFTs</li>
              <li>Enforce price limits for reselling tickets</li>
              <li>Ensure venues receive fees from secondary sales</li>
              <li>Provide a secure marketplace for buying and selling tickets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 