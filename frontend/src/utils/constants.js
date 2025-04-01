// Contract addresses for different networks
export const CONTRACTS = {
  // Local Hardhat network (chainId 31337 or 1337)
  31337: {
    // These addresses should match those in your local deployment
    TICKETING_SYSTEM: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    EVENT: '0x440C0fCDC317D69606eabc35C0F676D1a8251Ee1',
    TICKET_NFT: '0x9bd03768a7DCc129555dE410FF8E85528A4F88b5',
  },
  1337: {
    // Same as above, for Hardhat network with chainId 1337
    TICKETING_SYSTEM: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    EVENT: '0x440C0fCDC317D69606eabc35C0F676D1a8251Ee1',
    TICKET_NFT: '0x9bd03768a7DCc129555dE410FF8E85528A4F88b5',
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
};

// Get network name by ID
export const getNetworkName = (networkId) => {
  return NETWORK_NAMES[networkId] || `Unknown Network (${networkId})`;
}; 