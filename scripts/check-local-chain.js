// scripts/check-local-chain.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Checking local blockchain state...");
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`\nNetwork:`);
  console.log(`- Name: ${network.name}`);
  console.log(`- Chain ID: ${network.chainId}`);
  
  // Get accounts and balances
  const accounts = await ethers.getSigners();
  console.log(`\nAccounts:`);
  
  for (let i = 0; i < 5; i++) { // Just show first 5 accounts
    const balance = await ethers.provider.getBalance(accounts[i].address);
    console.log(`- Account #${i}: ${accounts[i].address}`);
    console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
  }
  
  // Get latest blocks
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log(`\nLatest block number: ${blockNumber}`);
  
  const latestBlock = await ethers.provider.getBlock(blockNumber);
  console.log(`Latest block timestamp: ${new Date(latestBlock.timestamp * 1000)}`);
  console.log(`Transactions in latest block: ${latestBlock.transactions.length}`);
  
  // Try to get transaction info for each transaction in the latest block
  if (latestBlock.transactions.length > 0) {
    console.log(`\nTransactions in latest block:`);
    for (let i = 0; i < Math.min(latestBlock.transactions.length, 5); i++) { // Show up to 5 txs
      const txHash = latestBlock.transactions[i];
      const tx = await ethers.provider.getTransaction(txHash);
      console.log(`- TX ${i}: ${txHash}`);
      console.log(`  From: ${tx.from}`);
      console.log(`  To: ${tx.to || 'Contract Creation'}`);
      console.log(`  Value: ${ethers.formatEther(tx.value)} ETH`);
    }
  }
  
  // Check if our TicketingSystem contract is deployed
  // We need the address from a previous deployment
  try {
    // Try to get the contract from our latest deployment
    // If you have the address from a previous deployment, replace this with the actual address
    const deploymentInfo = require('../deployments/localhost.json');
    const ticketingSystemAddress = deploymentInfo.ticketingSystem;
    
    console.log(`\nTicketing System contract found at ${ticketingSystemAddress}`);
    
    // Connect to the contract
    const TicketingSystem = await ethers.getContractFactory("TicketingSystem");
    const ticketingSystem = TicketingSystem.attach(ticketingSystemAddress);
    
    // Get some basic info
    const eventCount = await ticketingSystem.getDeployedEventsCount();
    console.log(`Number of events created: ${eventCount}`);
    
    // If there are events, get their addresses
    if (eventCount > 0) {
      console.log(`\nEvents:`);
      for (let i = 0; i < Math.min(Number(eventCount), 5); i++) { // Show up to 5 events
        const eventAddress = await ticketingSystem.deployedEvents(i);
        console.log(`- Event #${i}: ${eventAddress}`);
        
        // Connect to the event contract
        const Event = await ethers.getContractFactory("Event");
        const eventContract = Event.attach(eventAddress);
        
        // Get basic event info
        const eventName = await eventContract.eventName();
        const ticketPrice = await eventContract.ticketPrice();
        const ticketsSold = await eventContract.ticketsSold();
        const maxTickets = await eventContract.maxTickets();
        
        console.log(`  Name: ${eventName}`);
        console.log(`  Ticket Price: ${ethers.formatEther(ticketPrice)} ETH`);
        console.log(`  Tickets Sold: ${ticketsSold}/${maxTickets}`);
        
        // Get NFT address
        const nftAddress = await eventContract.ticketNFT();
        console.log(`  NFT Address: ${nftAddress}`);
      }
    }
  } catch (error) {
    console.log("\nNo TicketingSystem contract found or error accessing it.");
    console.log("You may need to run local-test.js first to deploy contracts.");
    console.log("Error details:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 