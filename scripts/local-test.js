// scripts/local-test.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Ticketing System on local network...");
  
  // Get accounts - we'll use these as different users
  const [deployer, venue, buyer1, buyer2, buyer3] = await ethers.getSigners();
  
  console.log("Accounts:");
  console.log(`- Deployer: ${deployer.address}`);
  console.log(`- Venue: ${venue.address}`);
  console.log(`- Buyer1: ${buyer1.address}`);
  console.log(`- Buyer2: ${buyer2.address}`);
  console.log(`- Buyer3: ${buyer3.address}`);
  
  // Deploy TicketingSystem contract
  console.log("\nDeploying TicketingSystem...");
  const TicketingSystem = await ethers.getContractFactory("TicketingSystem");
  const ticketingSystem = await TicketingSystem.deploy();
  await ticketingSystem.waitForDeployment();
  const ticketingSystemAddress = await ticketingSystem.getAddress();
  console.log(`TicketingSystem deployed to: ${ticketingSystemAddress}`);
  
  // Authorize the venue account
  console.log("\nAuthorizing venue...");
  const authTx = await ticketingSystem.setVenueAuthorization(venue.address, true);
  await authTx.wait();
  console.log(`Venue ${venue.address} authorized`);

  // Connect venue to system
  const venueSystem = ticketingSystem.connect(venue);
  
  // Create an event from the venue account
  console.log("\nCreating event...");
  const eventConfig = {
    name: "Summer Festival 2023",
    symbol: "SMRFST",
    ticketPrice: ethers.parseEther("0.05"), // 0.05 ETH
    maxTickets: 10,
    resaleLimitMultiplier: 150, // 150% max resale price
    venueFeePercentage: 1000 // 10% fee
  };

  const createEventTx = await venueSystem.createEvent(eventConfig);
  const receipt = await createEventTx.wait();
  
  // Get the Event address from logs
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
  console.log(`Event created at: ${eventAddress}`);
  
  // Connect to Event contract
  const Event = await ethers.getContractFactory("Event");
  const eventContract = Event.attach(eventAddress);
  
  // Get NFT contract
  const nftAddress = await eventContract.ticketNFT();
  console.log(`TicketNFT deployed at: ${nftAddress}`);
  
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = TicketNFT.attach(nftAddress);
  
  // Buy tickets
  console.log("\n--- PRIMARY MARKET ---");
  
  // Buyer 1 buys 2 tickets
  console.log("\nBuyer1 purchasing 2 tickets...");
  const buyer1Event = eventContract.connect(buyer1);
  const ticket1Tx = await buyer1Event.purchaseTicket({ value: eventConfig.ticketPrice });
  await ticket1Tx.wait();
  const ticket2Tx = await buyer1Event.purchaseTicket({ value: eventConfig.ticketPrice });
  await ticket2Tx.wait();
  
  // Buyer 2 buys 1 ticket
  console.log("Buyer2 purchasing 1 ticket...");
  const buyer2Event = eventContract.connect(buyer2);
  const ticket3Tx = await buyer2Event.purchaseTicket({ value: eventConfig.ticketPrice });
  await ticket3Tx.wait();
  
  // Check ticket balances and owners
  const buyer1Balance = await ticketNFT.balanceOf(buyer1.address);
  const buyer2Balance = await ticketNFT.balanceOf(buyer2.address);
  console.log(`Buyer1 has ${buyer1Balance} tickets`);
  console.log(`Buyer2 has ${buyer2Balance} tickets`);
  
  // Get ticket IDs
  const ticket1Id = 1; // NFTs start at ID 1
  const ticket2Id = 2;
  const ticket3Id = 3;
  
  console.log(`Ticket #1 owner: ${await ticketNFT.ownerOf(ticket1Id)}`);
  console.log(`Ticket #2 owner: ${await ticketNFT.ownerOf(ticket2Id)}`);
  console.log(`Ticket #3 owner: ${await ticketNFT.ownerOf(ticket3Id)}`);
  
  // Secondary market - resell a ticket
  console.log("\n--- SECONDARY MARKET ---");
  
  // Calculate max allowed resale price
  const originalPrice = eventConfig.ticketPrice;
  const maxResalePrice = originalPrice * BigInt(eventConfig.resaleLimitMultiplier) / BigInt(100);
  
  console.log("\nBuyer1 lists ticket #1 for resale...");
  const buyer1NFT = ticketNFT.connect(buyer1);
  
  // List ticket for resale using the NFT contract directly
  const listingPrice = ethers.parseEther("0.07"); // 0.07 ETH (within the 150% limit)
  const listTx = await buyer1NFT.listTicketForSale(ticket1Id, listingPrice);
  await listTx.wait();
  
  console.log(`Ticket #${ticket1Id} listed for ${ethers.formatEther(listingPrice)} ETH`);
  
  // Buyer3 purchases the resale ticket
  console.log("\nBuyer3 purchases the resale ticket...");
  const buyer3NFT = ticketNFT.connect(buyer3);
  const resaleTx = await buyer3NFT.purchaseTicket(ticket1Id, { value: listingPrice });
  await resaleTx.wait();
  
  // Check new owner
  console.log(`Ticket #1 new owner: ${await ticketNFT.ownerOf(ticket1Id)}`);
  
  // Check balances of all participants
  const buyer1BalanceAfter = await ticketNFT.balanceOf(buyer1.address);
  const buyer3Balance = await ticketNFT.balanceOf(buyer3.address);
  console.log(`\nFinal ticket balances:`);
  console.log(`Buyer1 has ${buyer1BalanceAfter} tickets`);
  console.log(`Buyer2 has ${buyer2Balance} tickets`);
  console.log(`Buyer3 has ${buyer3Balance} tickets`);
  
  // Check venue's revenue from sales
  const [primary, secondary, total] = await eventContract.totalRevenue();
  console.log("\nVenue revenue before withdrawal:");
  console.log(`Primary sales: ${ethers.formatEther(primary)} ETH`);
  console.log(`Secondary sales (fees): ${ethers.formatEther(secondary)} ETH`);
  console.log(`Total: ${ethers.formatEther(total)} ETH`);
  
  // Get venue's balance before withdrawal
  const venueBalanceBefore = await ethers.provider.getBalance(venue.address);
  console.log(`\nVenue balance before withdrawal: ${ethers.formatEther(venueBalanceBefore)} ETH`);
  
  // --- VENUE WITHDRAWS FUNDS ---
  console.log("\n--- VENUE WITHDRAWAL ---");
  
  // Venue withdraws funds from the event
  const venueEventContract = eventContract.connect(venue);
  const withdrawTx = await venueEventContract.withdrawFunds();
  await withdrawTx.wait();
  
  console.log("Funds withdrawn successfully!");
  
  // Verify the revenue counters were reset
  const [primaryAfter, secondaryAfter, totalAfter] = await eventContract.totalRevenue();
  console.log("\nVenue revenue after withdrawal:");
  console.log(`Primary sales: ${ethers.formatEther(primaryAfter)} ETH`);
  console.log(`Secondary sales (fees): ${ethers.formatEther(secondaryAfter)} ETH`);
  console.log(`Total: ${ethers.formatEther(totalAfter)} ETH`);
  
  // Get venue's balance after withdrawal
  const venueBalanceAfter = await ethers.provider.getBalance(venue.address);
  console.log(`\nVenue balance after withdrawal: ${ethers.formatEther(venueBalanceAfter)} ETH`);
  
  // Calculate the difference (accounting for gas costs)
  const balanceDiff = venueBalanceAfter - venueBalanceBefore;
  console.log(`Balance difference: ${ethers.formatEther(balanceDiff)} ETH`);
  console.log(`(Note: This is slightly less than ${ethers.formatEther(total)} ETH due to gas costs for the withdrawal transaction)`);
  
  console.log("\nTest completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 