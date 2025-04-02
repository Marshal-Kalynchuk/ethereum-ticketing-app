import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

function ConnectWallet() {
  const { connectWallet, isLoading, error } = useWeb3();

  const handleConnect = () => {
    // Use forceConnect=true to force MetaMask to show the account selection dialog
    connectWallet(true);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Ethereum Ticketing System
        </h2>
        <p className="text-gray-600 mb-6">
          Connect your wallet to buy, sell, and manage NFT tickets
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Make sure you have MetaMask installed and connected to the <span className="font-medium text-indigo-600">Sepolia testnet</span></p>
          <div className="mt-2 p-3 bg-yellow-50 rounded-md border border-yellow-100">
            <p className="text-yellow-800 font-medium mb-1">Important:</p>
            <p className="text-yellow-700">This application requires the Sepolia testnet. Please configure your wallet to use Sepolia and make sure you have test ETH.</p>
            <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-indigo-600 hover:text-indigo-800 underline">
              Get Sepolia test ETH here →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectWallet; 