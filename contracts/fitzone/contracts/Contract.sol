// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FitZone
 * @dev ERC721 NFT contract for FitConquer zone ownership with time-based decay
 * Each token represents ownership of an H3 geographical zone
 * Ownership power decays over time, allowing challenges from fitter runners
 */
contract FitZone is
    ERC721,
    ERC721Enumerable,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    struct ZoneInfo {
        string h3Index; // H3 geographical index
        uint256 lastCapturedAt; // Block timestamp of last capture
        uint256 captureScore; // Score required to capture this zone
        address originalCapturer; // First person to capture this zone
        uint256 totalCaptures; // Number of times this zone was captured
    }

    // Mapping from token ID to zone information
    mapping(uint256 => ZoneInfo) public zones;

    // Mapping from H3 index to token ID (for quick lookups)
    mapping(string => uint256) public h3ToToken;

    // Mapping to track if an H3 index has been used
    mapping(string => bool) public h3Exists;

    // Counter for token IDs
    uint256 private _nextTokenId = 1;

    // Decay rate: points lost per day (86400 seconds)
    uint256 public constant DECAY_RATE = 1;
    uint256 public constant SECONDS_PER_DAY = 86400;

    // Minimum score required to capture any zone
    uint256 public minCaptureScore = 50;

    // Fee for capturing a zone (in wei)
    uint256 public captureFee = 0.001 ether;

    // Events
    event ZoneCaptured(
        uint256 indexed tokenId,
        string indexed h3Index,
        address indexed newOwner,
        uint256 captureScore,
        uint256 timestamp
    );

    event ZoneTransferred(
        uint256 indexed tokenId,
        string h3Index,
        address indexed from,
        address indexed to,
        uint256 captureScore,
        uint256 previousScore
    );

    event ScoreDecayCalculated(
        uint256 indexed tokenId,
        uint256 originalScore,
        uint256 currentScore,
        uint256 daysPassed
    );

    constructor() ERC721("FitConquer Zone", "FITZONE") Ownable(msg.sender) {}

    function claimZone(
        string calldata h3Index,
        uint256 baseScore
    ) external payable nonReentrant whenNotPaused {
        require(bytes(h3Index).length > 0, "Invalid H3 index");
        require(baseScore >= minCaptureScore, "Score below minimum");
        require(msg.value >= captureFee, "Insufficient fee");

        uint256 tokenId = h3ToToken[h3Index];

        if (tokenId == 0) {
            // Zone doesn't exist, mint new NFT
            tokenId = _mintNewZone(h3Index, baseScore, msg.sender);
        } else {
            // Zone exists, check if capture is valid
            _captureExistingZone(tokenId, baseScore, msg.sender);
        }

        // Refund excess payment
        if (msg.value > captureFee) {
            payable(msg.sender).transfer(msg.value - captureFee);
        }
    }

    function _mintNewZone(
        string calldata h3Index,
        uint256 baseScore,
        address capturer
    ) private returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _safeMint(capturer, tokenId);

        zones[tokenId] = ZoneInfo({
            h3Index: h3Index,
            lastCapturedAt: block.timestamp,
            captureScore: baseScore,
            originalCapturer: capturer,
            totalCaptures: 1
        });

        h3ToToken[h3Index] = tokenId;
        h3Exists[h3Index] = true;

        emit ZoneCaptured(
            tokenId,
            h3Index,
            capturer,
            baseScore,
            block.timestamp
        );

        return tokenId;
    }

    function _captureExistingZone(
        uint256 tokenId,
        uint256 baseScore,
        address newCapturer
    ) private {
        ZoneInfo storage zone = zones[tokenId];
        address currentOwner = ownerOf(tokenId);

        require(currentOwner != newCapturer, "Already own this zone");

        uint256 currentPower = computeCurrentPower(
            zone.captureScore,
            zone.lastCapturedAt
        );

        require(baseScore > currentPower, "Insufficient score to capture");

        // Store previous score for event
        uint256 previousScore = currentPower;

        // Transfer ownership
        _transfer(currentOwner, newCapturer, tokenId);

        // Update zone info
        zone.lastCapturedAt = block.timestamp;
        zone.captureScore = baseScore;
        zone.totalCaptures++;

        emit ZoneTransferred(
            tokenId,
            zone.h3Index,
            currentOwner,
            newCapturer,
            baseScore,
            previousScore
        );
    }

    function computeCurrentPower(
        uint256 originalScore,
        uint256 lastCapturedAt
    ) public view returns (uint256) {
        if (lastCapturedAt == 0 || originalScore == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp > lastCapturedAt
            ? block.timestamp - lastCapturedAt
            : 0;

        uint256 daysPassed = timeElapsed / SECONDS_PER_DAY;
        uint256 decay = daysPassed * DECAY_RATE;

        if (decay >= originalScore) {
            return 0;
        }

        return originalScore - decay;
    }

    function getZoneByH3(
        string calldata h3Index
    )
        external
        view
        returns (
            uint256 tokenId,
            address currentOwner,
            uint256 currentPower,
            uint256 originalScore,
            uint256 lastCapturedAt,
            address originalCapturer,
            uint256 totalCaptures
        )
    {
        tokenId = h3ToToken[h3Index];
        require(tokenId != 0, "Zone does not exist");

        ZoneInfo memory zone = zones[tokenId];
        currentOwner = ownerOf(tokenId);
        currentPower = computeCurrentPower(
            zone.captureScore,
            zone.lastCapturedAt
        );
        originalScore = zone.captureScore;
        lastCapturedAt = zone.lastCapturedAt;
        originalCapturer = zone.originalCapturer;
        totalCaptures = zone.totalCaptures;
    }

    function getOwnedZones(
        address owner
    ) external view returns (uint256[] memory tokenIds) {
        uint256 balance = balanceOf(owner);
        tokenIds = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
    }

    function canCaptureZone(
        string calldata h3Index,
        uint256 challengeScore
    )
        external
        view
        returns (bool canCapture, uint256 requiredScore, uint256 currentPower)
    {
        uint256 tokenId = h3ToToken[h3Index];

        if (tokenId == 0) {
            // Zone doesn't exist, can be captured if score meets minimum
            canCapture = challengeScore >= minCaptureScore;
            requiredScore = minCaptureScore;
            currentPower = 0;
        } else {
            ZoneInfo memory zone = zones[tokenId];
            currentPower = computeCurrentPower(
                zone.captureScore,
                zone.lastCapturedAt
            );
            requiredScore = currentPower + 1;
            canCapture = challengeScore > currentPower;
        }
    }

    function getContractStats()
        external
        view
        returns (uint256 totalZones, uint256 totalCaptures, uint256 totalFees)
    {
        totalZones = _nextTokenId - 1;

        // Calculate total captures across all zones
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_ownerOf(i) != address(0)) {
                totalCaptures += zones[i].totalCaptures;
            }
        }

        totalFees = address(this).balance;
    }

    function setMinCaptureScore(uint256 newMinScore) external onlyOwner {
        minCaptureScore = newMinScore;
    }

    function setCaptureFee(uint256 newFee) external onlyOwner {
        captureFee = newFee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    function emergencyWithdraw(
        address tokenContract,
        uint256 amount
    ) external onlyOwner {
        IERC20(tokenContract).transfer(owner(), amount);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        ZoneInfo memory zone = zones[tokenId];
        uint256 currentPower = computeCurrentPower(
            zone.captureScore,
            zone.lastCapturedAt
        );

        // In production, this would return proper JSON metadata
        // For demo, return a simple string
        return
            string(
                abi.encodePacked(
                    "FitConquer Zone ",
                    zone.h3Index,
                    " - Power: ",
                    Strings.toString(currentPower)
                )
            );
    }
}

// Additional interface for ERC20 tokens (for emergency withdraw)
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}
