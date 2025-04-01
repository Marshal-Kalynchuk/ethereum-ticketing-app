// scripts/manual-interaction.js
const hre = require("hardhat");
const { ethers } = require("hardhat");
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
    const deploymentsPath = require('path').join(__dirname, '../deployments/localhost.json');
    return require(deploymentsPath);
  } catch (error) {
    console.log("No deployment file found:", error.message);
    return null;
  }
}

async function main() {
  console.log("Ticketing System Manual Interaction Tool");
  console.log("========================================\n");
  
  // Get local accounts (fake wallets)
  const accounts = await ethers.getSigners();
  
  console.log("Available accounts (wallets):");
  for (let i = 0; i < 5; i++) {
    const balance = await ethers.provider.getBalance(accounts[i].address);
    console.log(`${i}: ${accounts[i].address} (${ethers.formatEther(balance)} ETH)`);
  }
  
  // Load deployments
  const deployments = getDeployments();
  if (!deployments) {
    console.log("No deployments found. Please deploy contracts first.");
    rl.close();
    return;
  }
  
  console.log("\nDeployed contracts:");
  console.log(`- TicketingSystem: ${deployments.ticketingSystem}`);
  console.log(`- Test Event: ${deployments.testEvent}`);
  console.log(`- Ticket NFT: ${deployments.ticketNFT}`);
  
  // Get contract instances
  const Event = await ethers.getContractFactory("Event");
  const eventContract = Event.attach(deployments.testEvent);
  
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = TicketNFT.attach(deployments.ticketNFT);
  
  // Get event info
  const eventName = await eventContract.eventName();
  const ticketPrice = await eventContract.ticketPrice();
  const ticketsSold = await eventContract.ticketsSold();
  const maxTickets = await eventContract.maxTickets();
  
  console.log(`\nEvent: ${eventName}`);
  console.log(`Ticket Price: ${ethers.formatEther(ticketPrice)} ETH`);
  console.log(`Tickets Sold: ${ticketsSold}/${maxTickets}`);
  
  let running = true;
  while (running) {
    console.log("\nWhat would you like to do?");
    console.log("1. Buy a new ticket");
    console.log("2. List a ticket for resale");
    console.log("3. Buy a resale ticket");
    console.log("4. Check ticket ownership");
    console.log("5. Check ticket listings");
    console.log("6. Check account balances");
    console.log("7. Exit");
    
    const choice = await askQuestion("Enter your choice (1-7): ");
    
    switch (choice) {
      case "1":
        await buyNewTicket(accounts, eventContract, ticketNFT, ticketPrice);
        break;
      case "2":
        await listTicketForResale(accounts, ticketNFT);
        break;
      case "3":
        await buyResaleTicket(accounts, ticketNFT);
        break;
      case "4":
        await checkTicketOwnership(ticketNFT);
        break;
      case "5":
        await checkTicketListings(ticketNFT);
        break;
      case "6":
        await checkAccountBalances(accounts);
        break;
      case "7":
        running = false;
        break;
      default:
        console.log("Invalid choice. Please try again.");
    }
  }
  
  rl.close();
}

async function buyNewTicket(accounts, eventContract, ticketNFT, ticketPrice) {
  console.log("\n--- BUY NEW TICKET ---");
  const walletIndex = await askQuestion("Enter the wallet index to buy with (0-4): ");
  
  if (walletIndex < 0 || walletIndex > 4) {
    console.log("Invalid wallet index");
    return;
  }
  
  const buyer = accounts[walletIndex];
  const buyerEvent = eventContract.connect(buyer);
  
  console.log(`Using wallet: ${buyer.address}`);
  console.log(`Ticket price: ${ethers.formatEther(ticketPrice)} ETH`);
  
  try {
    console.log("Purchasing ticket...");
    const tx = await buyerEvent.purchaseTicket({ value: ticketPrice });
    const receipt = await tx.wait();
    
    // Find the token ID
    const transferEvents = receipt.logs
      .map(log => {
        try {
          return ticketNFT.interface.parseLog({
            topics: [...log.topics],
            data: log.data
          });
        } catch (e) {
          return null;
        }
      })
      .filter(parsedLog => parsedLog && parsedLog.name === 'Transfer');
    
    if (transferEvents.length > 0) {
      const tokenId = transferEvents[0].args.tokenId;
      console.log(`Success! Ticket #${tokenId} purchased by ${buyer.address}`);
    } else {
      console.log("Success, but couldn't determine the ticket ID");
    }
  } catch (error) {
    console.log("Transaction failed:", error.message);
  }
}

