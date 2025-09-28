// Simple utility to check NFTs for a user
// You can run this in the browser console

const checkUserNFTs = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask not found');
      return;
    }

    // Connect to MetaMask
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    console.log('Checking NFTs for address:', userAddress);
    console.log('On network:', await provider.getNetwork());

    // NFT Contract ABI (minimal)
    const nftABI = [
      "function balanceOf(address owner) external view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
      "function tokenURI(uint256 tokenId) external view returns (string memory)",
      "function getRunData(uint256 tokenId) external view returns (tuple(address runner, uint256 distance, uint256 duration, uint256 timestamp, string zoneName, string zoneCoordinates, uint256 pointsEarned, uint256 averageSpeed))"
    ];
    
    const contract = new ethers.Contract(
      "0x6B219A0fD37A89D52Df66cbD9Ef59B1A56E88e49",
      nftABI,
      provider
    );

    // Check balance
    const balance = await contract.balanceOf(userAddress);
    console.log(`You own ${balance.toString()} NFTs`);

    if (balance.toNumber() > 0) {
      console.log('\n=== YOUR NFTs ===');
      
      for (let i = 0; i < balance.toNumber(); i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          const runData = await contract.getRunData(tokenId);
          const tokenURI = await contract.tokenURI(tokenId);
          
          console.log(`\n--- NFT #${tokenId.toString()} ---`);
          console.log('Token ID:', tokenId.toString());
          console.log('Distance:', runData.distance.toString(), 'meters');
          console.log('Duration:', runData.duration.toString(), 'seconds');
          console.log('Zone:', runData.zoneName);
          console.log('Points Earned:', runData.pointsEarned.toString());
          console.log('Metadata URI:', tokenURI);
          console.log('\n📱 To add to MetaMask:');
          console.log('Contract Address: 0x6B219A0fD37A89D52Df66cbD9Ef59B1A56E88e49');
          console.log('Token ID:', tokenId.toString());
          
        } catch (error) {
          console.error(`Error fetching NFT ${i}:`, error);
        }
      }
    } else {
      console.log('No NFTs found. Make sure you are on Arbitrum Sepolia network.');
    }

  } catch (error) {
    console.error('Error checking NFTs:', error);
  }
};

// Instructions
console.log('=== NFT Checker Utility ===');
console.log('1. Make sure you are on Arbitrum Sepolia network in MetaMask');
console.log('2. Make sure ethers.js is loaded');
console.log('3. Run: checkUserNFTs()');
console.log('');

// Export for use
window.checkUserNFTs = checkUserNFTs;