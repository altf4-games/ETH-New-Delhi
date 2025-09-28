import { ethers } from 'ethers';
import Web3Service from './web3Service';
import type { NFTData, MarketplaceListing } from './web3Service';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

class NFTService {
  // Generate metadata for run NFT
  private generateNFTMetadata(
    distance: string, 
    duration: string, 
    zoneName: string, 
    pointsEarned: string,
    timestamp: Date
  ): NFTMetadata {
    const distanceKm = (parseInt(distance) / 1000).toFixed(2);
    const durationMinutes = Math.floor(parseInt(duration) / 60);
    const pace = parseInt(duration) > 0 ? 
      ((parseInt(duration) / 60) / (parseInt(distance) / 1000)).toFixed(2) : 
      '0.00';

    return {
      name: `${zoneName} Run - ${distanceKm}km`,
      description: `A fitness run NFT minted for completing a ${distanceKm}km run in ${zoneName}. Duration: ${durationMinutes} minutes. Points earned: ${pointsEarned}.`,
      image: this.generateRunVisualization(distance, duration, zoneName),
      attributes: [
        {
          trait_type: "Distance (km)",
          value: parseFloat(distanceKm)
        },
        {
          trait_type: "Duration (minutes)",
          value: durationMinutes
        },
        {
          trait_type: "Zone",
          value: zoneName
        },
        {
          trait_type: "Points Earned",
          value: parseInt(pointsEarned)
        },
        {
          trait_type: "Average Pace (min/km)",
          value: parseFloat(pace)
        },
        {
          trait_type: "Date",
          value: timestamp.toISOString().split('T')[0]
        },
        {
          trait_type: "Month",
          value: timestamp.toLocaleString('default', { month: 'long' })
        },
        {
          trait_type: "Year",
          value: timestamp.getFullYear()
        }
      ]
    };
  }

  // Generate a simple SVG visualization for the run
  private generateRunVisualization(distance: string, duration: string, zoneName: string): string {
    const distanceKm = (parseInt(distance) / 1000).toFixed(1);
    const durationMinutes = Math.floor(parseInt(duration) / 60);
    
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
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // Upload metadata to IPFS or return data URL (simplified version)
  private async uploadMetadata(metadata: NFTMetadata): Promise<string> {
    // For now, return a data URL with JSON
    // In production, you would upload to IPFS
    const metadataJson = JSON.stringify(metadata);
    return `data:application/json;base64,${btoa(metadataJson)}`;
  }

  // Mint NFT after run completion (called by backend/service worker)
  async mintRunNFT(
    runnerAddress: string,
    distance: string,
    duration: string,
    zoneName: string,
    zoneCoordinates: string,
    pointsEarned: string
  ): Promise<string | null> {
    try {
      // Generate metadata
      const metadata = this.generateNFTMetadata(
        distance, 
        duration, 
        zoneName, 
        pointsEarned, 
        new Date()
      );
      
      // Upload metadata (simplified - returns data URL)
      const metadataURI = await this.uploadMetadata(metadata);
      
      // Note: This would typically be called by a backend service with owner privileges
      // The runnerAddress and zoneCoordinates would be used for the actual minting
      console.log('NFT would be minted for runner:', runnerAddress);
      console.log('Zone coordinates:', zoneCoordinates);
      console.log('NFT metadata:', metadata);
      console.log('Metadata URI:', metadataURI);
      
      return metadataURI;
    } catch (error) {
      console.error('Error minting NFT:', error);
      return null;
    }
  }

  // Mint NFT directly with MetaMask (bypasses Web3Service initialization)
  async mintNFTWithMetaMask(
    distance: string, 
    duration: string, 
    zoneName: string, 
    zoneCoordinates: string, 
    pointsEarned: string
  ): Promise<string | null> {
    try {
      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found');
      }

      const metadata = this.generateNFTMetadata(
        distance, 
        duration, 
        zoneName, 
        pointsEarned, 
        new Date()
      );
      
      // Upload metadata
      const metadataURI = await this.uploadMetadata(metadata);
      
      // Direct MetaMask interaction
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Contract ABI for mintRunNFT function
      const mintABI = [
        "function mintRunNFT(address runner, uint256 distance, uint256 duration, string memory zoneName, string memory zoneCoordinates, uint256 pointsEarned, string memory metadataURI) external returns (uint256)"
      ];
      
      // Create contract instance
      const contract = new ethers.Contract(
        "0x6B219A0fD37A89D52Df66cbD9Ef59B1A56E88e49", // NFT contract address
        mintABI,
        signer
      );
      
      // Call mintRunNFT function
      const tx = await contract.mintRunNFT(
        userAddress, // runner (user mints for themselves)
        distance,
        duration,
        zoneName,
        zoneCoordinates,
        pointsEarned,
        metadataURI
      );
      
      const receipt = await tx.wait();
      
      // Extract token ID from events
      let tokenId: string | null = null;
      
      // Method 1: Look for NFTMinted event
      const mintEvent = receipt.events?.find((event: any) => event.event === 'NFTMinted');
      if (mintEvent?.args?.tokenId) {
        tokenId = mintEvent.args.tokenId.toString();
      }
      
      // Method 2: Look for Transfer event (ERC721 standard)
      if (!tokenId) {
        const transferEvent = receipt.events?.find((event: any) => 
          event.event === 'Transfer' && event.args?.from === ethers.constants.AddressZero
        );
        if (transferEvent?.args?.tokenId) {
          tokenId = transferEvent.args.tokenId.toString();
        }
      }
      
      // Method 3: Parse logs manually
      if (!tokenId && receipt.logs) {
        try {
          const iface = new ethers.utils.Interface([
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
            "event NFTMinted(uint256 indexed tokenId, address indexed runner, uint256 distance, uint256 duration, string zoneName, uint256 pointsEarned)"
          ]);
          
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog(log);
              if (parsed.name === 'NFTMinted' || (parsed.name === 'Transfer' && parsed.args.from === ethers.constants.AddressZero)) {
                tokenId = parsed.args.tokenId.toString();
                break;
              }
            } catch (e) {
              // Log might not be from our contract, continue
            }
          }
        } catch (error) {
          console.warn('Error parsing logs:', error);
        }
      }
      
