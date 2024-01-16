import http from 'http';
import ethers from 'ethers';
import express from 'express';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


try {
    data = JSON.parse(fs.readFileSync('config/config.json', 'utf8'));
} catch (error) {
    console.error(error)
}

// const mainnetUrl = data.http_provider;
// const wssUrl  = data.wss_provider;

const provider = new ethers.providers.JsonRpcProvider(mainnetUrl);
var customWsProvider = new ethers.providers.WebSocketProvider(wssUrl);
// const provider = new ethers.providers.HttpProvider(data.provider)

var wallet = new ethers.Wallet(data.privateKey);
const account = wallet.connect(provider);
var botStatus = true;

getTokenList();

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


const run = async () => {
  try {
  const pairCreated = new ethers.Contract(data.factory, ['event PairCreated(address indexed token0, address indexed token1, address pair, uint pairNums)'], account);
  pairCreated.on('PairCreated', async (token0Addr, token1Addr, pairAddr, pairNums) => {
    console.log('New Pair Creation detected : ', pairAddr,token0Addr,token1Addr, pairNums, '\n');
    fs.appendFile('src/log.txt', new Date().toISOString() + ': New Pair Created ' + token0Addr + ' ' + token1Addr + ' ' + pairAddr + '\n', function (err) {
      if (err) throw err;
    });

    let pairAddress = pairAddr;

    if (pairAddress !== null && pairAddress !== undefined) {
      // console.log("pairAddress.toString().indexOf('0x0000000000000')", pairAddress.toString().indexOf('0x0000000000000'));
      if (pairAddress.toString().indexOf('0x0000000000000') > -1) {
        console.log(chalk.red(`pairAddress ${pairAddress} not detected. Restart me!`));
        return;
      }
    }

    if (token0Addr !== data.WBNB && token1Addr !== data.WBNB) {
      return;
    }
   tokenList.push(pairAddress);

  })

  } catch(err) {
    console.log("Please check the network status... maybe its due because too many pair detect requests..");
    run();
  }

}


var txData;
var txFunc;
var lpAddress;
const scanMempool = async () => {

  try {
   console.log(chalk.red(`\nStart New Locked Liqudity Pair Scan Service Start ... `));
   customWsProvider.on("pending", (tx) => {
    customWsProvider.getTransaction(tx).then(async function (transaction) {

      // try {

      if (transaction != null) {

        try {
         txData = transaction.data;
         txFunc = txData.substring(0, 10);
         lpAddress = "0x" + txData.substring(10,74).replace(/^0+/, '');
         // console.log(transaction.hash);
         if ((txFunc == "0x6167aa61" || txFunc == "0x7d533c1e") && tokenList.includes(ethers.utils.getAddress(lpAddress))) {
           console.log(chalk.red(`New locked liquidity lp address :  ${lpAddress}`));
           console.log("------------------------ Locked transaction Hash : ", transaction.hash);
           const pair = new ethers.Contract(ethers.utils.getAddress(lpAddress), ['function token0() external view returns (address)','function token1() external view returns (address)' ], account);
           let intoken = await pair.token0();
           let outtoken = await pair.token1();

           const tokenIn = data.WBNB;
           const tokenOut = (ethers.utils.getAddress(intoken) === data.WBNB) ? ethers.utils.getAddress(outtoken) : ethers.utils.getAddress(intoken);

           //We buy x amount of the new token for our wbnb
            const amountIn = ethers.utils.parseUnits(`${data.AMOUNT_OF_BNB}`, 'ether');
            console.log(amountIn, data.WBNB, tokenOut)
            const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);

            //Our execution price will be a bit different, we need some flexbility
            const amountOutMin = amounts[1].sub(amounts[1].mul(`${data.Slippage}`).div(100));
            //const amountOutMin = amounts[1].sub(amounts[1].div(`${data.Slippage}`)); 
            console.log('slippage', amountOutMin, amounts[1]);

            console.log(
              chalk.green.inverse(`Liquidity Addition Detected\n`)
              +
              `Buying Token
              =================
              tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
              tokenOut: ${amountOutMin.toString()} ${tokenOut}
            `);


            let price = (amountIn/amountOutMin);

            // console.log('Processing Transaction.....');
            // console.log(chalk.yellow(`price: ${price}`));
            // console.log(chalk.yellow(`amountIn: ${amountIn}`));
            // console.log(chalk.yellow(`amountOutMin: ${amountOutMin}`));
            // console.log(chalk.yellow(`tokenIn: ${tokenIn}`));
            // console.log(chalk.yellow(`tokenOut: ${tokenOut}`));
            // console.log(chalk.yellow(`data.recipient: ${data.recipient}`));
            // console.log(chalk.yellow(`data.gasLimit: ${data.gasLimit}`));
            // console.log(chalk.yellow(`data.gasPrice: ${ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')}`));

            fs.appendFile('src/log.txt', new Date().toISOString() + ': Preparing to buy token ' + tokenIn + ' ' + amountIn + ' ' + tokenOut + ' ' + amountOutMin + '\n', function (err) {
              if (err) throw err;
            });

            lockedList.push(tokenOut);
            priceList.push(price);
            fs.appendFile('src/tokenlist.txt', '\n' + tokenOut + " " + price, function (err) {
              if (err) throw err;
            });

            if (botStatus === true) {
              const tx = await router.swapExactETHForTokens(
                amountOutMin,
                [tokenIn, tokenOut],
                data.recipient,
                Date.now() + 1000 * 60 * 10, //10 minutes
                {
                  'gasLimit': data.gasLimit,
                  'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei'),
                  'value': amountIn
                }).catch((err) => {
                  console.log('transaction failed...')
                });

              await tx.wait();
            }

         }
        } catch(err){
            console.log("transaction ....");
        }

      }

    });
  });
 } catch (err) {
   console.log("Please check the network status... maybe its due because too many scan requests..");
   scanMempool();
 }

}


