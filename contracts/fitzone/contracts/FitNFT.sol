// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FitNFT
 * @dev NFT contract for fitness runs with marketplace functionality using PYUSD
 * NFTs are minted when users complete runs and contain run data
 */
contract FitNFT is ERC721, ERC721URIStorage, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // PYUSD token contract address
    IERC20 public immutable pyusdToken;
    
    uint256 private _nextTokenId = 1;

    struct RunData {
        address runner;
        uint256 distance; // in meters
        uint256 duration; // in seconds
        uint256 timestamp;
        string zoneName;
        string zoneCoordinates;
        uint256 pointsEarned;
        uint256 averageSpeed; // calculated: distance/duration
    }

    struct MarketListing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }

    mapping(uint256 => RunData) public runData;
    mapping(uint256 => MarketListing) public marketListings;
    mapping(address => uint256[]) public userNFTs;

    uint256[] public listedTokenIds;
    mapping(uint256 => uint256) private listedTokenIndex; // tokenId => index in listedTokenIds

    // Platform fee for marketplace (2.5%)
    uint256 public constant PLATFORM_FEE = 250; // 250 = 2.5% (basis points)
    uint256 public constant BASIS_POINTS = 10000;

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed runner,
        uint256 distance,
        uint256 duration,
        string zoneName,
        uint256 pointsEarned
    );

    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event NFTSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    event ListingCancelled(uint256 indexed tokenId, address indexed seller);

    constructor(address _pyusdToken) ERC721("FitNFT", "FNFT") Ownable(msg.sender) {
        require(_pyusdToken != address(0), "Invalid PYUSD token address");
        pyusdToken = IERC20(_pyusdToken);
    }

    /**
     * @dev Mint NFT for completed run
     * Can be called by users themselves or by backend service
     */
    function mintRunNFT(
        address runner,
        uint256 distance,
        uint256 duration,
        string memory zoneName,
        string memory zoneCoordinates,
        uint256 pointsEarned,
        string memory metadataURI
    ) external returns (uint256) {
        // Allow users to mint for themselves or owner to mint for any user
        require(
            msg.sender == runner || msg.sender == owner(),
            "Not authorized to mint for this runner"
        );

        uint256 newTokenId = _nextTokenId++;

        _safeMint(runner, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        uint256 averageSpeed = duration > 0 ? (distance * 1000) / duration : 0; // m/s * 1000 for precision

        runData[newTokenId] = RunData({
            runner: runner,
            distance: distance,
            duration: duration,
            timestamp: block.timestamp,
            zoneName: zoneName,
            zoneCoordinates: zoneCoordinates,
            pointsEarned: pointsEarned,
            averageSpeed: averageSpeed
        });

        userNFTs[runner].push(newTokenId);

        emit NFTMinted(
            newTokenId,
            runner,
            distance,
            duration,
            zoneName,
            pointsEarned
        );

        return newTokenId;
    }

    /**
     * @dev List NFT for sale
     */
    function listNFT(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(!marketListings[tokenId].active, "Already listed");

        // Transfer NFT to contract for escrow
        transferFrom(msg.sender, address(this), tokenId);

        marketListings[tokenId] = MarketListing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: block.timestamp
        });

        // Add to listed tokens array
        listedTokenIndex[tokenId] = listedTokenIds.length;
        listedTokenIds.push(tokenId);

        emit NFTListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Buy NFT from marketplace
     */
    function buyNFT(uint256 tokenId, uint256 paymentAmount) external nonReentrant {
        MarketListing storage listing = marketListings[tokenId];
        require(listing.active, "Not listed for sale");
        require(paymentAmount >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own NFT");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Transfer PYUSD from buyer to contract
        pyusdToken.safeTransferFrom(msg.sender, address(this), paymentAmount);

        // Calculate fees
        uint256 platformFee = (price * PLATFORM_FEE) / BASIS_POINTS;
        uint256 sellerAmount = price - platformFee;

        // Mark listing as inactive
        listing.active = false;

        // Remove from listed tokens array
        _removeFromListedTokens(tokenId);

        // Transfer NFT to buyer
        _transfer(address(this), msg.sender, tokenId);

        // Update user NFTs mapping
        _removeFromUserNFTs(seller, tokenId);
        userNFTs[msg.sender].push(tokenId);

        // Transfer PYUSD payments
        pyusdToken.safeTransfer(seller, sellerAmount);
        pyusdToken.safeTransfer(owner(), platformFee);

        // Refund excess payment
        if (paymentAmount > price) {
            pyusdToken.safeTransfer(msg.sender, paymentAmount - price);
        }

        emit NFTSold(tokenId, seller, msg.sender, price);
    }

    /**
     * @dev Cancel NFT listing
     */
    function cancelListing(uint256 tokenId) external {
        MarketListing storage listing = marketListings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");

        listing.active = false;

        // Remove from listed tokens array
        _removeFromListedTokens(tokenId);

        // Return NFT to seller
        _transfer(address(this), msg.sender, tokenId);

        emit ListingCancelled(tokenId, msg.sender);
    }

    /**
     * @dev Update listing price
     */
    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        MarketListing storage listing = marketListings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");
        require(newPrice > 0, "Price must be greater than 0");

        listing.price = newPrice;

        emit NFTListed(tokenId, msg.sender, newPrice);
    }

    /**
     * @dev Get all listed NFTs
     */
    function getListedNFTs() external view returns (MarketListing[] memory) {
        uint256 activeCount = 0;

        // Count active listings
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (marketListings[listedTokenIds[i]].active) {
                activeCount++;
            }
        }

        MarketListing[] memory activeListings = new MarketListing[](
            activeCount
        );
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            uint256 tokenId = listedTokenIds[i];
            if (marketListings[tokenId].active) {
                activeListings[currentIndex] = marketListings[tokenId];
                currentIndex++;
            }
        }

        return activeListings;
    }

    /**
     * @dev Get NFTs owned by user
     */
    function getUserNFTs(
        address user
    ) external view returns (uint256[] memory) {
        return userNFTs[user];
    }

    /**
     * @dev Get run data for NFT
     */
    function getRunData(
        uint256 tokenId
    ) external view returns (RunData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return runData[tokenId];
    }

    /**
     * @dev Internal function to remove token from listed tokens array
     */
    function _removeFromListedTokens(uint256 tokenId) internal {
        uint256 index = listedTokenIndex[tokenId];
        uint256 lastIndex = listedTokenIds.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = listedTokenIds[lastIndex];
            listedTokenIds[index] = lastTokenId;
            listedTokenIndex[lastTokenId] = index;
        }

        listedTokenIds.pop();
        delete listedTokenIndex[tokenId];
    }

    /**
     * @dev Internal function to remove token from user NFTs array
     */
    function _removeFromUserNFTs(address user, uint256 tokenId) internal {
        uint256[] storage tokens = userNFTs[user];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    /**
     * @dev Override required by Solidity
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Withdraw contract balance (platform fees in PYUSD)
     */
    function withdraw() external onlyOwner {
        uint256 balance = pyusdToken.balanceOf(address(this));
        if (balance > 0) {
            pyusdToken.safeTransfer(owner(), balance);
        }
    }

    /**
     * @dev Get total number of minted NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
