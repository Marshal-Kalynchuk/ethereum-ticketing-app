# Ethereum Ticketing System Frontend

This is the React frontend for the Ethereum Ticketing System, allowing users to interact with the smart contracts for buying, selling, and managing NFT-based tickets.

## Features

- Connect to a Web3 wallet (MetaMask)
- Browse and purchase tickets directly from events
- View and manage your NFT tickets
- List tickets for resale with price restrictions
- Buy tickets from the secondary marketplace

## Prerequisites

- Node.js and npm installed
- MetaMask browser extension installed
- Local Hardhat node running with deployed contracts

## Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm start
```

The app will open in your browser at [http://localhost:3000](http://localhost:3000).

## Usage

1. Make sure your local Hardhat node is running:

```bash
npx hardhat node
```

2. Deploy the contracts to the local network:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Connect MetaMask to the local Hardhat network:
   - Network Name: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

4. Import some accounts from the Hardhat node using their private keys.

5. Connect your wallet in the app and start interacting with the contracts.

## Working with the Deployed Contracts

The application is currently configured to work with the following contracts:

- TicketingSystem: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Event: `0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968`
- TicketNFT: `0xa16E02E87b7454126E5E10d957A927A7F5B5d2be`

If your deployment addresses are different, update them in:
- `src/contexts/Web3Context.js`
- `src/utils/constants.js`

## Technology Stack

- React
- Ethers.js
- TailwindCSS
- React Router 