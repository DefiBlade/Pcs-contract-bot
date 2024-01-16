const ethers = require("ethers");
const chalk = require("chalk");
const fs = require("fs");
const CONTRACT_ABI = require("../config/abi.json");
const { BlockList } = require("net");
require("dotenv").config();

const PrivateKey = process.env.PrivateKey;
const RouterAddress = process.env.RouterAddress;
const FactoryAddress = process.env.FactoryAddress;
const contractAddress = process.env.contractAddress;
const WBNB = process.env.WBNB;
const lowWBNB = WBNB.substring(2).toLowerCase();
const HttpProvider = process.env.HttpProvider;
const WssProvider = process.env.WssProvider;

const MIN_Follow = process.env.MIN_Follow;
let Fixed = false;
const Fixed_Use = process.env.Fixed_Use;
const Percent_Use = process.env.Percent_Use;
const Max_Use = process.env.Max_Use;

// ethers.utils.parseUnits(process.env.Max_Use, "ether");

let Fixed_Gas = false;
const Fixed_Gas_Use = process.env.Fixed_Gas_Use;
const Gas_Multiply = parseInt(process.env.Gas_Multiply);
const Gas_Plus = process.env.Gas_Plus;
const MinGas = process.env.MinGas;
const MaxGas = process.env.MaxGas;
const gasLimit = process.env.gasLimit;

if (process.env.Fixed == "true") {
  Fixed = true;
}
if (process.env.Fixed_Gas == "true") {
  Fixed_Gas = true;
}

const provider = new ethers.providers.WebSocketProvider(WssProvider);
const wallet = new ethers.Wallet(PrivateKey);
const myAddress = wallet.address;
const account = wallet.connect(provider);
provider.removeAllListeners();
const Factory = new ethers.Contract(
  FactoryAddress,
  [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  ],
  account
);
var botContract = new ethers.Contract(contractAddress, CONTRACT_ABI, account);

let currentNonce = 0;
let passed = 0;
const buyMethod1 = "0x38ed1739"; //swapExactTokensforTokens
const buyMethod2 = "0x8803dbee"; //swapTokensforExactTokens
const buyMethod3 = "0xfb3bdb41"; //swapETHForExactTokens
const buyMethod4 = "0x7ff36ab5"; //swapExactETHForTokens
const buyMethod5 = "0xb6f9de95"; //swapExactETHForTokensSupportingFeeOnTransferTokens

var blackList = [];

async function getNonce(addr) {
  const nonce = await provider.getTransactionCount(addr);
  return nonce;
}

async function getTokenBalance(tokenAddress, address, provider) {
  const abi = [
    {
      name: "balanceOf",
      type: "function",
      inputs: [
        {
          name: "_owner",
          type: "address",
        },
      ],
      outputs: [
        {
          name: "balance",
          type: "uint256",
        },
      ],
      constant: true,
      payable: false,
    },
  ];

  const contract = new ethers.Contract(tokenAddress, abi, provider);
  const balance = await contract.balanceOf(address);
  return balance;
}

function getBlackList() {
  var array = fs.readFileSync("config/blacklist.txt").toString().split("\n");
  var newArray = [];
  for (let i in array) {
    array[i] = array[i].replace(/(\r\n|\n|\r)/gm, "");
    if (array[i] == "") continue;
    newArray.push(array[i].toLowerCase());
  }
  console.log(newArray);
  return newArray;
}

// 0x18cbafe5
// 0000000000000000000000000000000000000000000000000649062682c64000
// 00000000000000000000000000000000000000000000000000095b738045e7b6
// 00000000000000000000000000000000000000000000000000000000000000a0
// 000000000000000000000000f06ef26b1674b0a3850c27524cbc736c46309eab
// 0000000000000000000000000000000000000000000000000000000061b27933
// 0000000000000000000000000000000000000000000000000000000000000003
// 0000000000000000000000003244b3b6030f374bafa5f8f80ec2f06aaf104b64
// 000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d56
// 000000000000000000000000bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c

// 0x8803dbee
// 00000000000000000000000000000000000000000000007b0e6e410969680000
// 000000000000000000000000000000000000000000000000011909aa0feb7eb0
// 00000000000000000000000000000000000000000000000000000000000000a0
// 000000000000000000000000a4cf49284a27cbbe366d17d586ebe29819f04e26
// 0000000000000000000000000000000000000000000000000000000061cd038f
// 0000000000000000000000000000000000000000000000000000000000000002
// 000000000000000000000000bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c
// 000000000000000000000000ede1f9cdb98b4ca6a804de268b0aca18dce192e8

