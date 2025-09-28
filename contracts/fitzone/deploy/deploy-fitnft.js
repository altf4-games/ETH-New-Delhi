const hre = require("hardhat");

async function main() {
  console.log("Deploying FitNFT contract...");

  // Deploy the FitNFT contract
  const FitNFT = await hre.ethers.getContractFactory("FitNFT");
  const fitNFT = await FitNFT.deploy();

  await fitNFT.deployed();

  console.log("FitNFT contract deployed to:", fitNFT.address);

  // Verify the contract on Etherscan (if not on localhost)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await fitNFT.deployTransaction.wait(6);
    
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: fitNFT.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: fitNFT.address,
    blockNumber: fitNFT.deployTransaction.blockNumber,
    transactionHash: fitNFT.deployTransaction.hash,
    deployedAt: new Date().toISOString()
  };

  console.log("Deployment Info:", deploymentInfo);
  
  // You can save this to a file if needed
  const fs = require('fs');
  fs.writeFileSync(
    './deployments/fitnft-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("✅ FitNFT deployment completed!");
  console.log(`📝 Contract address: ${fitNFT.address}`);
  console.log("📁 Deployment info saved to ./deployments/fitnft-deployment.json");
  
  // Update the frontend contract address
  console.log("\n🔧 Don't forget to update the contract address in:");
  console.log("   frontend/src/services/web3Service.ts");
  console.log(`   FITNFT: "${fitNFT.address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });