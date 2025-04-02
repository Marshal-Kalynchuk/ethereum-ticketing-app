// scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  console.log(`Deploying Ticketing System contracts to ${networkName}...`);

  // Get the deployer based on network
  let deployer;
  
  if (networkName === 'localhost' || networkName === 'hardhat') {
    // Use Hardhat's built-in accounts for local development
    [deployer] = await hre.ethers.getSigners();
  } else {
    // For testnet/mainnet, use the generated wallet
    const walletsPath = path.join(__dirname, '../deployments', 'demo-wallets.json');
    if (!fs.existsSync(walletsPath)) {
      console.error('Generated wallets not found. Run scripts/generate-wallets.js first.');
      process.exit(1);
    }
    
    const wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
    const provider = hre.ethers.provider;
    
    // Create deployer wallet instance connected to the provider
    deployer = new hre.ethers.Wallet(wallets.deployer.privateKey, provider);
    
    // Check if deployer has funds
    const balance = await provider.getBalance(deployer.address);
    if (balance.toString() === '0') {
      console.error(`Deployer account (${deployer.address}) has no funds. Please send ETH to this address before continuing.`);
      process.exit(1);
    }
  }

  console.log(`Deploying contracts using account: ${deployer.address}`);

  // Deploy the TicketingSystem contract
  const TicketingSystem = await hre.ethers.getContractFactory("TicketingSystem", deployer);
  const ticketingSystem = await TicketingSystem.deploy();
  await ticketingSystem.waitForDeployment();
  const ticketingSystemAddress = await ticketingSystem.getAddress();

  console.log("TicketingSystem deployed to:", ticketingSystemAddress);

  // For testing purposes, we can create a test venue and event if it's a local network
  if (networkName === 'localhost' || networkName === 'hardhat') {
    // Authorize the deployer as a venue
    const authTx = await ticketingSystem.setVenueAuthorization(deployer.address, true);
    await authTx.wait();
    console.log("Deployer authorized as venue:", deployer.address);

    // Create a test event
    const eventConfig = {
      name: "Test Concert",
      symbol: "TCKT",
      ticketPrice: hre.ethers.parseEther("0.1"), // 0.1 ETH
      maxTickets: 100,
      resaleLimitMultiplier: 120, // 120% max resale price
      venueFeePercentage: 500 // 5% fee
    };

    const createEventTx = await ticketingSystem.createEvent(eventConfig);
    const receipt = await createEventTx.wait();
    
    // Get the event address from the logs
    const eventCreatedEvent = receipt.logs
      .map(log => {
        try {
          return ticketingSystem.interface.parseLog({
            topics: [...log.topics],
            data: log.data
          });
        } catch (e) {
          return null;
        }
      })
      .filter(parsedLog => parsedLog && parsedLog.name === 'EventCreated')[0];
    
    const eventAddress = eventCreatedEvent.args.eventContract;
    
    console.log("Test Event created at:", eventAddress);
    
    // Get the NFT address from the Event contract
    const Event = await ethers.getContractFactory("Event");
    const eventContract = Event.attach(eventAddress);
    const nftAddress = await eventContract.ticketNFT();
    console.log("TicketNFT deployed at:", nftAddress);
    
    // Save detailed deployment information
    const deploymentInfo = {
      network: networkName,
      ticketingSystem: ticketingSystemAddress,
      testEvent: eventAddress,
      ticketNFT: nftAddress
    };
    
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
      path.join(deploymentsDir, `${networkName}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );
  } else {
    // For testnet/mainnet, just save the ticketing system address
    const deploymentInfo = {
      network: networkName,
      ticketingSystem: ticketingSystemAddress
    };
    
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
      path.join(deploymentsDir, `${networkName}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );
  }
  
  console.log("Deployment info saved to:", path.join('deployments', `${networkName}.json`));
  
  if (networkName !== 'localhost' && networkName !== 'hardhat') {
    console.log("To verify contracts on Etherscan:");
    console.log(`npx hardhat verify --network ${networkName} ${ticketingSystemAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 