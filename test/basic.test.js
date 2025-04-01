const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ticketing System Basic Test", function () {
  let ticketingSystem;
  let owner, venue, user1, user2;
  
  beforeEach(async function() {
    [owner, venue, user1, user2] = await ethers.getSigners();
    
    // Deploy TicketingSystem
    const TicketingSystem = await ethers.getContractFactory("TicketingSystem");
    ticketingSystem = await TicketingSystem.deploy();
    // No need to call .deployed() in newer versions of Hardhat
  });
  
  it("Should deploy TicketingSystem contract", async function() {
    expect(await ticketingSystem.owner()).to.equal(owner.address);
  });
  
  it("Should authorize a venue", async function() {
    await ticketingSystem.setVenueAuthorization(venue.address, true);
    expect(await ticketingSystem.isVenueAuthorized(venue.address)).to.equal(true);
  });
}); 