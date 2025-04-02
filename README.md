# Ethereum Ticketing System

A decentralized blockchain-based ticketing platform built on Ethereum. This system enables venues to create events, sell tickets as NFTs, and control secondary market resale prices.

## Architecture

The system is built around three core smart contracts:

1. **TicketingSystem.sol**: The main contract that venues interact with. Manages venue authorization and acts as a factory for creating new event contracts.

2. **Event.sol**: Represents a specific event with configurable parameters. Handles primary ticket sales, revenue tracking, and event metadata management.

3. **TicketNFT.sol**: Implements ERC721 NFT standard for tickets with built-in marketplace functionality and resale price restrictions.

## Features

### For Venues
- **Authorization System**: Only approved venues can create events
- **Event Management**: Configure event details, ticket types, and prices
- **Revenue Collection**: Withdraw funds from primary sales and secondary market fees
- **Resale Control**: Set limits on secondary market prices to prevent scalping
- **Metadata Management**: Customize ticket information including seat details

### For Users
- **Primary Market**: Purchase tickets directly from venues
- **Secondary Market**: Built-in marketplace for reselling tickets
- **NFT Ownership**: Tickets represented as NFTs with verifiable authenticity
- **Ticket Metadata**: View detailed information about tickets including seat, type, and event details

### Technical Features
- **Advanced NFT Implementation**: ERC721 with enumerable extension for better ticket tracking
- **Security**: Reentrancy protection and comprehensive error handling
- **Fee Management**: Configurable venue fees from secondary sales
- **Testing**: Comprehensive test suite for all smart contract functionality

## Project Structure

```
├── contracts/              # Solidity smart contracts
│   ├── TicketingSystem.sol # Main factory contract
│   ├── Event.sol           # Event-specific contract
│   └── TicketNFT.sol       # NFT implementation for tickets
├── frontend/               # React-based web interface
│   ├── src/                # Frontend source code
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── scripts/                # Deployment and utility scripts
├── test/                   # Test suite
├── deployments/            # Deployment artifacts
└── hardhat.config.js       # Hardhat configuration
```

## Setup

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- MetaMask or other Ethereum wallet

### Backend Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ethereum-ticketing
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file based on `.env.example` with your configuration:
```
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Frontend Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` with your configuration.

## Usage

### Smart Contract Development

Compile contracts:
```bash
npm run compile
```

Run tests:
```bash
npm test
```

### Deployment

Start a local blockchain node:
```bash
npm run node
```

Deploy to local network:
```bash
npm run deploy:local
```

Deploy to testnet:
```bash
npm run deploy:sepolia
```

### Frontend Development

Start the development server:
```bash
cd frontend
npm start
```

### Testnet Information

For testing on Ethereum testnets:

- Sepolia Faucet: [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- Goerli Faucet: [Goerli Faucet](https://goerlifaucet.com/)
- Supported networks: Sepolia, Goerli

## Smart Contract Flow

1. System owner authorizes venues
2. Venues create events with specific parameters
3. Users purchase tickets directly from event contracts
4. Tickets are minted as NFTs to user wallets
5. Users can resell tickets within venue-defined price limits
6. Venues collect fees from secondary sales

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE) 