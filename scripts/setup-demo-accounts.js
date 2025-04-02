// scripts/setup-demo-accounts.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

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
  
  // Get signers based on network
  let deployer, venue1, venue2, customer1, customer2;
  
  if (networkName === 'localhost' || networkName === 'hardhat') {
    // Use Hardhat's built-in accounts for local development
    [deployer, venue1, venue2, customer1, customer2] = await hre.ethers.getSigners();
  } else {
    // For testnet/mainnet, use the generated wallets
    const walletsPath = path.join(__dirname, '../deployments', 'demo-wallets.json');
    if (!fs.existsSync(walletsPath)) {
      console.error('Generated wallets not found. Run scripts/generate-wallets.js first.');
      process.exit(1);
    }
    
    const wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
    const provider = hre.ethers.provider;
    
    // Create wallet instances connected to the provider
    deployer = new hre.ethers.Wallet(wallets.deployer.privateKey, provider);
    venue1 = new hre.ethers.Wallet(wallets.venue1.privateKey, provider);
    venue2 = new hre.ethers.Wallet(wallets.venue2.privateKey, provider);
    customer1 = new hre.ethers.Wallet(wallets.customer1.privateKey, provider);
    customer2 = new hre.ethers.Wallet(wallets.customer2.privateKey, provider);
    
    // Check if deployer has funds
    const balance = await provider.getBalance(deployer.address);
    if (balance.toString() === '0') {
      console.error(`Deployer account (${deployer.address}) has no funds. Please send ETH to this address before continuing.`);
      process.exit(1);
    }
  }
  
  // Connect to the deployed TicketingSystem
  const TicketingSystem = await hre.ethers.getContractFactory("TicketingSystem", deployer);
  const ticketingSystem = TicketingSystem.attach(deploymentData.ticketingSystem);
  
  // Authorize venues
  console.log(`Authorizing Venue 1 (${venue1.address})...`);
  const tx1 = await ticketingSystem.setVenueAuthorization(venue1.address, true);
  await tx1.wait();
  console.log(`Venue 1 authorized: ${venue1.address}`);
  
  console.log(`Authorizing Venue 2 (${venue2.address})...`);
  const tx2 = await ticketingSystem.setVenueAuthorization(venue2.address, true);
  await tx2.wait();
  console.log(`Venue 2 authorized: ${venue2.address}`);
  
  // Create demo events
  console.log("Creating demo event from Venue 1...");
  // Connect as venue1
  const venue1Contract = ticketingSystem.connect(venue1);
  const event1Config = {
    name: "Demo Concert",
    symbol: "DEMO",
    ticketPrice: hre.ethers.parseEther("0.01"),
    maxTickets: 100,
    resaleLimitMultiplier: 150, // 150% max resale price
    venueFeePercentage: 500 // 5% fee
  };
  
  try {
    const tx3 = await venue1Contract.createEvent(event1Config);
    await tx3.wait();
    console.log("Demo event created by Venue 1");
  } catch (error) {
    console.error("Failed to create event:", error.message);
  }
  
  // Save account info
  const accountInfo = {
    deployer: deployer.address,
    venues: [venue1.address, venue2.address],
    customers: [customer1.address, customer2.address]
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../deployments', `${networkName}-accounts.json`),
    JSON.stringify(accountInfo, null, 2)
  );
  
  console.log("Demo accounts setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });