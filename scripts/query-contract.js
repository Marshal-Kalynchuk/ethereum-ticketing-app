// scripts/query-contract.js
const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to ask a question
function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Get deployments if available
function getDeployments() {
  try {
    const deploymentsDir = path.join(__dirname, '../deployments');
    const deploymentFile = path.join(deploymentsDir, 'localhost.json');
    if (fs.existsSync(deploymentFile)) {
      return JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    }
  } catch (error) {
    console.log("No deployment file found:", error.message);
  }
  return null;
}

async function main() {
  console.log("Ethereum Contract Query Tool");
  console.log("============================\n");
  
  // Try to load deployments
  const deployments = getDeployments();
  if (deployments) {
    console.log("Found deployed contracts:");
    console.log(`- TicketingSystem: ${deployments.ticketingSystem}`);
    console.log(`- Test Event: ${deployments.testEvent}`);
    console.log(`- Ticket NFT: ${deployments.ticketNFT}`);
  } else {
    console.log("No deployment info found. You'll need to provide contract addresses manually.");
  }
  
  // Main menu loop
  let running = true;
  while (running) {
    console.log("\nWhat would you like to do?");
    console.log("1. Query TicketingSystem contract");
    console.log("2. Query Event contract");
    console.log("3. Query TicketNFT contract");
    console.log("4. Exit");
    
    const choice = await askQuestion("Enter your choice (1-4): ");
    
    switch (choice) {
      case "1":
        await queryTicketingSystem(deployments);
        break;
      case "2":
        await queryEvent(deployments);
        break;
      case "3":
        await queryTicketNFT(deployments);
        break;
      case "4":
        running = false;
        break;
      default:
        console.log("Invalid choice. Please try again.");
    }
  }
  
  rl.close();
  process.exit(0);
}

async function queryTicketingSystem(deployments) {
  console.log("\n--- Querying TicketingSystem Contract ---");
  
  let address;
  if (deployments && deployments.ticketingSystem) {
    address = deployments.ticketingSystem;
    console.log(`Using deployed address: ${address}`);
  } else {
    address = await askQuestion("Enter TicketingSystem contract address: ");
  }
  
  try {
    const TicketingSystem = await ethers.getContractFactory("TicketingSystem");
    const ticketingSystem = TicketingSystem.attach(address);
    
    console.log("\nTicketingSystem Menu:");
    console.log("1. Get owner");
    console.log("2. Check if address is authorized venue");
    console.log("3. Get deployed events count");
    console.log("4. Get deployed event address by index");
    console.log("5. Go back");
    
    const choice = await askQuestion("Enter your choice (1-5): ");
    
    switch (choice) {
      case "1":
        const owner = await ticketingSystem.owner();
        console.log(`Owner: ${owner}`);
        break;
      case "2":
        const venueAddress = await askQuestion("Enter venue address to check: ");
        const isAuthorized = await ticketingSystem.isVenueAuthorized(venueAddress);
        console.log(`Is authorized venue: ${isAuthorized}`);
        break;
      case "3":
        const count = await ticketingSystem.getDeployedEventsCount();
        console.log(`Deployed events count: ${count}`);
        break;
      case "4":
        const index = await askQuestion("Enter event index: ");
        const eventAddress = await ticketingSystem.deployedEvents(index);
        console.log(`Event at index ${index}: ${eventAddress}`);
        break;
      case "5":
        return;
      default:
        console.log("Invalid choice.");
    }
  } catch (error) {
    console.log("Error querying contract:", error.message);
  }
}

