# Ethereum Ticketing System

This project implements a decentralized ticketing system on Ethereum. Venues can create events, sell tickets as NFTs, and control secondary market resale prices.

## Features

- Master ticketing contract where venues can deploy specific event contracts
- Tickets as NFTs with customizable metadata
- Built-in marketplace with resale price limits
- Venue fee collection from secondary sales
- Extensive metadata support for tickets and events

## Project Setup

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ethereum-ticketing
```

2. Install dependencies
```bash
npm install
```

This will install:
- Hardhat development environment
- OpenZeppelin contracts
- Testing libraries

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Local Deployment

Start a local blockchain node:
```bash
npm run node
```

In a new terminal, deploy the contracts:
```bash
npm run deploy:local
```

### Testnet Information

For testing on Sepolia testnet:

- Sepolia Faucet: [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- Project Wallet: `0x7B55F7dC73a07b912616cCA98d8D4F3979a77123`

## Contract Architecture

The system consists of three main contracts:

1. **TicketingSystem.sol**: The main contract that venues interact with. Handles venue authorization and event creation.

2. **Event.sol**: Represents a specific event. Manages ticket sales, metadata, and revenue collection.

3. **TicketNFT.sol**: Implements the NFT ticket standard with a built-in marketplace and resale restrictions.

## Usage

### For Venues

1. Get authorized by the TicketingSystem owner
2. Create an event with your desired configuration
3. Set event details and ticket types
4. Collect revenue from primary and secondary sales

### For Users

1. Purchase tickets directly from the Event contract
2. View ticket details and metadata
3. List tickets for resale within price limits
4. Purchase tickets from the secondary market

## License

[MIT](LICENSE) 