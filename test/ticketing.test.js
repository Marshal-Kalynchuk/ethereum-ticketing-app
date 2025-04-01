const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployTicketingSystem, createEvent } = require("./setup");

describe("Ticketing System", function () {
  let ticketingSystem;
  let eventContract, ticketNFT;
  let owner, venue, user1, user2, user3;
  
  const EVENT_PRICE = ethers.parseEther("0.1"); // 0.1 ETH
  
  beforeEach(async function() {
    // Get signers
    [owner, venue, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy the TicketingSystem contract
    ticketingSystem = await deployTicketingSystem();
    
    // Authorize the venue
    await ticketingSystem.setVenueAuthorization(venue.address, true);
    
    // Create a test event
    const result = await createEvent(ticketingSystem, venue, {
      ticketPrice: EVENT_PRICE,
      maxTickets: 10,
      resaleLimitMultiplier: 150, // 150% max resale price
      venueFeePercentage: 1000 // 10% fee
    });
    
    eventContract = result.eventContract;
    ticketNFT = result.ticketNFT;
  });
  
  describe("Event Setup", function() {
    it("Should set up the event with correct parameters", async function() {
      expect(await eventContract.eventName()).to.equal("Test Concert");
      expect(await eventContract.ticketPrice()).to.equal(EVENT_PRICE);
      expect(await eventContract.maxTickets()).to.equal(10);
      expect(await eventContract.venue()).to.equal(venue.address);
    });
    
    it("Should set up the ticket NFT with correct parameters", async function() {
      expect(await ticketNFT.name()).to.equal("Test Concert");
      expect(await ticketNFT.symbol()).to.equal("TCKT");
      expect(await ticketNFT.resaleLimitMultiplier()).to.equal(150);
      expect(await ticketNFT.venueFeePercentage()).to.equal(1000);
    });
  });
  
  describe("Primary Market", function() {
    it("Should allow users to purchase tickets", async function() {
      // User1 buys a ticket
      await eventContract.connect(user1).purchaseTicket({value: EVENT_PRICE});
      
      // Check ticket ownership
      expect(await ticketNFT.ownerOf(1)).to.equal(user1.address);
      
      // Check event state
      expect(await eventContract.ticketsSold()).to.equal(1);
      
      // Check revenue
      const revenue = await eventContract.totalRevenue();
      expect(revenue[0]).to.equal(EVENT_PRICE); // primary revenue
    });
    
    it("Should reject purchases with incorrect payment", async function() {
      // User tries to pay less
      const lowPrice = ethers.parseEther("0.05");
      await expect(
        eventContract.connect(user1).purchaseTicket({value: lowPrice})
      ).to.be.revertedWithCustomError(eventContract, "InsufficientPayment");
    });
  });
  
  describe("Secondary Market", function() {
    beforeEach(async function() {
      // User1 buys a ticket
      await eventContract.connect(user1).purchaseTicket({value: EVENT_PRICE});
    });
    
    it("Should allow listing a ticket for resale", async function() {
      // List the ticket at 150% of original price (max allowed)
      const resalePrice = EVENT_PRICE * 150n / 100n;
      await ticketNFT.connect(user1).listTicketForSale(1, resalePrice);
      
      // Check listing
      const listing = await ticketNFT.marketItems(1);
      expect(listing.isForSale).to.equal(true);
      expect(listing.askingPrice).to.equal(resalePrice);
      expect(listing.seller).to.equal(user1.address);
    });
    
    it("Should reject listings above max resale price", async function() {
      // Try to list at 160% (above 150% limit)
      const tooHighPrice = EVENT_PRICE * 160n / 100n;
      
      await expect(
        ticketNFT.connect(user1).listTicketForSale(1, tooHighPrice)
      ).to.be.revertedWithCustomError(ticketNFT, "ResalePriceTooHigh");
    });
    
    it("Should allow buying a listed ticket", async function() {
      // List the ticket
      const resalePrice = EVENT_PRICE * 150n / 100n;
      await ticketNFT.connect(user1).listTicketForSale(1, resalePrice);
      
      // User2 buys the ticket
      await ticketNFT.connect(user2).purchaseTicket(1, {value: resalePrice});
      
      // Check ownership transferred
      expect(await ticketNFT.ownerOf(1)).to.equal(user2.address);
      
      // Check listing removed
      const listing = await ticketNFT.marketItems(1);
      expect(listing.isForSale).to.equal(false);
      
      // Check secondary fee was collected
      const revenue = await eventContract.totalRevenue();
      expect(revenue[1]).to.equal(resalePrice * 10n / 100n); // 10% venue fee
    });
    
    it("Should allow the venue to withdraw funds", async function() {
      // List and sell a ticket to generate both primary and secondary revenue
      const resalePrice = EVENT_PRICE * 150n / 100n;
      await ticketNFT.connect(user1).listTicketForSale(1, resalePrice);
      await ticketNFT.connect(user2).purchaseTicket(1, {value: resalePrice});
      
      // Get venue balance before withdrawal
      const venueBalanceBefore = await ethers.provider.getBalance(venue.address);
      
      // Withdraw funds
      await eventContract.connect(venue).withdrawFunds();
      
      // Get venue balance after withdrawal
      const venueBalanceAfter = await ethers.provider.getBalance(venue.address);
      
      // Calculate expected revenue
      const primaryRevenue = EVENT_PRICE;
      const secondaryRevenue = resalePrice * 10n / 100n;
      const totalRevenue = primaryRevenue + secondaryRevenue;
      
      // Check balance increased (allowing for gas costs)
      const balanceIncrease = venueBalanceAfter - venueBalanceBefore;
      
      // We allow for some variation due to gas costs
      expect(balanceIncrease).to.be.greaterThan(totalRevenue - ethers.parseEther("0.01"));
      expect(balanceIncrease).to.be.lessThan(totalRevenue + ethers.parseEther("0.01"));
      
      // Check contract state was reset
      const revenueAfter = await eventContract.totalRevenue();
      expect(revenueAfter[0]).to.equal(0);
      expect(revenueAfter[1]).to.equal(0);
    });
  });
}); 