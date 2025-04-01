import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Import ABI files from the artifacts
import TicketingSystemABI from '../utils/abis/TicketingSystem.json';
import EventABI from '../utils/abis/Event.json';
import TicketNFTABI from '../utils/abis/TicketNFT.json';

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
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to use this application.");
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create ethers provider and signer
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();
      
      // Get network information
      const network = await ethersProvider.getNetwork();
      
      // Set state
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setAccount(accounts[0]);
      setNetworkId(Number(network.chainId));
      
      // Setup contracts
      const deployedContracts = {};
      
      // For Hardhat local blockchain (chainId 31337 or 1337)
      if (Number(network.chainId) === 31337 || Number(network.chainId) === 1337) {
        // Use the contract addresses that work with the rest of the app
        const eventAddress = '0x440C0fCDC317D69606eabc35C0F676D1a8251Ee1';
        const nftAddress = '0x9bd03768a7DCc129555dE410FF8E85528A4F88b5';
        
        // Connect to contracts
        try {
          // Connect to the event contract
          deployedContracts.event = new ethers.Contract(
            eventAddress,
            EventABI.abi,
            ethersSigner
          );
          
          // Connect to the NFT contract
          deployedContracts.ticketNFT = new ethers.Contract(
            nftAddress,
            TicketNFTABI.abi,
            ethersSigner
          );
          
          // Try to find the ticketing system
          try {
            const ticketingSystemAddress = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853';
            deployedContracts.ticketingSystem = new ethers.Contract(
              ticketingSystemAddress,
              TicketingSystemABI.abi,
              ethersSigner
            );
          } catch (err) {
            console.log("Ticketing system contract not available, continuing...");
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
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setNetworkId(null);
    setContracts({});
  }, []);

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (_chainId) => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, disconnectWallet]);

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