async function listTicketForResale(accounts, ticketNFT) {
  console.log("\n--- LIST TICKET FOR RESALE ---");
  const walletIndex = await askQuestion("Enter the wallet index that owns the ticket (0-4): ");
  
  if (walletIndex < 0 || walletIndex > 4) {
    console.log("Invalid wallet index");
    return;
  }
  
  const seller = accounts[walletIndex];
  const sellerNFT = ticketNFT.connect(seller);
  
  console.log(`Using wallet: ${seller.address}`);
  
  // Get owned tickets
  const balance = await ticketNFT.balanceOf(seller.address);
  
  if (balance == 0) {
    console.log("This wallet doesn't own any tickets");
    return;
  }
  
  console.log(`This wallet owns ${balance} tickets`);
  
  // List ticket IDs
  console.log("Owned tickets:");
  const ticketIds = [];
  
  for (let i = 1; i <= 10; i++) { // Check first 10 possible IDs
    try {
      const owner = await ticketNFT.ownerOf(i);
      if (owner.toLowerCase() === seller.address.toLowerCase()) {
        ticketIds.push(i);
        console.log(`Ticket #${i}`);
      }
    } catch (error) {
      // Not an owned ticket, skip
    }
  }
  
  if (ticketIds.length === 0) {
    console.log("Could not find specific ticket IDs");
    return;
  }
  
  const ticketId = await askQuestion("Enter the ticket ID to list: ");
  
  try {
    // Check if owned
    const owner = await ticketNFT.ownerOf(ticketId);
    if (owner.toLowerCase() !== seller.address.toLowerCase()) {
      console.log("This wallet doesn't own ticket #" + ticketId);
      return;
    }
    
    // Check max resale price
    const maxPrice = await ticketNFT.getMaxResalePrice(ticketId);
    console.log(`Maximum allowed resale price: ${ethers.formatEther(maxPrice)} ETH`);
    
    const priceStr = await askQuestion("Enter listing price in ETH: ");
    const priceInEth = parseFloat(priceStr);
    
    if (isNaN(priceInEth) || priceInEth <= 0) {
      console.log("Invalid price");
      return;
    }
    
    const priceInWei = ethers.parseEther(priceStr);
    
    if (priceInWei > maxPrice) {
      console.log("Price exceeds maximum allowed resale price");
      return;
    }
    
    console.log(`Listing ticket #${ticketId} for ${priceStr} ETH...`);
    const tx = await sellerNFT.listTicketForSale(ticketId, priceInWei);
    await tx.wait();
    
    console.log(`Success! Ticket #${ticketId} listed for ${priceStr} ETH`);
    
    // Verify listing
    const listing = await ticketNFT.marketItems(ticketId);
    console.log(`Listing status - For sale: ${listing.isForSale}, Price: ${ethers.formatEther(listing.askingPrice)} ETH`);
  } catch (error) {
    console.log("Operation failed:", error.message);
  }
}

async function buyResaleTicket(accounts, ticketNFT) {
  console.log("\n--- BUY RESALE TICKET ---");
  const walletIndex = await askQuestion("Enter the wallet index to buy with (0-4): ");
  
  if (walletIndex < 0 || walletIndex > 4) {
    console.log("Invalid wallet index");
    return;
  }
  
  const buyer = accounts[walletIndex];
  const buyerNFT = ticketNFT.connect(buyer);
  
  console.log(`Using wallet: ${buyer.address}`);
  
  // Find listed tickets
  console.log("Searching for listed tickets...");
  const listedTickets = [];
  
  for (let i = 1; i <= 10; i++) { // Check first 10 possible IDs
    try {
      const listing = await ticketNFT.marketItems(i);
      if (listing.isForSale) {
        listedTickets.push({
          id: i,
          price: listing.askingPrice,
          seller: listing.seller
        });
        console.log(`Ticket #${i} - Price: ${ethers.formatEther(listing.askingPrice)} ETH, Seller: ${listing.seller}`);
      }
    } catch (error) {
      // Not a listed ticket, skip
    }
  }
  
  if (listedTickets.length === 0) {
    console.log("No tickets listed for resale");
    return;
  }
  
  const ticketId = await askQuestion("Enter the ticket ID to purchase: ");
  
  try {
    // Get listing info again to double-check
    const listing = await ticketNFT.marketItems(ticketId);
    
    if (!listing.isForSale) {
      console.log(`Ticket #${ticketId} is not for sale`);
      return;
    }
    
    console.log(`Purchasing ticket #${ticketId} for ${ethers.formatEther(listing.askingPrice)} ETH...`);
    
    const tx = await buyerNFT.purchaseTicket(ticketId, { value: listing.askingPrice });
    await tx.wait();
    
    console.log(`Success! Ticket #${ticketId} purchased by ${buyer.address}`);
    
    // Verify new owner
    const newOwner = await ticketNFT.ownerOf(ticketId);
    console.log(`New owner: ${newOwner}`);
  } catch (error) {
    console.log("Transaction failed:", error.message);
  }
}

async function checkTicketOwnership(ticketNFT) {
  console.log("\n--- CHECK TICKET OWNERSHIP ---");
  const ticketId = await askQuestion("Enter the ticket ID to check: ");
  
  try {
    const owner = await ticketNFT.ownerOf(ticketId);
    console.log(`Ticket #${ticketId} is owned by: ${owner}`);
    
    const originalPrice = await ticketNFT.originalPrice(ticketId);
    console.log(`Original price: ${ethers.formatEther(originalPrice)} ETH`);
    
    const maxResalePrice = await ticketNFT.getMaxResalePrice(ticketId);
    console.log(`Maximum resale price: ${ethers.formatEther(maxResalePrice)} ETH`);
    
    try {
      const [seatInfo, ticketType, eventDate] = await ticketNFT.getTicketMetadata(ticketId);
      console.log(`Seat info: ${seatInfo}`);
      console.log(`Ticket type: ${ticketType}`);
      console.log(`Event date: ${new Date(Number(eventDate) * 1000)}`);
    } catch (error) {
      console.log("No metadata available for this ticket");
    }
  } catch (error) {
    console.log(`Ticket #${ticketId} does not exist or has been burnt`);
  }
}

async function checkTicketListings(ticketNFT) {
  console.log("\n--- CHECK TICKET LISTINGS ---");
  console.log("Searching for listed tickets...");
  
  let foundListings = false;
  
  for (let i = 1; i <= 10; i++) { // Check first 10 possible IDs
    try {
      const listing = await ticketNFT.marketItems(i);
      if (listing.isForSale) {
        foundListings = true;
        console.log(`Ticket #${i} - Price: ${ethers.formatEther(listing.askingPrice)} ETH, Seller: ${listing.seller}`);
      }
    } catch (error) {
      // Not a listed ticket, skip
    }
  }
  
  if (!foundListings) {
    console.log("No tickets are currently listed for resale");
  }
}

async function checkAccountBalances(accounts) {
  console.log("\n--- ACCOUNT BALANCES ---");
  
  for (let i = 0; i < 5; i++) {
    const balance = await ethers.provider.getBalance(accounts[i].address);
    console.log(`Account ${i}: ${accounts[i].address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 