const { ethers } = require("hardhat");

// PYUSD contract addresses on different networks
const PYUSD_ADDRESSES = {
  // Ethereum Sepolia
  sepolia: "0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D", // Replace with actual PYUSD contract address
  // Arbitrum Sepolia 
  arbitrumSepolia: "0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D", // Replace with actual PYUSD contract address (if available)
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get PYUSD address for current network
  let pyusdAddress;
  if (network.chainId === 11155111) { // Sepolia
    pyusdAddress = PYUSD_ADDRESSES.sepolia;
  } else if (network.chainId === 421614) { // Arbitrum Sepolia  
    pyusdAddress = PYUSD_ADDRESSES.arbitrumSepolia;
  } else {
    throw new Error(`Unsupported network: ${network.name} (${network.chainId})`);
  }

  console.log("Using PYUSD token address:", pyusdAddress);

  // Deploy FitZone contract
  console.log("\nDeploying FitZone...");
  const FitZone = await ethers.getContractFactory("FitZone");
  const fitZone = await FitZone.deploy(pyusdAddress);
  await fitZone.deployed();
  console.log("FitZone deployed to:", fitZone.address);

  // Deploy FitStaking contract
  console.log("\nDeploying FitStaking...");
  const FitStaking = await ethers.getContractFactory("FitStaking");
  const fitStaking = await FitStaking.deploy(pyusdAddress);
  await fitStaking.deployed();
  console.log("FitStaking deployed to:", fitStaking.address);

  // Deploy FitNFT contract
  console.log("\nDeploying FitNFT...");
  const FitNFT = await ethers.getContractFactory("FitNFT");
  const fitNFT = await FitNFT.deploy(pyusdAddress);
  await fitNFT.deployed();
  console.log("FitNFT deployed to:", fitNFT.address);

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    pyusdToken: pyusdAddress,
    contracts: {
      FitZone: fitZone.address,
      FitStaking: fitStaking.address,
      FitNFT: fitNFT.address,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contracts on Etherscan/Arbiscan (optional)
  if (process.env.VERIFY_CONTRACTS === "true") {
    console.log("\n=== VERIFYING CONTRACTS ===");
    
    try {
      await hre.run("verify:verify", {
        address: fitZone.address,
        constructorArguments: [pyusdAddress],
      });
      console.log("FitZone verified");
    } catch (error) {
      console.log("FitZone verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: fitStaking.address,
        constructorArguments: [pyusdAddress],
      });
      console.log("FitStaking verified");
    } catch (error) {
      console.log("FitStaking verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: fitNFT.address,
        constructorArguments: [pyusdAddress],
      });
      console.log("FitNFT verified");
    } catch (error) {
      console.log("FitNFT verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });