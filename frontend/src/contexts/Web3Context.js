import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Import ABI files from the artifacts
import TicketingSystemABI from '../utils/abis/TicketingSystem.json';
import EventABI from '../utils/abis/Event.json';
import TicketNFTABI from '../utils/abis/TicketNFT.json';

// Import constants
import { getContractAddresses } from '../utils/constants';

// Local storage key for persisting connection
const WALLET_CONNECTED_KEY = 'ticketing_wallet_connected';

// Create context
const Web3Context = createContext();

// Provider component
export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Connect to Web3 provider
  const connectWallet = useCallback(async (forceConnect = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to use this application.");
      }

      // Request account access - use different method if forceConnect is true
      const accounts = forceConnect 
        ? await window.ethereum.request({ 
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          }).then(() => window.ethereum.request({ method: 'eth_requestAccounts' }))
        : await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please connect to MetaMask.");
      }
      
      // Create ethers provider and signer
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();
      
      // Get network information
      const network = await ethersProvider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Set state
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setAccount(accounts[0]);
      setNetworkId(chainId);
      
      // Store connection state in localStorage
      localStorage.setItem(WALLET_CONNECTED_KEY, 'true');
      
      // Setup contracts
      const deployedContracts = {};
      
      // For Hardhat local blockchain (chainId 31337 or 1337)
      if (chainId === 31337 || chainId === 1337) {
        // Get addresses from constants
        const addresses = getContractAddresses(chainId);
        
        // Connect to contracts
        try {
          // Only connect to the ticketing system
          if (addresses.TICKETING_SYSTEM) {
            deployedContracts.ticketingSystem = new ethers.Contract(
              addresses.TICKETING_SYSTEM,
              TicketingSystemABI.abi,
              ethersSigner
            );
          } else {
            throw new Error("Ticketing system address not found");
          }
        } catch (err) {
          console.error("Error connecting to contracts:", err);
          setError("Error connecting to smart contracts. Please check if they are deployed.");
        }
      } else {
        // For other networks, we would need to set up appropriate contract addresses
        setError("Please connect to the local blockchain (Hardhat network)");
      }
      
      setContracts(deployedContracts);
      setIsLoading(false);
    } catch (err) {
      console.error("Error connecting to wallet:", err);
      setError(err.message);
      setIsLoading(false);
      
      // Clear localStorage on connection error
      localStorage.removeItem(WALLET_CONNECTED_KEY);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    // Clear all state
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setNetworkId(null);
    setContracts({});
    setError(null);
    
    // Clear localStorage connection flag
    localStorage.removeItem(WALLET_CONNECTED_KEY);
    
    // Clear any other localStorage that might be caching connection
    try {
      if (window && window.localStorage) {
        // Remove MetaMask connection data if any exists
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
      }
    } catch (err) {
      console.error("Error clearing localStorage:", err);
    }
  }, []);

  // Auto-connect on startup if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      // Check if we were previously connected
      const wasConnected = localStorage.getItem(WALLET_CONNECTED_KEY) === 'true';
      
      if (wasConnected && window.ethereum) {
        try {
          // Check if we're already connected to MetaMask
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            // Silently reconnect
            await connectWallet(false);
          } else {
            // If no accounts found but flag was true, clear the flag
            localStorage.removeItem(WALLET_CONNECTED_KEY);
          }
        } catch (err) {
          console.error("Error auto-connecting:", err);
          localStorage.removeItem(WALLET_CONNECTED_KEY);
        }
      }
    };
    
    autoConnect();
  }, [connectWallet]);

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        disconnectWallet();
      } else if (accounts[0] !== account) {
        // If the account has changed, we need to reconnect with the new account
        // Use a simplified reconnect to avoid resetting the entire UI
        if (provider) {
          try {
            const ethersSigner = await provider.getSigner();
            setSigner(ethersSigner);
            setAccount(accounts[0]);
            
            // Reconnect contracts with new signer
            if (Object.keys(contracts).length > 0) {
              const updatedContracts = {};
              for (const [name, contract] of Object.entries(contracts)) {
                updatedContracts[name] = contract.connect(ethersSigner);
              }
              setContracts(updatedContracts);
            }
          } catch (err) {
            console.error("Error reconnecting with new account:", err);
            // If reconnect fails, just do a full disconnect
            disconnectWallet();
          }
        } else {
          // If no provider, do a full reconnect
          connectWallet();
        }
      }
    };

    const handleChainChanged = (_chainId) => {
      console.log("Chain changed:", _chainId);
      window.location.reload();
    };

    const handleDisconnect = (error) => {
      console.log("Provider disconnected:", error);
      disconnectWallet();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [account, provider, contracts, connectWallet, disconnectWallet]);

  // Format ethers for display
  const formatEther = (value) => {
    if (!value) return '0';
    return ethers.formatEther(value);
  };

  // Parse ethers from string
  const parseEther = (value) => {
    try {
      return ethers.parseEther(value);
    } catch (error) {
      return ethers.parseEther('0');
    }
  };

  // Context value
  const value = {
    provider,
    signer,
    account,
    networkId,
    contracts,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    formatEther,
    parseEther
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use the Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}; 