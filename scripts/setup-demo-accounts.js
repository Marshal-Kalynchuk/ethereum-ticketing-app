// scripts/setup-demo-accounts.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

async function main() {
  const networkName = hre.network.name;
  console.log(`Setting up demo accounts on ${networkName}...`);
  
  // Load deployed contract addresses
  const deploymentPath = path.join(__dirname, '../deployments', `${networkName}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file for ${networkName} not found. Deploy contracts first.`);
    process.exit(1);
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // Use the same deployer account that deployed the contracts
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Setting up demo accounts using deployer: ${deployer.address}`);
  
  // Get venue wallet from .env
  const venuePrivateKey = process.env.VENUE_PRIVATE_KEY;
  if (!venuePrivateKey) {
    console.error('VENUE_PRIVATE_KEY not found in .env file. Please add it.');
    process.exit(1);
  }
  
  // Create venue wallet instance connected to the provider
  const provider = hre.ethers.provider;
  const venue = new hre.ethers.Wallet(venuePrivateKey, provider);
  console.log(`Using venue wallet: ${venue.address}`);
  
  // Connect to the deployed TicketingSystem
  const TicketingSystem = await hre.ethers.getContractFactory("TicketingSystem", deployer);
  const ticketingSystem = TicketingSystem.attach(deploymentData.ticketingSystem);
  
  // Authorize venue
  console.log(`Authorizing Venue (${venue.address})...`);
  const tx = await ticketingSystem.setVenueAuthorization(venue.address, true);
  await tx.wait();
  console.log(`Venue authorized: ${venue.address}`);
  
  // Create demo event
  console.log("Creating demo event from Venue...");
  // Connect as venue
  const venueContract = ticketingSystem.connect(venue);
  const event1Config = {
    name: "Demo Concert",
    symbol: "DEMO",
    ticketPrice: hre.ethers.parseEther("0.01"),
    maxTickets: 100,
    resaleLimitMultiplier: 150, // 150% max resale price
    venueFeePercentage: 500 // 5% fee
  };
  
  try {
    const tx3 = await venueContract.createEvent(event1Config);
    const receipt = await tx3.wait();
    
    // Get the event address from the logs
    const eventCreatedEvent = receipt.logs
      .map(log => {
        try {
          return venueContract.interface.parseLog({
            topics: [...log.topics],
            data: log.data
          });
        } catch (e) {
          return null;
        }
      })
      .filter(parsedLog => parsedLog && parsedLog.name === 'EventCreated')[0];
    
    const eventAddress = eventCreatedEvent.args.eventContract;
    console.log("Demo event created by Venue at:", eventAddress);
    
    // Save account info
    const accountInfo = {
      deployer: deployer.address,
      venue: venue.address,
      eventContract: eventAddress
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../deployments', `${networkName}-accounts.json`),
      JSON.stringify(accountInfo, null, 2)
    );
    
    console.log("Demo accounts setup complete!");
  } catch (error) {
    console.error("Failed to create event:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });