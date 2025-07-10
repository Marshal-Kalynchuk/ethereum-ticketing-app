# NFTicket: A Blockchain-based Ticketing Platform


<!-- Tech-stack badges -->
[![Solidity ^0.8.20](https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity)](https://soliditylang.org)
[![Hardhat 2.x](https://img.shields.io/badge/Hardhat-2.x-F1C40F?logo=ethereum&logoColor=white)](https://hardhat.org)
[![ethers.js 6.x](https://img.shields.io/badge/ethers.js-6.x-2D3748)](https://docs.ethers.io)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Tailwind CSS 3](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://typescriptlang.org)
[![Sepolia Testnet](https://img.shields.io/badge/Network-Sepolia-563D7C?logo=ethereum)](https://sepolia.etherscan.io)


## Revolutionizing Event Ticketing with Blockchain Technology

NFTicket is a decentralized ticketing platform built on Ethereum that transforms how venues create events and how fans purchase and trade tickets. By leveraging blockchain technology and NFTs (Non-Fungible Tokens), we've created a secure, transparent, and fair ticketing ecosystem for everyone.

## ✨ Key Features

### For Event Organizers
- **Complete Control**: Set prices, manage sales, and control secondary market parameters
- **Anti-Scalping Technology**: Define maximum resale prices to prevent ticket scalping
- **Revenue Streams**: Collect royalties from secondary market sales automatically
- **Fraud Prevention**: Eliminate counterfeit tickets with blockchain verification
- **Real-time Analytics**: Track sales, attendance, and market activity

### For Attendees
- **Guaranteed Authenticity**: Every ticket is verifiable on the blockchain
- **Digital Ownership**: Tickets exist as NFTs in your personal wallet
- **Seamless Transfers**: Easily transfer or gift tickets to friends and family
- **Fair Secondary Market**: Buy and sell tickets at reasonable prices
- **Collectible Memorabilia**: Keep your ticket NFTs as digital mementos after events

## 🛠️ Technical Architecture

The platform is built around three core smart contracts:

1. **TicketingSystem**: Central hub that authorizes venues and manages event creation
2. **Event**: Handles specific event details, ticket types, and primary sales
3. **TicketNFT**: ERC721 implementation with built-in marketplace functionality

## 🔄 How It Works

1. Venues create unique event contracts through our platform
2. Customizable ticket types with different prices and seat information
3. Fans purchase tickets directly from the event contract
4. Tickets are minted as NFTs directly to the buyer's wallet
5. Secondary sales occur through our built-in marketplace with price controls
6. Venues collect fees from secondary market activity

## 🚀 Deployment Guide

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


## 📝 License

[MIT](LICENSE)

