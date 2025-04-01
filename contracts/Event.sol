// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./TicketNFT.sol"; // Import the NFT contract to interact with it

/**
 * @title Event
 * @dev Manages ticket sales for a specific event.
 * Deployed by TicketingSystem.
 */
contract Event is ReentrancyGuard {
    // --- Enums ---

    enum SalePhase { Active, SoldOut, Closed }

    // --- State Variables ---

    address public immutable ticketingSystem; // Address of the factory contract
    address public immutable venue; // Address of the venue organizing the event
    TicketNFT public immutable ticketNFT; // The NFT contract for this event's tickets

    string public eventName; // Cache name for convenience
    uint256 public immutable ticketPrice; // Price in wei
    uint256 public immutable maxTickets;
    uint256 public ticketsSold;

    SalePhase public currentPhase;

    uint256 private nextTokenId = 1; // Simple sequential token IDs
    
    // Revenue tracking
    uint256 public primarySalesRevenue; // Revenue from direct sales
    uint256 public secondarySalesRevenue; // Revenue from secondary market fees
    
    // Event details
    uint256 public eventDate; // Unix timestamp for the event
    string public eventLocation; // Physical location of the event
    string public eventDescription; // Description of the event
    
    // Ticket type mapping
    mapping(string => bool) public validTicketTypes; // Track which ticket types are valid for this event

    // --- Events ---

    event PhaseChanged(SalePhase newPhase);
    event TicketPurchased(address indexed buyer, uint256 indexed tokenId);
    event FundsWithdrawn(address indexed venue, uint256 primaryAmount, uint256 secondaryAmount);
    event SecondaryFeeReceived(uint256 amount);
    event EventDetailsUpdated(uint256 eventDate, string eventLocation, string eventDescription);
    event TicketMetadataSet(uint256 indexed tokenId, string seatInfo, string ticketType);
    event BaseURISet(string baseURI);
    event TicketTypeAdded(string ticketType);

    // --- Errors ---
    error InvalidPhase(SalePhase expected, SalePhase actual);
    error MaxTicketsReached();
    error InsufficientPayment(uint256 sent, uint256 required);
    error NothingToWithdraw();
    error OnlyVenue();
    error ZeroAddress();
    error NotTicketNFT();
    error InvalidTicketType(string ticketType);

    // --- Modifiers ---

    modifier onlyVenueM() {
        if (msg.sender != venue) revert OnlyVenue();
        _;
    }

    modifier inPhase(SalePhase _phase) {
        if (currentPhase != _phase) revert InvalidPhase(_phase, currentPhase);
        _;
    }

    modifier checkNonZeroAddress(address _addr) {
        if (_addr == address(0)) revert ZeroAddress();
        _;
    }
    
    modifier onlyTicketNFT() {
        if (msg.sender != address(ticketNFT)) revert NotTicketNFT();
        _;
    }

    // --- Constructor ---

    /**
     * @param _ticketingSystem Address of the deploying TicketingSystem contract.
     * @param _venue Address of the venue operating this event.
     * @param _ticketNFT Address of the associated TicketNFT contract.
     * @param _eventName Event name.
     * @param _ticketPrice Ticket price in wei.
     * @param _maxTickets Maximum number of tickets available.
     */
    constructor(
        address _ticketingSystem,
        address _venue,
        address _ticketNFT,
        string memory _eventName,
        uint256 _ticketPrice,
        uint256 _maxTickets
    ) {
        require(_ticketingSystem != address(0), "Event: Invalid TicketingSystem");
        require(_venue != address(0), "Event: Invalid Venue");
        require(_ticketNFT != address(0), "Event: Invalid TicketNFT");
        require(_maxTickets > 0, "Event: Max tickets must be > 0");

        ticketingSystem = _ticketingSystem;
        venue = _venue;
        ticketNFT = TicketNFT(_ticketNFT); // Store as contract type
        eventName = _eventName;
        ticketPrice = _ticketPrice;
        maxTickets = _maxTickets;

        // Initialize the TicketNFT contract, setting this Event contract as the owner
        ticketNFT.initializeEventContract();
        
        // Add default ticket type
        validTicketTypes["General Admission"] = true;
        
        // Set default base URI - can be updated later by venue
        string memory defaultBaseURI = "https://api.ticketing.example/metadata/";
        ticketNFT.setBaseURI(defaultBaseURI);

        // Start in Active phase
        currentPhase = SalePhase.Active;
        emit PhaseChanged(SalePhase.Active);
    }
    
    // --- Event Metadata Management ---
    
    /**
     * @dev Updates the event details. Only callable by the venue.
     * @param _eventDate Unix timestamp for when the event occurs
     * @param _eventLocation Physical location of the event
     * @param _eventDescription Description of the event
     */
    function setEventDetails(
        uint256 _eventDate,
        string memory _eventLocation,
        string memory _eventDescription
    ) 
        external 
        onlyVenueM 
    {
        eventDate = _eventDate;
        eventLocation = _eventLocation;
        eventDescription = _eventDescription;
        
        emit EventDetailsUpdated(_eventDate, _eventLocation, _eventDescription);
    }
    
    /**
     * @dev Sets the base URI for ticket metadata. Only callable by the venue.
     * @param _baseURI Base URI for all ticket metadata
     */
    function setBaseURI(string memory _baseURI) external onlyVenueM {
        ticketNFT.setBaseURI(_baseURI);
        
        emit BaseURISet(_baseURI);
    }
    
    /**
     * @dev Adds a valid ticket type for this event. Only callable by the venue.
     * @param ticketType The ticket type to add (e.g., "VIP", "Backstage", etc.)
     */
    function addTicketType(string memory ticketType) external onlyVenueM {
        validTicketTypes[ticketType] = true;
        
        emit TicketTypeAdded(ticketType);
    }
    
    /**
     * @dev Sets metadata for a specific ticket. Only callable by the venue.
     * @param tokenId The ID of the ticket
     * @param seatInfo Information about the seat (e.g., "Section A, Row 5, Seat 12")
     * @param ticketType Type of ticket (must be a valid type)
     */
    function setTicketMetadata(
        uint256 tokenId,
        string memory seatInfo,
        string memory ticketType
    ) 
        external 
        onlyVenueM 
    {
        // Ensure the ticket type is valid
        if (!validTicketTypes[ticketType]) {
            revert InvalidTicketType(ticketType);
        }
        
        // Set the metadata on the NFT contract
        ticketNFT.setTicketMetadata(tokenId, seatInfo, ticketType, eventDate);
        
        emit TicketMetadataSet(tokenId, seatInfo, ticketType);
    }

    // --- Phase Management (Venue Controlled) ---

    function closeEvent() external onlyVenueM {
        currentPhase = SalePhase.Closed;
        emit PhaseChanged(SalePhase.Closed);
    }

    // --- Public Sale Functions ---

    /**
     * @dev Purchase a ticket directly.
     */
    function purchaseTicket() external payable nonReentrant inPhase(SalePhase.Active) checkNonZeroAddress(msg.sender) {
        // Check if ticket limit reached
        if (ticketsSold >= maxTickets) {
            revert MaxTicketsReached();
        }
        
        // Check payment amount
        if (msg.value != ticketPrice) {
            revert InsufficientPayment(msg.value, ticketPrice);
        }

        uint256 tokenIdToMint = nextTokenId++;
        ticketsSold++;
        primarySalesRevenue += msg.value; // Track primary sales revenue

        // Mint the NFT ticket
        ticketNFT.mintTicket(msg.sender, tokenIdToMint, ticketPrice);
        
        // Set default metadata for the newly minted ticket
        ticketNFT.setTicketMetadata(
            tokenIdToMint,
            "General Admission", // Default seat info
            "General Admission", // Default ticket type
            eventDate
        );

        emit TicketPurchased(msg.sender, tokenIdToMint);

        // Check if sold out
        if (ticketsSold == maxTickets) {
            currentPhase = SalePhase.SoldOut;
            emit PhaseChanged(SalePhase.SoldOut);
        }
    }
    
    /**
     * @dev Receive secondary market fees from TicketNFT contract
     * This function is called by the TicketNFT contract when a secondary sale occurs
     */
    function receiveSecondaryFee() external payable onlyTicketNFT {
        secondarySalesRevenue += msg.value;
        emit SecondaryFeeReceived(msg.value);
    }

    // --- Venue Functions ---

    /**
     * @dev Allows the venue to withdraw collected funds.
     * Now tracks and reports primary and secondary revenue separately
     */
    function withdrawFunds() external onlyVenueM nonReentrant {
        uint256 primaryAmount = primarySalesRevenue;
        uint256 secondaryAmount = secondarySalesRevenue;
        uint256 totalAmount = primaryAmount + secondaryAmount;
        
        if (totalAmount == 0) {
            revert NothingToWithdraw();
        }
        
        // Reset revenue tracking
        primarySalesRevenue = 0;
        secondarySalesRevenue = 0;
        
        // Send funds to the venue
        (bool success, ) = venue.call{value: totalAmount}("");
        require(success, "Event: Fund transfer failed");

        emit FundsWithdrawn(venue, primaryAmount, secondaryAmount);
    }

    // --- View Functions ---

    /**
     * @dev Returns if tickets are still available for purchase.
     */
    function ticketsAvailable() external view returns (bool) {
        return (currentPhase == SalePhase.Active && ticketsSold < maxTickets);
    }

    /**
     * @dev Returns the number of tickets remaining.
     */
    function remainingTickets() external view returns (uint256) {
        return maxTickets - ticketsSold;
    }
    
    /**
     * @dev Returns the total revenue (both primary and secondary).
     */
    function totalRevenue() external view returns (uint256 primary, uint256 secondary, uint256 total) {
        primary = primarySalesRevenue;
        secondary = secondarySalesRevenue;
        total = primary + secondary;
    }
    
    /**
     * @dev Fallback function to receive ETH (required for ticket NFT to send fees)
     */
    receive() external payable {
        // Only the ticketNFT contract should send ETH directly
        if (msg.sender != address(ticketNFT)) {
            revert NotTicketNFT();
        }
        
        secondarySalesRevenue += msg.value;
        emit SecondaryFeeReceived(msg.value);
    }
}
