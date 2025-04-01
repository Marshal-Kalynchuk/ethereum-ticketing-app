const { expect } = require("chai");
const { ethers } = require("hardhat");

// Common test setup functions
async function deployTicketingSystem() {
  const TicketingSystem = await ethers.getContractFactory("TicketingSystem");
  const ticketingSystem = await TicketingSystem.deploy();
  return ticketingSystem;
}

async function createEvent(ticketingSystem, venue, options = {}) {
  const eventConfig = {
    name: options.name || "Test Concert",
    symbol: options.symbol || "TCKT",
    ticketPrice: options.ticketPrice || ethers.parseEther("0.1"),
    maxTickets: options.maxTickets || 100,
    resaleLimitMultiplier: options.resaleLimitMultiplier || 120,
    venueFeePercentage: options.venueFeePercentage || 500 // 5%
  };
  
  const tx = await ticketingSystem.connect(venue).createEvent(eventConfig);
  const receipt = await tx.wait();
  
  // Get the event address from the logs
  const eventCreatedEvent = receipt.logs
    .map(log => {
      try {
        return ticketingSystem.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .filter(parsedLog => parsedLog && parsedLog.name === 'EventCreated')[0];
  
  const eventAddress = eventCreatedEvent.args.eventContract;
  
  // Connect to the Event contract
  const Event = await ethers.getContractFactory("Event");
  const eventContract = Event.attach(eventAddress);
  
  // Get the NFT address and connect
  const nftAddress = await eventContract.ticketNFT();
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = TicketNFT.attach(nftAddress);
  
  return { eventContract, ticketNFT };
}

module.exports = {
  deployTicketingSystem,
  createEvent
};