async function queryEvent(deployments) {
  console.log("\n--- Querying Event Contract ---");
  
  let address;
  if (deployments && deployments.testEvent) {
    address = deployments.testEvent;
    console.log(`Using deployed address: ${address}`);
  } else {
    address = await askQuestion("Enter Event contract address: ");
  }
  
  try {
    const Event = await ethers.getContractFactory("Event");
    const eventContract = Event.attach(address);
    
    console.log("\nEvent Menu:");
    console.log("1. Get event name");
    console.log("2. Get ticket price");
    console.log("3. Get tickets sold");
    console.log("4. Get max tickets");
    console.log("5. Get remaining tickets");
    console.log("6. Get sale phase");
    console.log("7. Get venue address");
    console.log("8. Get ticketNFT address");
    console.log("9. Get revenue info");
    console.log("10. Go back");
    
    const choice = await askQuestion("Enter your choice (1-10): ");
    
    switch (choice) {
      case "1":
        const name = await eventContract.eventName();
        console.log(`Event name: ${name}`);
        break;
      case "2":
        const price = await eventContract.ticketPrice();
        console.log(`Ticket price: ${ethers.formatEther(price)} ETH`);
        break;
      case "3":
        const ticketsSold = await eventContract.ticketsSold();
        console.log(`Tickets sold: ${ticketsSold}`);
        break;
      case "4":
        const maxTickets = await eventContract.maxTickets();
        console.log(`Max tickets: ${maxTickets}`);
        break;
      case "5":
        const remaining = await eventContract.remainingTickets();
        console.log(`Remaining tickets: ${remaining}`);
        break;
      case "6":
        const phase = await eventContract.currentPhase();
        const phaseNames = ["Active", "SoldOut", "Closed"];
        console.log(`Sale phase: ${phaseNames[phase]}`);
        break;
      case "7":
        const venue = await eventContract.venue();
        console.log(`Venue address: ${venue}`);
        break;
      case "8":
        const nft = await eventContract.ticketNFT();
        console.log(`TicketNFT address: ${nft}`);
        break;
      case "9":
        const [primary, secondary, total] = await eventContract.totalRevenue();
        console.log(`Primary sales revenue: ${ethers.formatEther(primary)} ETH`);
        console.log(`Secondary sales revenue: ${ethers.formatEther(secondary)} ETH`);
        console.log(`Total revenue: ${ethers.formatEther(total)} ETH`);
        break;
      case "10":
        return;
      default:
        console.log("Invalid choice.");
    }
  } catch (error) {
    console.log("Error querying contract:", error.message);
  }
}

async function queryTicketNFT(deployments) {
  console.log("\n--- Querying TicketNFT Contract ---");
  
  let address;
  if (deployments && deployments.ticketNFT) {
    address = deployments.ticketNFT;
    console.log(`Using deployed address: ${address}`);
  } else {
    address = await askQuestion("Enter TicketNFT contract address: ");
  }
  
  try {
    const TicketNFT = await ethers.getContractFactory("TicketNFT");
    const ticketNFT = TicketNFT.attach(address);
    
    console.log("\nTicketNFT Menu:");
    console.log("1. Get name");
    console.log("2. Get symbol");
    console.log("3. Get total supply");
    console.log("4. Get ticket owner by ID");
    console.log("5. Get original price of ticket");
    console.log("6. Get max resale price of ticket");
    console.log("7. Check if ticket is for sale");
    console.log("8. Get ticket metadata");
    console.log("9. Go back");
    
    const choice = await askQuestion("Enter your choice (1-9): ");
    
    switch (choice) {
      case "1":
        const name = await ticketNFT.name();
        console.log(`NFT name: ${name}`);
        break;
      case "2":
        const symbol = await ticketNFT.symbol();
        console.log(`NFT symbol: ${symbol}`);
        break;
      case "3":
        const supply = await ticketNFT.totalSupply();
        console.log(`Total supply: ${supply}`);
        break;
      case "4":
        const tokenId = await askQuestion("Enter ticket ID: ");
        try {
          const owner = await ticketNFT.ownerOf(tokenId);
          console.log(`Owner of ticket #${tokenId}: ${owner}`);
        } catch (error) {
          console.log(`Ticket #${tokenId} does not exist or is burnt`);
        }
        break;
      case "5":
        const ticketId = await askQuestion("Enter ticket ID: ");
        const originalPrice = await ticketNFT.originalPrice(ticketId);
        console.log(`Original price of ticket #${ticketId}: ${ethers.formatEther(originalPrice)} ETH`);
        break;
      case "6":
        const ticketId2 = await askQuestion("Enter ticket ID: ");
        const maxPrice = await ticketNFT.getMaxResalePrice(ticketId2);
        console.log(`Max resale price of ticket #${ticketId2}: ${ethers.formatEther(maxPrice)} ETH`);
        break;
      case "7":
        const ticketId3 = await askQuestion("Enter ticket ID: ");
        const listing = await ticketNFT.marketItems(ticketId3);
        console.log(`Ticket #${ticketId3} for sale: ${listing.isForSale}`);
        if (listing.isForSale) {
          console.log(`Asking price: ${ethers.formatEther(listing.askingPrice)} ETH`);
          console.log(`Seller: ${listing.seller}`);
        }
        break;
      case "8":
        const ticketId4 = await askQuestion("Enter ticket ID: ");
        try {
          const [seatInfo, ticketType, eventDate] = await ticketNFT.getTicketMetadata(ticketId4);
          console.log(`Ticket #${ticketId4} metadata:`);
          console.log(`- Seat info: ${seatInfo}`);
          console.log(`- Ticket type: ${ticketType}`);
          console.log(`- Event date: ${new Date(Number(eventDate) * 1000)}`);
        } catch (error) {
          console.log(`Could not get metadata for ticket #${ticketId4}: ${error.message}`);
        }
        break;
      case "9":
        return;
      default:
        console.log("Invalid choice.");
    }
  } catch (error) {
    console.log("Error querying contract:", error.message);
  }
}

// Run the main function
main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 