async function start() {
  currentNonce = await getNonce(myAddress);
  console.log(chalk.yellow(`Waiting for targeted transaction on mempool...`));
  provider.on("pending", async (tx) => {
    const transaction = await provider.getTransaction(tx);
    let length = transaction["data"].length;
    if (
      transaction != null &&
      transaction.to == RouterAddress && 
      !(blackList.includes("0x" + transaction["data"].substring(length-40))) &&
      (transaction["data"].includes(buyMethod1) ||
        transaction["data"].includes(buyMethod2) ||
        transaction["data"].includes(buyMethod3) ||
        transaction["data"].includes(buyMethod4) ||
        transaction["data"].includes(buyMethod5))
    ) {
       console.log("Buy transaction detected");

      let inAmnt;
      let gasFeeBigNumber = transaction.gasPrice;
      let gasFee =
        ethers.BigNumber.from(gasFeeBigNumber).toNumber() / 1000000000;

      // console.log(gasFee);
      

      if (
        transaction["data"].includes(buyMethod1) ||
        transaction["data"].includes(buyMethod2)
      ) {
        // console.log("buy method1, 2");
        // // console.log(transaction);

        // console.log(transaction["data"].substring(length-104, length-64));

        if (
          transaction["data"]
            .substring(length - 104, length - 64)
            .includes(lowWBNB)
        ) {
          // console.log("swaptokensfortokens, wbnb detected");
          // console.log(transaction);
          // console.log(transaction['data']);
          // console.log("parameters: " + transaction["data"].substring(length-130, length-128));

          if (
            transaction["data"].substring(length - 130, length - 128) == "02"
          ) {
            // console.log("swaptokensfortokens, paramter only 2");

            if (transaction["data"].includes(buyMethod2)) {
              inAmnt = parseInt(transaction["data"].substring(74, 138), 16);
            } else {
              inAmnt = parseInt(transaction["data"].substring(10, 74), 16);
            }
            // console.log(transaction.hash);

            // console.log(transaction['data']);
            // console.log(inAmnt/1000000000000000000);
          } else {
            return;
          }
        } else {
          return;
        }
      } else {
        inAmnt = ethers.BigNumber.from(transaction.value);
      }

      inAmnt = inAmnt / 1000000000000000000;

      let tokenAddress = "0x" + transaction["data"].substring(length - 40);
      let blockNumber = await provider.getBlockNumber();

      // console.log(transaction.hash);
      // console.log(inAmnt);

      // console.log("buy : ", transaction.hash, "block number : ", blockNumber);
      // console.log("token address : ", tokenAddress);

      if (inAmnt > MIN_Follow) {
        let pairAddress = await Factory.getPair(WBNB, tokenAddress);
        const pairContract = new ethers.Contract(
          pairAddress,
          [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
          ],
          account
        );
        let reserves = await pairContract.getReserves();
        let token0 = await pairContract.token0();
        let x = token0 === WBNB ? parseInt(reserves[0]) : parseInt(reserves[1]);
        x = x / 1000000000000000000;

        console.log("pairAddress : ", pairAddress);
        console.log("WBNB lp amount:" + x);
        console.log("WBNB liquidity Percent : " + (inAmnt * 100) / x);
        // x > 0
        if (false) {
          if ((inAmnt * 100) / x > 1 || inAmnt > MIN_Follow * 2) {
            if (gasFee < 7) {
              gasFee += 5;
            } else if (gasFee < 11) {
              gasFee += 10;
            } else {
              gasFee = gasFee * 10;
            }

            let amountIn = inAmnt * Percent_Use;
            if (amountIn > Max_Use) amountIn = Max_Use;
            if (gasFee > 15) {
              // call the emergency Buy

              const buy_tx = await botContract
                .emergencyBuy(amountIn, tokenAddress, {
                  gasLimit: gasLimit,
                  gasPrice: ethers.utils.parseUnits(`${gasFee}`, "gwei"),
                })
                .catch((err) => {
                  console.log(err);
                  console.log("buy transaction failed...");
                });

              await buy_tx.wait();

              const sell_tx = await botContract
                .emergencySell(tokenAddress, {
                  gasLimit: gasLimit,
                  gasPrice: ethers.utils.parseUnits(`7`, "gwei"),
                })
                .catch((err) => {
                  console.log(err);
                  console.log("buy transaction failed...");
                });

              await sell_tx.wait();
            } else {
              // call the normal buy...
              const buy_tx = await botContract
                .superEmergencyBuy(amountIn, tokenAddress, {
                  gasLimit: gasLimit,
                  gasPrice: ethers.utils.parseUnits(`${gasFee}`, "gwei"),
                })
                .catch((err) => {
                  console.log(err);
                  console.log("buy transaction failed...");
                });

              await buy_tx.wait();

              const sell_tx = await botContract
                .emergencySell(tokenAddress, {
                  gasLimit: gasLimit,
                  gasPrice: ethers.utils.parseUnits(`7`, "gwei"),
                })
                .catch((err) => {
                  console.log(err);
                  console.log("buy transaction failed...");
                });

              await sell_tx.wait();
            }
          }
        }
      }
    }
  });
}

blackList = getBlackList();
start();