      // Fallback: Query the contract for total supply (latest token ID)
      if (!tokenId) {
        try {
          const totalSupplyABI = ["function totalSupply() external view returns (uint256)"];
          const readOnlyContract = new ethers.Contract(
            "0x6B219A0fD37A89D52Df66cbD9Ef59B1A56E88e49",
            totalSupplyABI,
            provider
          );
          const totalSupply = await readOnlyContract.totalSupply();
          tokenId = totalSupply.toString();
        } catch (error) {
          console.warn('Could not get totalSupply:', error);
        }
      }
      
      return tokenId;
    } catch (error) {
      console.error('Error minting NFT with MetaMask:', error);
      throw error;
    }
  }

  // Mint NFT directly by user
  async mintNFTForUser(
    distance: string,
    duration: string,
    zoneName: string,
    zoneCoordinates: string,
    pointsEarned: string
  ): Promise<string | null> {
    // Use direct MetaMask minting instead of Web3Service
    return await this.mintNFTWithMetaMask(distance, duration, zoneName, zoneCoordinates, pointsEarned);
  }

  // Get user's NFT collection directly with MetaMask
  async getUserNFTsWithMetaMask(): Promise<NFTData[]> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Contract ABI for getting user NFTs
      const nftABI = [
        "function getUserNFTs(address user) external view returns (uint256[] memory)",
        "function tokenURI(uint256 tokenId) external view returns (string memory)",
        "function getRunData(uint256 tokenId) external view returns (tuple(address runner, uint256 distance, uint256 duration, uint256 timestamp, string zoneName, string zoneCoordinates, uint256 pointsEarned, uint256 averageSpeed))"
      ];
      
      const contract = new ethers.Contract(
        "0x6B219A0fD37A89D52Df66cbD9Ef59B1A56E88e49",
        nftABI,
        provider
      );
      
      // Get user's NFT token IDs
      const tokenIds = await contract.getUserNFTs(userAddress);
      const nfts: NFTData[] = [];
      
      if (tokenIds.length === 0) {
        return nfts;
      }
      
      // Get each NFT data
      for (let i = 0; i < tokenIds.length; i++) {
        try {
          const tokenId = tokenIds[i];
          const tokenURI = await contract.tokenURI(tokenId);
          const runData = await contract.getRunData(tokenId);
          
          const nft: NFTData = {
            tokenId: tokenId.toString(),
            owner: userAddress,
            metadataURI: tokenURI,
            isListed: false, // We'll check this separately if needed
            runData: {
              runner: runData.runner,
              distance: runData.distance.toString(),
              duration: runData.duration.toString(),
              timestamp: new Date(runData.timestamp.toNumber() * 1000), // Convert from blockchain timestamp
              zoneName: runData.zoneName,
              zoneCoordinates: runData.zoneCoordinates,
              pointsEarned: runData.pointsEarned.toString(),
              averageSpeed: runData.averageSpeed.toString()
            }
          };
          
          nfts.push(nft);
        } catch (error) {
          // Skip NFTs that can't be fetched
        }
      }
      
      return nfts;
    } catch (error) {
      console.error('Error getting user NFTs with MetaMask:', error);
      throw error;
    }
  }

  // Get user's latest NFT (most recently minted)
  async getUserLatestNFT(): Promise<NFTData | null> {
    try {
      const userNFTs = await this.getUserNFTsWithMetaMask();
      if (userNFTs.length === 0) return null;
      
      // Sort by timestamp and return the latest
      const sortedNFTs = userNFTs.sort((a, b) => 
        new Date(b.runData.timestamp).getTime() - new Date(a.runData.timestamp).getTime()
      );
      
      return sortedNFTs[0];
    } catch (error) {
      console.error('Error getting latest NFT:', error);
      return null;
    }
  }

  // Get user's NFT collection
  async getUserNFTs(): Promise<NFTData[]> {
    // Use direct MetaMask approach instead of Web3Service
    return await this.getUserNFTsWithMetaMask();
  }

  // Get marketplace listings
  async getMarketplaceNFTs(): Promise<MarketplaceListing[]> {
    return await Web3Service.getMarketplaceNFTs();
  }

  // List NFT for sale
  async listNFT(tokenId: string, price: string): Promise<boolean> {
    return await Web3Service.listNFT(tokenId, price);
  }

  // Buy NFT from marketplace
  async buyNFT(tokenId: string, price: string): Promise<boolean> {
    return await Web3Service.buyNFT(tokenId, price);
  }

  // Cancel NFT listing
  async cancelListing(tokenId: string): Promise<boolean> {
    return await Web3Service.cancelListing(tokenId);
  }

  // Update listing price
  async updatePrice(tokenId: string, newPrice: string): Promise<boolean> {
    return await Web3Service.updatePrice(tokenId, newPrice);
  }

  // Parse metadata from URI
  async parseMetadata(metadataURI: string): Promise<NFTMetadata | null> {
    try {
      if (metadataURI.startsWith('data:application/json;base64,')) {
        const base64 = metadataURI.split(',')[1];
        const json = atob(base64);
        return JSON.parse(json);
      }
      
      // If it's a regular URL, fetch it
      const response = await fetch(metadataURI);
      return await response.json();
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return null;
    }
  }

  // Format run data for display
  formatRunData(runData: any) {
    const distanceKm = (parseInt(runData.distance) / 1000).toFixed(2);
    const durationMinutes = Math.floor(parseInt(runData.duration) / 60);
    const durationSeconds = parseInt(runData.duration) % 60;
    const pace = parseInt(runData.duration) > 0 ? 
      ((parseInt(runData.duration) / 60) / (parseInt(runData.distance) / 1000)).toFixed(2) : 
      '0.00';
    
    return {
      distance: `${distanceKm} km`,
      duration: `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`,
      pace: `${pace} min/km`,
      zone: runData.zoneName,
      points: runData.pointsEarned,
      date: runData.timestamp.toLocaleDateString(),
      averageSpeed: `${(parseInt(runData.averageSpeed) / 1000).toFixed(2)} km/h`
    };
  }

  // Calculate NFT rarity score based on attributes
  calculateRarityScore(runData: any): number {
    let score = 0;
    
    const distance = parseInt(runData.distance);
    const duration = parseInt(runData.duration);
    const points = parseInt(runData.pointsEarned);
    
    // Distance bonus
    if (distance >= 10000) score += 30; // 10km+
    else if (distance >= 5000) score += 20; // 5km+
    else if (distance >= 2000) score += 10; // 2km+
    
    // Speed bonus (faster runs are rarer)
    const pace = duration > 0 ? (duration / 60) / (distance / 1000) : 0;
    if (pace > 0 && pace <= 4) score += 40; // Sub 4 min/km
    else if (pace <= 5) score += 30; // Sub 5 min/km
    else if (pace <= 6) score += 20; // Sub 6 min/km
    
    // Points bonus
    if (points >= 1000) score += 25;
    else if (points >= 500) score += 15;
    else if (points >= 200) score += 10;
    
    return score;
  }
}

export default new NFTService();