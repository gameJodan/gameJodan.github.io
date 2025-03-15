// Test script for IDO Contract
// This script demonstrates how to interact with the IDO contract using web3.js

const Web3 = require('web3');
const web3 = new Web3('https://bsc-dataseed.binance.org/'); // BSC Mainnet
// For testnet: 'https://data-seed-prebsc-1-s1.binance.org:8545/'

// Contract ABIs (simplified for demonstration)
const idoABI = [
  // Constructor and view functions
  {"inputs":[{"internalType":"address","name":"_usdtAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserInfo","outputs":[{"internalType":"uint256","name":"purchasedShares","type":"uint256"},{"internalType":"uint256","name":"remainingShares","type":"uint256"},{"internalType":"uint256","name":"referralCount","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getIDOInfo","outputs":[{"internalType":"uint256","name":"soldSharesCount","type":"uint256"},{"internalType":"uint256","name":"remainingSharesCount","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"shareValue","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  
  // State-changing functions
  {"inputs":[{"internalType":"address","name":"_mmfAddress","type":"address"}],"name":"setMMFAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"referrer","type":"address"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"withdrawUSDT","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_shareValue","type":"uint256"}],"name":"setShareValue","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_tokensPerShare","type":"uint256"}],"name":"setTokensPerShare","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_totalShares","type":"uint256"}],"name":"setTotalShares","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

const erc20ABI = [
  {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// Contract addresses (replace with actual addresses after deployment)
const idoAddress = '0xF8AA39a05Fd6213f08d911F2784a0e54136cd56D';
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
const mmfAddress = '0xFd5a1171628b84bCE15dA7830b0D6337317A5726';

// Initialize contracts
const idoContract = new web3.eth.Contract(idoABI, idoAddress);
const usdtContract = new web3.eth.Contract(erc20ABI, usdtAddress);
const mmfContract = new web3.eth.Contract(erc20ABI, mmfAddress);

// Account setup (replace with your account)
const account = {
  address: '0x...', // Your wallet address
  privateKey: '0x...', // Your private key (keep this secure!)
};

// Set up account
web3.eth.accounts.wallet.add(account.privateKey);

// Example functions

// 1. Check IDO status
async function checkIDOStatus() {
  try {
    const idoInfo = await idoContract.methods.getIDOInfo().call();
    console.log('IDO Status:');
    console.log('- Sold Shares:', idoInfo.soldSharesCount);
    console.log('- Remaining Shares:', idoInfo.remainingSharesCount);
    
    // Check user info
    const userInfo = await idoContract.methods.getUserInfo(account.address).call();
    console.log('\nUser Status:');
    console.log('- Purchased Shares:', userInfo.purchasedShares);
    console.log('- Remaining Shares:', userInfo.remainingShares);
    console.log('- Referral Count:', userInfo.referralCount);
    
    // Check balances
    const usdtBalance = await usdtContract.methods.balanceOf(account.address).call();
    const usdtDecimals = await usdtContract.methods.decimals().call();
    const mmfBalance = await mmfContract.methods.balanceOf(account.address).call();
    const mmfDecimals = await mmfContract.methods.decimals().call();
    
    console.log('\nBalances:');
    console.log('- USDT:', web3.utils.fromWei(usdtBalance, 'ether'), 'USDT');
    console.log('- MMF:', mmfBalance / (10 ** mmfDecimals), 'MMF');
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

// Check USDT allowance
async function checkUSDTAllowance() {
  try {
    const allowance = await usdtContract.methods.allowance(account.address, idoAddress).call();
    const usdtDecimals = await usdtContract.methods.decimals().call();
    const allowanceInUSDT = web3.utils.fromWei(allowance, 'ether');
    
    console.log('USDT Allowance:');
    console.log('- Amount:', allowanceInUSDT, 'USDT');
    
    return allowance;
  } catch (error) {
    console.error('Error checking USDT allowance:', error);
    return '0';
  }
}

// 计算购买指定份数需要的USDT数量
async function calculateRequiredUSDT(shares) {
  try {
    const shareValue = await idoContract.methods.shareValue().call();
    const requiredAmount = web3.utils.toBN(shares).mul(web3.utils.toBN(shareValue));
    const requiredAmountInUSDT = web3.utils.fromWei(requiredAmount, 'ether');
    
    console.log(`Required USDT for ${shares} shares: ${requiredAmountInUSDT} USDT`);
    
    return requiredAmount;
  } catch (error) {
    console.error('Error calculating required USDT:', error);
    return web3.utils.toBN(0);
  }
}

// 2. Approve USDT spending for specific shares
async function approveUSDTForShares(shares) {
  try {
    // 计算需要的USDT数量
    const requiredAmount = await calculateRequiredUSDT(shares);
    
    // 检查当前授权额度
    const currentAllowance = await usdtContract.methods.allowance(account.address, idoAddress).call();
    
    // 如果当前授权已经足够，则不需要再次授权
    if (web3.utils.toBN(currentAllowance).gte(requiredAmount)) {
      console.log('Current allowance is sufficient. No need to approve more USDT.');
      return true;
    }
    
    const tx = {
      from: account.address,
      to: usdtAddress,
      gas: 200000,
      data: usdtContract.methods.approve(idoAddress, requiredAmount).encodeABI()
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log('USDT Approval Successful:');
    console.log('- Transaction Hash:', receipt.transactionHash);
    console.log(`- Approved Amount: ${web3.utils.fromWei(requiredAmount, 'ether')} USDT`);
    
    return true;
  } catch (error) {
    console.error('Error approving USDT:', error);
    return false;
  }
}

// 3. Mint MMF tokens
async function mintMMF(shares, referrer = '0x0000000000000000000000000000000000000000') {
  try {
    // 再次检查用户是否授权了足够的USDT
    const requiredAmount = await calculateRequiredUSDT(shares);
    const allowance = await usdtContract.methods.allowance(account.address, idoAddress).call();
    
    if (web3.utils.toBN(allowance).lt(requiredAmount)) {
      console.log('Insufficient USDT allowance!');
      console.log(`Required: ${web3.utils.fromWei(requiredAmount, 'ether')} USDT`);
      console.log(`Current allowance: ${web3.utils.fromWei(allowance, 'ether')} USDT`);
      
      // 尝试自动授权
      console.log('Attempting to approve the required USDT...');
      const approvalSuccess = await approveUSDTForShares(shares);
      
      if (!approvalSuccess) {
        console.log('Failed to approve USDT. Aborting mint operation.');
        return;
      }
    }
    
    // 检查用户USDT余额是否足够
    const usdtBalance = await usdtContract.methods.balanceOf(account.address).call();
    if (web3.utils.toBN(usdtBalance).lt(requiredAmount)) {
      console.log('Insufficient USDT balance!');
      console.log(`Required: ${web3.utils.fromWei(requiredAmount, 'ether')} USDT`);
      console.log(`Current balance: ${web3.utils.fromWei(usdtBalance, 'ether')} USDT`);
      return;
    }
    
    const tx = {
      from: account.address,
      to: idoAddress,
      gas: 500000,
      data: idoContract.methods.mint(shares, referrer).encodeABI()
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    const shareValue = await idoContract.methods.shareValue().call();
    const tokensPerShare = 9500 * 10**9; // 这里应该从合约获取，但为简化示例使用固定值
    
    console.log('MMF Minting Successful:');
    console.log('- Transaction Hash:', receipt.transactionHash);
    console.log('- Shares Purchased:', shares);
    console.log('- USDT Spent:', web3.utils.fromWei(requiredAmount, 'ether'), 'USDT');
    console.log('- MMF Received:', (shares * tokensPerShare) / 10**9, 'MMF');
    
    return receipt;
  } catch (error) {
    console.error('Error minting MMF:', error);
    return null;
  }
}

// 4. For owner: Set MMF address
async function setMMFAddress(address) {
  try {
    const tx = {
      from: account.address,
      to: idoAddress,
      gas: 200000,
      data: idoContract.methods.setMMFAddress(address).encodeABI()
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log('MMF Address Set Successfully:');
    console.log('- Transaction Hash:', receipt.transactionHash);
  } catch (error) {
    console.error('Error setting MMF address:', error);
  }
}

// 5. For owner: Withdraw USDT
async function withdrawUSDT() {
  try {
    const tx = {
      from: account.address,
      to: idoAddress,
      gas: 200000,
      data: idoContract.methods.withdrawUSDT().encodeABI()
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log('USDT Withdrawal Successful:');
    console.log('- Transaction Hash:', receipt.transactionHash);
  } catch (error) {
    console.error('Error withdrawing USDT:', error);
  }
}

// Example usage
async function runExample() {
  // 1. Check initial status
  await checkIDOStatus();
  
  // 2. 指定要购买的份数
  const sharesToBuy = 2;
  
  // 3. 为指定份数授权USDT
  await approveUSDTForShares(sharesToBuy);
  
  // 4. Mint指定份数的MMF
  await mintMMF(sharesToBuy);
  
  // 5. Check updated status
  await checkIDOStatus();
}

// Run the example
// runExample();

// Export functions for use in other scripts
module.exports = {
  checkIDOStatus,
  checkUSDTAllowance,
  calculateRequiredUSDT,
  approveUSDTForShares,
  mintMMF,
  setMMFAddress,
  withdrawUSDT
}; 