const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying FitNFT contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const FitNFT = await ethers.getContractFactory("FitNFT");
  const fitNFT = await FitNFT.deploy();
  
  await fitNFT.deployed();

  console.log("FitNFT deployed to:", fitNFT.address);

  // Log some information about the deployment
  console.log("Transaction hash:", fitNFT.deployTransaction.hash);
  console.log("Gas used:", fitNFT.deployTransaction.gasLimit.toString());

  // Verify we can call functions
  const totalSupply = await fitNFT.totalSupply();
  console.log("Initial total supply:", totalSupply.toString());

  console.log("\n=== Deployment Complete ===");
  console.log(`Contract Address: ${fitNFT.address}`);
  console.log("Update the following files with this address:");
  console.log("1. frontend/src/services/web3Service.ts - FITNFT contract address");
  console.log("2. backend/services/nftService.js - FITNFT_CONTRACT_ADDRESS env variable");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });