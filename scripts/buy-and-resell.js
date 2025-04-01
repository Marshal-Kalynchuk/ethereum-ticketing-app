// scripts/buy-and-resell.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Buying and reselling tickets...");
  
  // Get wallets
  const [deployer, venue, buyer1, buyer2] = await ethers.getSigners();
  
  console.log("Using accounts:");
  console.log(`- Buyer1: ${buyer1.address}`);
  console.log(`- Buyer2: ${buyer2.address}`);
  
  // Load deployments
  const deploymentsPath = require('path').join(__dirname, '../deployments/localhost.json');
  const deployments = require(deploymentsPath);
  
  // Get contract instances
  const Event = await ethers.getContractFactory("Event");
  const eventContract = Event.attach(deployments.testEvent);
  
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = TicketNFT.attach(deployments.ticketNFT);
  
  // Get ticket price
  const ticketPrice = await eventContract.ticketPrice();
  console.log(`\nTicket price: ${ethers.formatEther(ticketPrice)} ETH`);
  
  // Step 1: Buy a ticket with buyer1's wallet
  console.log("\n--- STEP 1: PURCHASE TICKET ---");
  const buyer1Event = eventContract.connect(buyer1);
  console.log(`Buyer1 (${buyer1.address}) purchasing a ticket...`);
  
  try {
    const buyTx = await buyer1Event.purchaseTicket({ value: ticketPrice });
    const receipt = await buyTx.wait();
    console.log(`Transaction successful: ${receipt.hash}`);
    
    // Get the tokenId from events
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
      const ticketId = transferEvents[0].args.tokenId;
      console.log(`Ticket #${ticketId} purchased successfully`);
      
      // Verify ownership
      const owner = await ticketNFT.ownerOf(ticketId);
      console.log(`Owner of ticket #${ticketId}: ${owner}`);
      
      // Step 2: List the ticket for resale
      console.log("\n--- STEP 2: LIST TICKET FOR RESALE ---");
      const buyer1NFT = ticketNFT.connect(buyer1);
      
      // Calculate a resale price (e.g., 120% of original price)
      const resaleLimitMultiplier = await ticketNFT.resaleLimitMultiplier();
      const maxResalePrice = await ticketNFT.getMaxResalePrice(ticketId);
      console.log(`Maximum resale price: ${ethers.formatEther(maxResalePrice)} ETH`);
      
      const resalePrice = ticketPrice * BigInt(110) / BigInt(100); // 110% of original price
      console.log(`Listing ticket for: ${ethers.formatEther(resalePrice)} ETH`);
      
      const listTx = await buyer1NFT.listTicketForSale(ticketId, resalePrice);
      await listTx.wait();
      console.log(`Ticket #${ticketId} listed for resale`);
      
      // Verify listing
      const listing = await ticketNFT.marketItems(ticketId);
      console.log(`Is for sale: ${listing.isForSale}`);
      console.log(`Asking price: ${ethers.formatEther(listing.askingPrice)} ETH`);
      console.log(`Seller: ${listing.seller}`);
      
      // Step 3: Buy the ticket with buyer2's wallet
      console.log("\n--- STEP 3: PURCHASE RESALE TICKET ---");
      const buyer2NFT = ticketNFT.connect(buyer2);
      console.log(`Buyer2 (${buyer2.address}) purchasing resale ticket #${ticketId}...`);
      
      const resaleTx = await buyer2NFT.purchaseTicket(ticketId, { value: resalePrice });
      await resaleTx.wait();
      
      // Verify new ownership
      const newOwner = await ticketNFT.ownerOf(ticketId);
      console.log(`New owner of ticket #${ticketId}: ${newOwner}`);
      
      // Check buyer1's balance - they should have received payment
      const buyer1BalanceAfter = await ethers.provider.getBalance(buyer1.address);
      console.log(`Buyer1 balance: ${ethers.formatEther(buyer1BalanceAfter)} ETH`);
      
      // Check venue fees collected
      const [primary, secondary, total] = await eventContract.totalRevenue();
      console.log(`\nVenue earnings from secondary sales: ${ethers.formatEther(secondary)} ETH`);
    } else {
      console.log("Could not find ticket ID in transaction events");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 