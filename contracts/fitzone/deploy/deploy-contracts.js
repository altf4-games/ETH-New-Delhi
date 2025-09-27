const { Wallet, utils } = require("zksync-web3");
const { HardhatRuntimeEnvironment } = require("hardhat/types");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");

module.exports = async function (hre) {
  console.log(`Running deploy script for the FitStaking contract`);

  // Initialize the wallet
  const wallet = new Wallet("0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d06cd6c50f99a8ec5e6e0e9c");

  // Create deployer object and load the artifact of the contract you want to deploy
  const deployer = new Deployer(hre, wallet);
  
  // Deploy FitZone contract first
  const fitZoneArtifact = await deployer.loadArtifact("FitZone");
  const fitZone = await deployer.deploy(fitZoneArtifact, []);
  console.log(`FitZone contract deployed to ${fitZone.address}`);

  // Deploy FitStaking contract
  const fitStakingArtifact = await deployer.loadArtifact("FitStaking");
  const fitStaking = await deployer.deploy(fitStakingArtifact, []);
  console.log(`FitStaking contract deployed to ${fitStaking.address}`);

  console.log(`✅ Contracts deployed successfully!`);
  console.log(`FitZone: ${fitZone.address}`);
  console.log(`FitStaking: ${fitStaking.address}`);
};