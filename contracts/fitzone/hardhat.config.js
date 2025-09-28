require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-verify");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  zksolc: {
    version: "1.4.1",
    compilerSource: "binary",
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
  networks: {
    // Arbitrum Sepolia configuration
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      gasPrice: "auto",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Ethereum Sepolia for PYUSD
    sepolia: {
      url: "https://rpc.sepolia.org",
      chainId: 11155111,
      gasPrice: "auto", 
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    zkSyncSepoliaTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      zksync: true,
      chainId: 300,
      verifyURL:
        "https://explorer.sepolia.era.zksync.dev/contract_verification",
    },
    zkSyncMainnet: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: "mainnet",
      zksync: true,
      chainId: 324,
      verifyURL:
        "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
    },
  },
  paths: {
    artifacts: "./artifacts-zk",
    cache: "./cache-zk",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // PYUSD contract addresses for different networks
  pyusdAddresses: {
    sepolia: "0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D", // Replace with actual PYUSD contract address on Sepolia
    arbitrumSepolia: "0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D", // Replace with actual PYUSD contract address on Arbitrum Sepolia (if available)
  }
};
