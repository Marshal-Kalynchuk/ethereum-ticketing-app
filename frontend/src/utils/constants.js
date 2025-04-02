// Read contract addresses from environment variables
const TICKETING_SYSTEM_ADDRESS = process.env.REACT_APP_TICKETING_SYSTEM_ADDRESS;

// Get supported chain IDs from environment variables
const SUPPORTED_CHAIN_IDS = (process.env.REACT_APP_SUPPORTED_CHAIN_IDS || '31337,1337,11155111')
  .split(',')
  .map(Number);

// Contract addresses for different networks
export const CONTRACTS = {
  // Local Hardhat network (chainId 31337 or 1337)
  31337: {
    // Only keeping the ticketing system address
    TICKETING_SYSTEM: TICKETING_SYSTEM_ADDRESS,
  },
  1337: {
    // Same as above, for Hardhat network with chainId 1337
    TICKETING_SYSTEM: TICKETING_SYSTEM_ADDRESS,
  },
  // Sepolia testnet
  11155111: {
    TICKETING_SYSTEM: TICKETING_SYSTEM_ADDRESS,
  },
};

// Helper to get contract addresses based on network ID
export const getContractAddresses = (networkId) => {
  return CONTRACTS[networkId] || {};
};

// Format Ethereum address for display
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format date from timestamp
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Network names
export const NETWORK_NAMES = {
  1: 'Ethereum Mainnet',
  3: 'Ropsten Testnet',
  4: 'Rinkeby Testnet',
  5: 'Goerli Testnet',
  42: 'Kovan Testnet',
  1337: 'Hardhat Local',
  31337: 'Hardhat Local',
  11155111: 'Sepolia Testnet',
};

// Get network name by ID
export const getNetworkName = (networkId) => {
  return NETWORK_NAMES[networkId] || `Unknown Network (${networkId})`;
}; 