const sell = async () => {
    console.log(chalk.red(`\nStart Sell Service Start ... `));

      for (let i = 0; i < lockedList.length ; i++ ) {
        try {
          const tokenIn = lockedList[i];
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

          if (amount < ethers.BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) {
              await contract.approve(data.router,ethers.BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") , {gasLimit: 100000, gasPrice: 5e9});
              console.log(tokenIn, " Approved \n");
          }

          // let price = (amountOutMin/amountIn)/Math.pow(10, 18-decimal);
          let price = (amountOutMin/amountIn);
          let sellPrice =  (data.profit/100) * parseFloat(priceList[i]);
          fs.appendFile('src/log.txt', new Date().toISOString() + ': Preparing to sell token ' + tokenIn + ' ' + amountIn + ' ' + tokenOut + ' ' + amountOutMin + '\n', function (err) {
            if (err) throw err;
          });
          if (price > sellPrice) {
              console.log(
              chalk.green.inverse(`\nSell tokens: \n`)
              +
              `================= ${tokenIn} ===============`);
                console.log(chalk.yellow(`decimals: ${decimal}`));
                console.log(chalk.yellow(`price: ${price}`));
                console.log(chalk.yellow(`sellPrice: ${sellPrice}`));
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
                fs.appendFile('src/log.txt', new Date().toISOString() + ': Sell token ' + tokenIn + ' ' + amountIn + ' ' + tokenOut + ' ' + amountOutMin + '\n', function (err) {
                  if (err) throw err;
                });

               }
             }
              catch(err) {
                console.log('Please check token BNB/WBNB balance in the pancakeswap, maybe its due because insufficient balance ');
             }
       }


}

const getTokenBalance = async () => {
    for (let tokenAddress of lockedList) {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, account);
      const tokenBalance = await contract.balanceOf(data.recipient)
      console.log(chalk.red(`tokenaddress ${tokenAddress} : ${tokenBalance}`));
      console.log();
  }
}

function getTokenList() {
    var array = fs.readFileSync('src/tokenlist.txt').toString().split("\n");
    var newArray = [];
    for(let i in array) {
        array[i] = array[i].replace(/(\r\n|\n|\r)/gm, "");
        if (array[i] == "") continue;
        let one_token = array[i].split(" ");
        lockedList.push(one_token[0]);
        priceList.push(one_token[1]);
    }
}

run();
scanMempool();

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

