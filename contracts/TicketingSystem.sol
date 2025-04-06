// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
// We will need to import the Event contract later
// import "./Event.sol";
import "./Event.sol"; // Import the Event contract
import "./TicketNFT.sol"; // Import the TicketNFT contract

/**
 * @title TicketingSystem
 * @dev Main contract for venues to deploy event contracts.
 */
contract TicketingSystem is Ownable {
    // --- State Variables ---

    mapping(address => bool) public isVenueAuthorized;
    address[] public deployedEvents; // Keep track of created event contracts

    // --- Structs ---

    // Configuration passed to each new event contract
    struct EventConfig {
        string name;
        string symbol; // For the NFT Ticket
        uint256 ticketPrice; // Base ticket price in wei
        uint256 maxTickets; // Maximum number of tickets available
        uint256 resaleLimitMultiplier; // e.g., 120 for 120% resale limit (1.2x original price)
        uint256 venueFeePercentage; // Fee in basis points (e.g., 500 = 5%)
        // We can add more complex configurations later (stratified pricing, types, etc.)
    }

    // --- Events ---

    event VenueAuthorizationChanged(address indexed venue, bool authorized);
    event EventCreated(
        address indexed venue,
        address indexed eventContract,
        address indexed ticketNFTAddress,
        string name,
        string symbol,
        uint256 ticketPrice,
        uint256 maxTickets
    );

    // --- Constructor ---

    constructor() {
        _transferOwnership(msg.sender); // Sets the deployer as the owner
    }

    // --- Owner Functions ---

    /**
     * @dev Authorize or deauthorize a venue address. Only owner.
     * @param _venue The address of the venue.
     * @param _authorized True to authorize, false to deauthorize.
     */
    function setVenueAuthorization(address _venue, bool _authorized)
        external
        onlyOwner
    {
        require(_venue != address(0), "TicketingSystem: Invalid venue address");
        isVenueAuthorized[_venue] = _authorized;
        emit VenueAuthorizationChanged(_venue, _authorized);
    }

    // --- Venue Functions ---

    /**
     * @dev Allows an authorized venue to create a new Event contract.
     * @param _name Name of the event
     * @param _symbol Symbol for the NFT ticket
     * @param _ticketPrice Base ticket price in wei
     * @param _maxTickets Maximum number of tickets available
     * @param _resaleLimitMultiplier Multiplier for resale limit (e.g., 120 for 120% of original price)
     * @param _venueFeePercentage Fee in basis points (e.g., 500 = 5%)
     */
    function createEvent(
        string calldata _name,
        string calldata _symbol,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _resaleLimitMultiplier,
        uint256 _venueFeePercentage
    )
        external
        returns (address eventContractAddress)
    {
        require(
            isVenueAuthorized[msg.sender],
            "TicketingSystem: Caller is not an authorized venue"
        );
        require(
            bytes(_name).length > 0,
            "TicketingSystem: Event name required"
        );
        require(
            bytes(_symbol).length > 0,
            "TicketingSystem: Ticket symbol required"
        );
        require(
            _maxTickets > 0,
            "TicketingSystem: Max tickets must be > 0"
        );
        // Resale limit must allow at least the original price (100%)
        require(
            _resaleLimitMultiplier >= 100,
            "TicketingSystem: Resale limit must be >= 100%"
        );
        
        // Validate venue fee
        require(
            _venueFeePercentage <= 3000, // Maximum 30% fee
            "TicketingSystem: Venue fee too high"
        );

        // --- Actual Deployment Logic ---

        // 1. Deploy the TicketNFT contract
        TicketNFT newTicketNFT = new TicketNFT(
            _name, // Use event name for NFT collection name
            _symbol,
            _resaleLimitMultiplier,
            _venueFeePercentage
        );
        address ticketNFTAddress = address(newTicketNFT);

        // 2. Deploy the Event contract
        // We pass 'this' for the TicketingSystem address, msg.sender for the venue,
        // the new TicketNFT address, and config details.
        Event newEvent = new Event(
            address(this),
            msg.sender, // The venue calling this function
            ticketNFTAddress,
            _name,
            _ticketPrice,
            _maxTickets
        );
        eventContractAddress = address(newEvent); // Assign the deployed address

        // 3. Store the deployed event address
        deployedEvents.push(eventContractAddress);

        // 4. Emit the EventCreated event
        emit EventCreated(
            msg.sender,
            eventContractAddress, // Use the actual deployed address
            ticketNFTAddress,
            _name,
            _symbol,
            _ticketPrice,
            _maxTickets
        );

        // return eventContractAddress; // Already declared return variable
    }

    // --- View Functions ---

    /**
     * @dev Get the number of events deployed through this system.
     */
    function getDeployedEventsCount() external view returns (uint256) {
        return deployedEvents.length;
    }
}
