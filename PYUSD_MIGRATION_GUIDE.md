# PYUSD Migration Guide

## Overview
This guide covers the migration from ETH-based contracts to PYUSD-based smart contracts on Arbitrum Sepolia and Ethereum Sepolia testnets.

## Prerequisites

1. **MetaMask or compatible wallet** with test funds
2. **Node.js and npm** installed
3. **PYUSD tokens** on Ethereum Sepolia testnet
4. **Test ETH** on both Arbitrum Sepolia and Ethereum Sepolia for gas fees

## Contract Changes Summary

### Smart Contracts Updated
- **FitZone.sol**: Now requires PYUSD for zone capture fees instead of ETH
- **FitStaking.sol**: Uses PYUSD for staking instead of ETH  
- **FitNFT.sol**: NFT marketplace transactions use PYUSD instead of ETH

### Key Changes Made:
1. Added `IERC20` and `SafeERC20` imports for token handling
2. Constructor now requires PYUSD token address
3. All `payable` functions converted to use PYUSD transfers
4. Fee amounts adjusted for PYUSD's 6-decimal precision
5. Withdrawal functions updated to transfer PYUSD tokens

## Deployment Instructions

### 1. Environment Setup

Create a `.env` file in `contracts/fitzone/`:

```bash
# Copy from .env.example
cp .env.example .env

# Edit with your values:
PRIVATE_KEY=your_private_key_here
PYUSD_SEPOLIA=0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D
PYUSD_ARBITRUM_SEPOLIA=0x9A7b2c3c853b6c1D2A8F3eF3F3F6b6c8FB2e4A7D
VERIFY_CONTRACTS=true
```

### 2. Install Dependencies

```bash
cd contracts/fitzone
npm install @nomiclabs/hardhat-ethers @openzeppelin/hardhat-upgrades
```

### 3. Deploy to Arbitrum Sepolia

```bash
# Deploy contracts to Arbitrum Sepolia
npx hardhat run deploy/deploy-pyusd-contracts.js --network arbitrumSepolia
```

### 4. Update Frontend Configuration

Update contract addresses in `frontend/src/services/web3Service.ts`:

```typescript
export const CONTRACTS = {
  FITZONE: "YOUR_DEPLOYED_FITZONE_ADDRESS",
  FITSTAKING: "YOUR_DEPLOYED_FITSTAKING_ADDRESS", 
  FITNFT: "YOUR_DEPLOYED_FITNFT_ADDRESS",
};
```

### 5. Update PYUSD Addresses

Replace placeholder PYUSD addresses with actual testnet addresses:

**Frontend (`web3Service.ts`)**:
```typescript
export const NETWORKS = {
  ARBITRUM_SEPOLIA: {
    // ...
    pyusdAddress: "ACTUAL_PYUSD_ADDRESS_ON_ARBITRUM_SEPOLIA",
  },
};
```

**Backend (`blockchainAdaptor.js` & `paymentAgent.js`)**:
```javascript
const PYUSD_CONFIG = {
  arbitrumSepolia: {
    address: "ACTUAL_PYUSD_ADDRESS_ON_ARBITRUM_SEPOLIA",
    decimals: 6
  }
};
```

## Testing Guide

### 1. Get Test Tokens

1. **Get ETH for gas fees**:
   - [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
   - [Ethereum Sepolia Faucet](https://sepoliafaucet.com/)

2. **Get PYUSD tokens**:
   - Check PayPal's developer documentation for PYUSD testnet faucet
   - Or deploy a mock PYUSD token for testing

### 2. Test Contract Functionality

#### Zone Claiming Test
```javascript
// 1. Approve PYUSD spending
await pyusdContract.approve(fitZoneAddress, ethers.parseUnits("1", 6));

// 2. Claim zone
await fitZoneContract.claimZone("h3_index_here", 100);
```

#### Fitness Run Staking Test
```javascript
// 1. Approve PYUSD for staking
await pyusdContract.approve(fitStakingAddress, ethers.parseUnits("5", 6));

// 2. Start run with stake
await fitStakingContract.startRun(5000, 3600, ethers.parseUnits("5", 6));
```

#### NFT Purchase Test  
```javascript
// 1. Approve PYUSD for NFT purchase
await pyusdContract.approve(fitNFTAddress, ethers.parseUnits("10", 6));

// 2. Buy NFT
await fitNFTContract.buyNFT(tokenId, ethers.parseUnits("10", 6));
```

### 3. Frontend Testing

1. **Connect Wallet**: Ensure MetaMask connects to Arbitrum Sepolia
2. **Check Balances**: Verify PYUSD balance displays correctly
3. **Approval Flow**: Test that PYUSD approval requests work
4. **Transactions**: Test all major functions (zone claims, run staking, NFT trades)

### 4. Backend Testing

Test the updated services:

```bash
# Test blockchain adaptor
node -e "
import { getPyusdBalance } from './services/blockchainAdaptor.js';
console.log(await getPyusdBalance('YOUR_TEST_ADDRESS'));
"

# Test payment agent  
node -e "
import { distributeReward } from './services/paymentAgent.js';
await distributeReward({
  type: 'run_completion',
  recipientId: 'user123', 
  amount: '5',
  network: 'arbitrumSepolia'
});
"
```

## Migration Checklist

- [ ] Deploy contracts with PYUSD token addresses
- [ ] Update frontend contract addresses and PYUSD addresses
- [ ] Update backend service configurations
- [ ] Test PYUSD approval flows
- [ ] Test zone claiming with PYUSD
- [ ] Test fitness run staking with PYUSD
- [ ] Test NFT marketplace with PYUSD
- [ ] Verify all withdrawal functions work
- [ ] Test cross-chain functionality (if applicable)
- [ ] Update documentation and user guides

## Troubleshooting

### Common Issues:

1. **"Insufficient allowance" errors**
   - Ensure PYUSD approval is done before contract interactions
   - Check that approval amount covers the required transaction amount

2. **"Transaction reverted" errors**
   - Verify PYUSD contract address is correct
   - Ensure user has sufficient PYUSD balance
   - Check that contracts are deployed with correct PYUSD address

3. **Gas estimation failures**
   - PYUSD transactions may require higher gas limits
   - Set explicit gas limits in frontend calls

4. **Network issues**
   - Ensure wallet is connected to correct network (Arbitrum Sepolia)
   - Verify RPC endpoints are working

### Getting Help

- Check contract events and logs for detailed error information
- Use Arbitrum Sepolia block explorer to verify transactions
- Test with small amounts first before large transactions

## Production Considerations

1. **Real PYUSD Addresses**: Replace all placeholder addresses with actual PYUSD contract addresses
2. **Security Audits**: Have contracts audited before mainnet deployment
3. **Gas Optimization**: Review and optimize gas usage for PYUSD transfers
4. **User Experience**: Implement proper loading states for approval + transaction flows
5. **Error Handling**: Add comprehensive error handling for failed approvals or transactions