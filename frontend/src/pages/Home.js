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
              This blockchain-powered ticketing platform revolutionizes event management using Ethereum smart contracts and Non-Fungible Tokens (NFTs).
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-medium text-indigo-800 mb-2">For Event Organizers</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Create and manage events with customizable ticket types
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Control resale price limits to prevent ticket scalping
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Earn royalties from secondary market sales automatically
                  </li>
                </ul>
              </div>
              
              <div className="bg-emerald-50 rounded-lg p-4">
                <h4 className="font-medium text-emerald-800 mb-2">For Ticket Buyers</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Purchase authentic tickets directly on the blockchain
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Resell tickets at fair prices through the built-in marketplace
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Own tickets as unique NFTs in your crypto wallet
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <h4 className="font-medium text-gray-800 mb-2">Technical Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">ERC-721</span>
                  <span className="text-sm text-gray-600">NFT Token Standard</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">Smart Contracts</span>
                  <span className="text-sm text-gray-600">Solidity-based Logic</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">React</span>
                  <span className="text-sm text-gray-600">Modern Frontend</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">ethers.js</span>
                  <span className="text-sm text-gray-600">Blockchain Integration</span>
                </div>
              </div>
              
              <div className="space-y-3 mt-3">
                <details className="group">
                  <summary className="flex items-center cursor-pointer text-sm font-medium text-gray-700 hover:text-indigo-600">
                    <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Smart Contract Architecture
                  </summary>
                  <div className="mt-2 pl-7 text-sm text-gray-600 group-open:animate-fadeIn">
                    <p className="mb-2">The application uses a factory pattern with three main contracts:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-medium">TicketingSystem</span> - Main factory contract that manages venues and event creation</li>
                      <li><span className="font-medium">Event</span> - Created for each event, handles primary ticket sales and event details</li>
                      <li><span className="font-medium">TicketNFT</span> - ERC-721 implementation that manages ticket ownership and transfers</li>
                    </ul>
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center cursor-pointer text-sm font-medium text-gray-700 hover:text-indigo-600">
                    <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Blockchain Implementation
                  </summary>
                  <div className="mt-2 pl-7 text-sm text-gray-600 group-open:animate-fadeIn">
                    <p>Built on Ethereum, the system utilizes:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Gas-optimized smart contracts using OpenZeppelin libraries</li>
                      <li>Custom transfer mechanism with price ceilings to prevent scalping</li>
                      <li>Automatic royalty distribution to event organizers on secondary sales</li>
                      <li>Role-based permissions system for venues and administrators</li>
                    </ul>
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center cursor-pointer text-sm font-medium text-gray-700 hover:text-indigo-600">
                    <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Frontend & Web3 Integration
                  </summary>
                  <div className="mt-2 pl-7 text-sm text-gray-600 group-open:animate-fadeIn">
                    <p className="mb-2">The React frontend uses modern patterns including:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Context API for global blockchain state management</li>
                      <li>React Router for navigation between application sections</li>
                      <li>ethers.js for type-safe contract interactions</li>
                      <li>Tailwind CSS for responsive, utility-first styling</li>
                      <li>Real-time blockchain event monitoring for UI updates</li>
                    </ul>
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center cursor-pointer text-sm font-medium text-gray-700 hover:text-indigo-600">
                    <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Security Features
                  </summary>
                  <div className="mt-2 pl-7 text-sm text-gray-600 group-open:animate-fadeIn">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Reentrancy protection on all financial transactions</li>
                      <li>Role-based access control for administrative functions</li>
                      <li>Circuit breaker pattern to prevent exploits during emergencies</li>
                      <li>Input validation and error handling to prevent unauthorized operations</li>
                      <li>Secure transfer mechanisms for ticket ownership changes</li>
                    </ul>
                  </div>
                </details>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 italic">
              This is a demonstration application built for educational purposes. Connect with MetaMask or another Web3 wallet to interact with the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 