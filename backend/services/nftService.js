import { ethers } from "ethers";

// Contract configuration
const CONTRACTS = {
  FITNFT:
    process.env.FITNFT_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000",
  PRIVATE_KEY: process.env.NFT_MINTER_PRIVATE_KEY,
  RPC_URL: process.env.RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
};

const FITNFT_ABI = [
  "function mintRunNFT(address runner, uint256 distance, uint256 duration, string memory zoneName, string memory zoneCoordinates, uint256 pointsEarned, string memory metadataURI) external returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() external view returns (uint256)",
  "event NFTMinted(uint256 indexed tokenId, address indexed runner, uint256 distance, uint256 duration, string zoneName, uint256 pointsEarned)",
];

class NFTService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.wallet = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize provider
      this.provider = new ethers.providers.JsonRpcProvider(CONTRACTS.RPC_URL);

      // Initialize wallet (only if private key is available)
      if (CONTRACTS.PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(CONTRACTS.PRIVATE_KEY, this.provider);
        this.contract = new ethers.Contract(
          CONTRACTS.FITNFT,
          FITNFT_ABI,
          this.wallet
        );
      } else {
        console.warn(
          "NFT_MINTER_PRIVATE_KEY not set, NFT minting will be disabled"
        );
        return;
      }

      this.initialized = true;
      console.log("NFT Service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize NFT Service:", error);
      throw error;
    }
  }

  async mintNFTForRun({
    runner,
    distance,
    duration,
    zoneName,
    zoneCoordinates,
    pointsEarned,
    timestamp,
  }) {
    try {
      await this.initialize();

      if (!this.contract) {
        throw new Error("NFT Service not properly initialized");
      }

      // Generate metadata for the NFT
      const metadata = this.generateRunMetadata({
        distance,
        duration,
        zoneName,
        pointsEarned,
        timestamp,
      });

      // Upload metadata (in production, upload to IPFS)
      const metadataURI = await this.uploadMetadata(metadata);

      console.log("Minting NFT for run:", {
        runner,
        distance,
        duration,
        zoneName,
        pointsEarned,
        metadataURI,
      });

      // Mint the NFT
      const tx = await this.contract.mintRunNFT(
        runner,
        distance,
        duration,
        zoneName,
        zoneCoordinates,
        pointsEarned,
        metadataURI
      );

      const receipt = await tx.wait();

      // Extract token ID from the mint event
      const mintEvent = receipt.events?.find((e) => e.event === "NFTMinted");
      const tokenId = mintEvent ? mintEvent.args.tokenId.toString() : null;

      console.log("NFT minted successfully:", {
        tokenId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      });

      return {
        success: true,
        tokenId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("Error minting NFT:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  generateRunMetadata({
    distance,
    duration,
    zoneName,
    pointsEarned,
    timestamp,
  }) {
    const distanceKm = (distance / 1000).toFixed(2);
    const durationMinutes = Math.floor(duration / 60);
    const durationSeconds = duration % 60;
    const pace =
      duration > 0 ? (duration / 60 / (distance / 1000)).toFixed(2) : "0.00";

    const runDate = new Date(timestamp);

    return {
      name: `${zoneName} Run - ${distanceKm}km`,
      description: `A fitness run NFT minted for completing a ${distanceKm}km run in ${zoneName}. Duration: ${durationMinutes}:${durationSeconds
        .toString()
        .padStart(2, "0")}. Points earned: ${pointsEarned}.`,
      image: this.generateRunVisualization(distance, duration, zoneName),
      attributes: [
        {
          trait_type: "Distance (km)",
          value: parseFloat(distanceKm),
        },
        {
          trait_type: "Duration (minutes)",
          value: durationMinutes,
        },
        {
          trait_type: "Zone",
          value: zoneName,
        },
        {
          trait_type: "Points Earned",
          value: pointsEarned,
        },
        {
          trait_type: "Average Pace (min/km)",
          value: parseFloat(pace),
        },
        {
          trait_type: "Date",
          value: runDate.toISOString().split("T")[0],
        },
        {
          trait_type: "Month",
          value: runDate.toLocaleString("default", { month: "long" }),
        },
        {
          trait_type: "Year",
          value: runDate.getFullYear(),
        },
        {
          trait_type: "Rarity",
          value: this.calculateRarity(distance, duration, pointsEarned),
        },
      ],
    };
  }

  generateRunVisualization(distance, duration, zoneName) {
    const distanceKm = (distance / 1000).toFixed(1);
    const durationMinutes = Math.floor(duration / 60);

    // Create SVG data URL
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <rect width="400" height="400" fill="url(#bg)"/>
        
        <circle cx="200" cy="150" r="60" fill="none" stroke="white" stroke-width="4"/>
        <path d="M 170 130 Q 200 110 230 130 Q 200 150 170 130" fill="white"/>
        <circle cx="185" cy="140" r="3" fill="#667eea"/>
        <circle cx="215" cy="140" r="3" fill="#667eea"/>
        
        <text x="200" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">
          ${distanceKm} KM
        </text>
        
        <text x="200" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white" opacity="0.9">
          ${durationMinutes} minutes
        </text>
        
        <text x="200" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.8">
          ${zoneName}
        </text>
        
        <text x="200" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white" opacity="0.7">
          FitZone Run NFT
        </text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }

  async uploadMetadata(metadata) {
    // In production, upload to IPFS
    // For now, return a data URL
    const metadataJson = JSON.stringify(metadata);
    return `data:application/json;base64,${Buffer.from(metadataJson).toString(
      "base64"
    )}`;
  }

  calculateRarity(distance, duration, pointsEarned) {
    let rarity = "Common";

    if (distance >= 10000 && pointsEarned >= 100) {
      rarity = "Legendary";
    } else if (distance >= 5000 && pointsEarned >= 50) {
      rarity = "Epic";
    } else if (distance >= 2000 && pointsEarned >= 25) {
      rarity = "Rare";
    } else if (distance >= 1000 || pointsEarned >= 10) {
      rarity = "Uncommon";
    }

    return rarity;
  }

  async getNFTInfo(tokenId) {
    try {
      await this.initialize();

      if (!this.contract) {
        throw new Error("NFT Service not initialized");
      }

      const [owner, tokenURI] = await Promise.all([
        this.contract.ownerOf(tokenId),
        this.contract.tokenURI(tokenId),
      ]);

      return {
        tokenId,
        owner,
        tokenURI,
      };
    } catch (error) {
      console.error("Error getting NFT info:", error);
      throw error;
    }
  }

  async getTotalSupply() {
    try {
      await this.initialize();

      if (!this.contract) {
        return 0;
      }

      const supply = await this.contract.totalSupply();
      return supply.toNumber();
    } catch (error) {
      console.error("Error getting total supply:", error);
      return 0;
    }
  }
}

// Export singleton instance
const nftService = new NFTService();
export { nftService as NFTService };

// Export the mint function for direct use
export async function mintNFTForRun(runData) {
  return await nftService.mintNFTForRun(runData);
}
