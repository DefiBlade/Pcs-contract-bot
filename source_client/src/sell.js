import http from 'http';
import ethers from 'ethers';
import express from 'express';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import  BigNumber  from "bignumber.js";
import { fileURLToPath } from 'url';

const app = express();

const httpServer = http.createServer(app);
var data;

try {
    data = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
} catch (error) {
    console.error(error)
}


data.WBNB    = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
data.factory = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
data.router  = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const mainnetUrl = 'https://bsc-dataseed.binance.org/';
// const mainnetUrl = 'https://dawn-shy-voice.bsc.quiknode.pro/f929e892df513a1ad658ca2046aec0768f3817e5/'
//const mainnetUrl = 'https://mainnet.infura.io/v3/5fd436e2291c47fe9b20a17372ad8057'

const provider = new ethers.providers.JsonRpcProvider(mainnetUrl);
// const provider = new ethers.providers.HttpProvider(data.provider)

var wallet = new ethers.Wallet(data.privateKey);
const account = wallet.connect(provider);
var botStatus = true;

var tokenList = [];

function setBotStatus(obj) {
  botStatus = obj.botStatus;
  //data.recipient = obj.walletAddr;
  //data.privateKey = obj.privateKey;
  data.AMOUNT_OF_WBNB = obj.inAmount;
  data.Slippage = obj.slippage;
  data.gasPrice = obj.gasPrice;
  data.gasLimit = obj.gasLimit;
}


const router = new ethers.Contract(
  data.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external'
  ],
  account
);

const erc = new ethers.Contract(
  data.WBNB,
  [{"constant": true,"inputs": [{"name": "_owner","type": "address"}],"name": "balanceOf","outputs": [{"name": "balance","type": "uint256"}],"payable": false,"type": "function"}],
  account
);

const ERC20_ABI = [{ "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "supply", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "digits", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "remaining", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_owner", "type": "address" }, { "indexed": true, "name": "_spender", "type": "address" }, { "indexed": false, "name": "_value", "type": "uint256" }], "name": "Approval", "type": "event" }];


tokenList = getTokenList();

function getTokenList() {
    var array = fs.readFileSync('src/tokenlist.txt').toString().split("\n");
    var newArray = [];
    for(let i in array) {
        array[i] = array[i].replace(/(\r\n|\n|\r)/gm, "");
        if (array[i] == "") continue;
        newArray.push(array[i]);
    }
    console.log(newArray);
    return newArray;
}


const getTokenBalance = async () => {
    for (let tokenAddress of tokenList) {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, account);
      const tokenBalance = await contract.balanceOf(data.recipient)
      console.log(chalk.red(`tokenaddress ${tokenAddress} : ${tokenBalance}`));
      console.log();
  }
}

const run = async () => {

    while(true) {
      for (let tokenAddress of tokenList) {
      try {
        const tokenIn = tokenAddress;
        const tokenOut = data.WBNB;
        const contract = new ethers.Contract(tokenIn, ERC20_ABI, account);
        //We buy x amount of the new token for our wbnb
        const amountIn = await contract.balanceOf(data.recipient);
        const decimal  = await contract.decimals();
        if (amountIn < 1) continue;
        // console.log("amoutIn...", amountIn);
        const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
        //Our execution price will be a bit different, we need some flexbility
        const amountOutMin = amounts[1].sub(amounts[1].mul(`${data.Slippage}`).div(100));
        //const amountOutMin = amounts[1].sub(amounts[1].div(`${data.Slippage}`)); 

        let amount = await contract.allowance(data.recipient, data.router);

        if (amount < ethers.BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
            await contract.approve(data.router,ethers.BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") , {gasLimit: 100000, gasPrice: 5e9});
            console.log(tokenIn, " Approved \n");
        }

        let price = (amountOutMin/amountIn)/Math.pow(10, 18-decimal);

        fs.appendFile('log.txt', new Date().toISOString() + ': Preparing to sell token ' + tokenIn + ' ' + amountIn + ' ' + tokenOut + ' ' + amountOutMin + '\n', function (err) {
          if (err) throw err;
        });

        if (price > data.sellPrice) {
            console.log(
            chalk.green.inverse(`\nSell tokens: \n`)
            +
            `================= ${tokenIn} ===============`);
              console.log(chalk.yellow(`decimals: ${decimal}`));
              console.log(chalk.yellow(`price: ${price}`));
              console.log(chalk.yellow(`sellPrice: ${data.sellPrice}`));
              console.log("");

              const tx_sell = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
              amountIn,
              0,
              [tokenIn, tokenOut],
              data.recipient,
              Date.now() + 1000 * 60 * 10, //10 minutes
              {
                'gasLimit': data.gasLimit,
                'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')
              }).catch((err) => {
                  console.log('transaction failed...')
                });

              await tx_sell.wait();
              console.log("Token is sold successfully...");
             }
           }
            catch(err) {
              console.log('Please check token BNB/WBNB balance in the pancakeswap, maybe its due because insufficient balance ');
           }
     }
    }

}

run();
// getTokenBalance();

const PORT = 5000;

httpServer.listen(PORT, (console.log(chalk.yellow(`\n Selling token...`))));
