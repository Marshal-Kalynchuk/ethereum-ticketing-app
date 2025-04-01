// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TicketNFT
 * @dev Represents event tickets as NFTs with resale restrictions.
 * Includes built-in marketplace functionality to enforce resale price limits.
 */
contract TicketNFT is ERC721, ERC721Enumerable, ReentrancyGuard {
    // --- State Variables ---

    address public eventContract; // Address of the Event contract managing these tickets
    bool private isEventContractInitialized; // Flag to ensure one-time initialization
    uint256 public immutable resaleLimitMultiplier; // e.g., 120 means 120% of original price
    mapping(uint256 => uint256) public originalPrice; // tokenId -> price paid at mint
    
    // Marketplace functionality
    mapping(uint256 => MarketItem) public marketItems; // tokenId -> market listing
    
    // Venue fee configuration
    uint256 public immutable venueFeePercentage; // Fee in basis points (e.g., 500 = 5%)
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000
    
    // Metadata storage
    string private baseURI; // Base URI for all token metadata
    mapping(uint256 => TicketMetadata) private ticketMetadata; // Additional per-ticket metadata
    
    // --- Structs ---
    struct MarketItem {
        bool isForSale;
        uint256 askingPrice;
        address seller;
    }
    
    struct TicketMetadata {
        string seatInfo;     // E.g., "Section A, Row 3, Seat 15"
        string ticketType;   // E.g., "VIP", "General Admission", "Backstage"
        uint256 eventDate;   // Timestamp of the event
    }

    // --- Events ---
    event TicketListed(uint256 indexed tokenId, uint256 price, address indexed seller);
    event TicketSold(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed buyer);
    event ListingCancelled(uint256 indexed tokenId);
    event BaseURIUpdated(string newBaseURI);
    event TicketMetadataSet(uint256 indexed tokenId, string seatInfo, string ticketType);

    // --- Errors ---
    error NotEventContract();
    error ResalePriceTooHigh(uint256 tokenId, uint256 askingPrice, uint256 maxPrice);
    error AlreadyInitialized();
    error ZeroAddress();
    error NotTicketOwner();
    error NotForSale();
    error PriceNotMet(uint256 required, uint256 provided);
    error TransferDisabled(string reason);

    // --- Modifiers ---
    modifier onlyEventContract() {
        if (msg.sender != eventContract) revert NotEventContract();
        _;
    }
    
    modifier onlyTicketOwner(uint256 tokenId) {
        if (ownerOf(tokenId) != msg.sender) revert NotTicketOwner();
        _;
    }

    // --- Constructor ---

    /**
     * @param _name Name of the NFT collection (e.g., "My Concert Tickets").
     * @param _symbol Symbol for the NFT collection (e.g., "MCT").
     * @param _resaleLimitMultiplier Multiplier for resale limit (e.g., 120 for 120%).
     * @param _venueFeePercentage Fee percentage in basis points (e.g., 500 = 5%)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _resaleLimitMultiplier,
        uint256 _venueFeePercentage
    ) ERC721(_name, _symbol) {
        require(
            _resaleLimitMultiplier >= 100,
            "TicketNFT: Resale limit must be >= 100%"
        );
        require(
            _venueFeePercentage <= 3000, // Maximum 30% fee
            "TicketNFT: Venue fee too high"
        );
        resaleLimitMultiplier = _resaleLimitMultiplier;
        venueFeePercentage = _venueFeePercentage;
    }

    // --- Initialization Function ---

    /**
     * @dev Sets the address of the managing Event contract. Can only be called once.
     * Expected to be called by the Event contract's constructor.
     */
    function initializeEventContract() external {
        if (isEventContractInitialized) revert AlreadyInitialized();
        if (msg.sender == address(0)) revert ZeroAddress(); // Ensure event contract is not zero

        eventContract = msg.sender;
        isEventContractInitialized = true;
    }

    // --- Minting Function ---

    /**
     * @dev Mints a new ticket NFT. Only callable by the associated Event contract.
     * @param to The address to receive the ticket.
     * @param tokenId The unique ID for this ticket.
     * @param _purchasePrice The price the ticket was originally sold for.
     */
    function mintTicket(address to, uint256 tokenId, uint256 _purchasePrice)
        external
        onlyEventContract
    {
        _safeMint(to, tokenId);
        originalPrice[tokenId] = _purchasePrice;
    }
    
    // --- Metadata Functions ---
    
    /**
     * @dev Sets the base URI for all token metadata.
     * Only callable by the Event contract.
     * @param _newBaseURI The new base URI (e.g., "https://api.example.com/tickets/")
     */
    function setBaseURI(string memory _newBaseURI) external onlyEventContract {
        baseURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }
    
    /**
     * @dev Sets additional metadata for a specific ticket. 
     * Only callable by the Event contract.
     * @param tokenId The ticket ID
     * @param seatInfo Information about the ticket's seat
     * @param ticketType Type of ticket (VIP, etc.)
     * @param eventDate Timestamp of the event
     */
    function setTicketMetadata(
        uint256 tokenId, 
        string memory seatInfo, 
        string memory ticketType,
        uint256 eventDate
    ) 
        external 
        onlyEventContract 
    {
        ticketMetadata[tokenId] = TicketMetadata({
            seatInfo: seatInfo,
            ticketType: ticketType,
            eventDate: eventDate
        });
        
        emit TicketMetadataSet(tokenId, seatInfo, ticketType);
    }
    
    /**
     * @dev Returns the URI for a given token ID.
     * @param tokenId The ID of the ticket
     * @return The URI string
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "TicketNFT: URI query for nonexistent token");
        
        // Convert tokenId to string and combine with baseURI
        return bytes(baseURI).length > 0 
            ? string(abi.encodePacked(baseURI, _toString(tokenId), ".json"))
            : "";
    }
    
    /**
     * @dev Returns the metadata for a given ticket.
     * @param tokenId The ID of the ticket
     * @return seatInfo The seat information for the ticket
     * @return ticketType The type of ticket (VIP, etc.)
     * @return eventDate The timestamp of the event
     */
    function getTicketMetadata(uint256 tokenId) 
        external 
        view 
        returns (string memory seatInfo, string memory ticketType, uint256 eventDate) 
    {
        require(_exists(tokenId), "TicketNFT: Metadata query for nonexistent token");
        
        TicketMetadata memory metadata = ticketMetadata[tokenId];
        return (metadata.seatInfo, metadata.ticketType, metadata.eventDate);
    }
    
    /**
     * @dev Returns the base URI.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
    
    /**
     * @dev Converts a uint256 to its string representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        // Handle 0 case
        if (value == 0) {
            return "0";
        }
        
        // Find the length of the resulting string
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        // Build the string from right to left
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }

    // --- Marketplace Functions ---
    
    /**
     * @dev List a ticket for sale at the specified price.
     * @param tokenId ID of the ticket to list
     * @param askingPrice Price at which to list the ticket
     */
    function listTicketForSale(uint256 tokenId, uint256 askingPrice) 
        external 
        onlyTicketOwner(tokenId) 
    {
        // Check if price is within resale limit
        uint256 maxResalePrice = (originalPrice[tokenId] * resaleLimitMultiplier) / 100;
        if (askingPrice > maxResalePrice) {
            revert ResalePriceTooHigh(tokenId, askingPrice, maxResalePrice);
        }
        
        // Set approval for this contract to handle the transfer when sold
        approve(address(this), tokenId);
        
        // Create or update market listing
        marketItems[tokenId] = MarketItem({
            isForSale: true,
            askingPrice: askingPrice,
            seller: msg.sender
        });
        
        emit TicketListed(tokenId, askingPrice, msg.sender);
    }
    
    /**
     * @dev Purchase a ticket that is listed for sale.
     * @param tokenId ID of the ticket to purchase
     */
    function purchaseTicket(uint256 tokenId) 
        external 
        payable
        nonReentrant 
    {
        MarketItem storage item = marketItems[tokenId];
        
        // Check if ticket is for sale
        if (!item.isForSale) {
            revert NotForSale();
        }
        
        // Verify payment amount
        if (msg.value < item.askingPrice) {
            revert PriceNotMet(item.askingPrice, msg.value);
        }
        
        address seller = item.seller;
        uint256 price = item.askingPrice;
        
        // Clear the market listing
        delete marketItems[tokenId];
        
        // Transfer ownership of the ticket
        _transfer(seller, msg.sender, tokenId);
        
        // Calculate venue fee
        uint256 venueFee = (price * venueFeePercentage) / BASIS_POINTS;
        uint256 sellerAmount = price - venueFee;
        
        // Transfer payment to seller
        (bool sellerSuccess, ) = payable(seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment transfer failed");
        
        // Transfer fee to venue (via event contract)
        if (venueFee > 0) {
            (bool venueSuccess, ) = eventContract.call{value: venueFee}(
                abi.encodeWithSignature("receiveSecondaryFee()")
            );
            require(venueSuccess, "Venue fee transfer failed");
        }
        
        // Refund excess payment if any
        uint256 excess = msg.value - price;
        if (excess > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "Refund transfer failed");
        }
        
        emit TicketSold(tokenId, price, seller, msg.sender);
    }
    
    /**
     * @dev Cancel a ticket listing
     * @param tokenId ID of the ticket to delist
     */
    function cancelListing(uint256 tokenId) 
        external 
        onlyTicketOwner(tokenId) 
    {
        if (!marketItems[tokenId].isForSale) {
            revert NotForSale();
        }
        
        delete marketItems[tokenId];
        
        emit ListingCancelled(tokenId);
    }
    
    /**
     * @dev Check the maximum allowed resale price for a ticket
     * @param tokenId The ticket ID to check
     * @return The maximum allowed resale price
     */
    function getMaxResalePrice(uint256 tokenId) external view returns (uint256) {
        return (originalPrice[tokenId] * resaleLimitMultiplier) / 100;
    }

    // --- Transfer Restrictions ---
    
    /**
     * @dev Disable direct transfers except for marketplace operations.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Enumerable) {
        // Allow minting (from == 0) and marketplace operations (from == seller in listing)
        if (from != address(0) && // not minting
            from != eventContract && // not from event contract
            to != eventContract && // not to event contract
            address(this) != getApproved(tokenId)) { // not through our marketplace
            
            revert TransferDisabled("Must use marketplace functions to transfer tickets");
        }
        
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // --- Required Overrides ---

    /**
     * @dev Override for OpenZeppelin ERC721Enumerable
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
