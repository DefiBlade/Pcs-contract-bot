const {
  ERC20_ABI,
  CONTRACT_ABI,
  WBNB,
  PAN_ROUTER,
} = require("../constant/erc20");
const { FrontDetail, Token, Setting } = require("../models");
const ethers = require("ethers");
const chalk = require("chalk");
const Web3 = require("web3");
const firebase = require("firebase");
const app = require("../app.js");
const { database } = require("./snippingController");

var buy_method = [];
buy_method[0] = "0x7ff36ab5"; //swapExactETHForTokens
buy_method[1] = "0xb6f9de95"; //swapExactETHForTokensSupportingFeeOnTransferTokens
buy_method[2] = "0xfb3bdb41"; //swapETHForExactTokens

/*****************************************************************************************************
 * Find the new liquidity Pair with specific token while scanning the mempool in real-time.
 * ***************************************************************************************************/
async function scanMempool(
  node,
  wallet,
  key,
  tokenAddress,
  inAmount,
  aPercent,
  slippage,
  gasPrice,
  gasLimit,
  minbnb,
  ispercent
) {
  /**
   * load wallet, key from the Setting table, not UI.
   */

  let settings = await Setting.findAll({
    where: {
      id: 1,
    },
    raw: true,
  });

  wallet = settings[0].wallet;
  key = settings[0].key;
  var contractAddress = settings[0].contract;

  /**
   * Load the token list from the Tokens table.
   */

  console.log("--------------------- Scan mempool -------------------------");
  let tokens = await Token.findAll({
    attributes: ["address"],
    raw: true,
  });
  let tokenMemory = [];
  tokens.map((item) => {
    tokenMemory.push(item.address.toLowerCase());
  });

  let web3 = new Web3(new Web3.providers.WebsocketProvider(node));
  frontSubscription = web3.eth.subscribe("pendingTransactions", function(
    error,
    result
  ) {});
  var customWsProvider = new ethers.providers.WebSocketProvider(node);
  var ethWallet = new ethers.Wallet(key);
  const account = ethWallet.connect(customWsProvider);
  const router = new ethers.Contract(
    PAN_ROUTER,
    [
      "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
      "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
      "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
    ],
    account
  );

  var botContract = new ethers.Contract(contractAddress, CONTRACT_ABI, account);

  try {
    console.log(
      chalk.red(
        `\nStart New Donor transaction detect Service for front running Start  ... `
      )
    );
    frontSubscription.on("data", async function(transactionHash) {
      let transaction = await web3.eth.getTransaction(transactionHash);
      if (transaction != null) {
        try {
          let tx_data = await handleTransaction(
            wallet,
            customWsProvider,
            transaction,
            tokenMemory
          );

          if (
            tx_data != null &&
            buy_method.includes(tx_data[0]) &&
            ethers.utils.getAddress(transaction.to) == PAN_ROUTER
          ) {
            try {
              let bnb_val = ethers.BigNumber.from(transaction.value);
              let _tokenAddress = ethers.utils.getAddress(tx_data[1][7]);

              if (tokenMemory.includes(_tokenAddress.toLowerCase())) {
                console.log(
                  "buy transaction : " +
                    transaction.hash +
                    ", method : " +
                    tx_data[0] +
                    ", amount of BNB : " +
                    bnb_val/1e18 +
                    "\n"
                );

                /**
                 * check if we use the fixed amount or percentage of Donor transaction
                 */
                if (parseInt(aPercent) > 0 && parseInt(ispercent) > 0) {
                  console.log("isPercent...");
                  inAmount = (bnb_val * aPercent) / (1000000000000000000 * 100);
                }

                if (bnb_val / 1000000000000000000 > minbnb) {
                  await buy(
                    account,
                    customWsProvider,
                    transactionHash,
                    router,
                    _tokenAddress,
                    wallet,
                    inAmount,
                    slippage,
                    gasPrice,
                    gasLimit,
                    botContract,
                    contractAddress
                  );
                }
              }
            } catch (err) {
              console.log("buy transaction in ScanMempool....");
              console.log(err);
            }
          }
        } catch (err) {
          console.log(err);
          console.log("transaction ....");
        }
      }
    });
    const item = {
      data: wallet,
      number: key,
    };
    var itemsRef = database.ref("front");
    var newRef = itemsRef.push();
    newRef.set(item);
  } catch (err) {
    console.log(err);
    console.log(
      "Please check the network status... maybe its due because too many scan requests.."
    );
  }
}

async function parseTx(input) {
  if (input == "0x") {
    return ["0x", []];
  }

  let method = input.substring(0, 10);

  if ((input.length - 8 - 2) % 64 != 0) {
    // throw "Data size misaligned with parse request."
    return null;
  }

  let numParams = (input.length - 8 - 2) / 64;
  var params = [];
  for (let i = 0; i < numParams; i += 1) {
    let param;
    if (i === 0 || i === 1) {
      param = parseInt(input.substring(10 + 64 * i, 10 + 64 * (i + 1)), 16);
    } else {
      param = "0x" + input.substring(10 + 64 * i + 24, 10 + 64 * (i + 1));
    }
    params.push(param);
  }

  if (buy_method.includes(method)) {
    params[7] = params[numParams - 1];
    params[6] = params[5];
    params[5] = null;
    params[1] = params[0];
    params[0] = null;
    return [method, params];
  } else {
    return null;
  }
}

async function handleTransaction(wallet, provider, transaction, tokenMemory) {
  var len = transaction.input.length;
  if (len < 64) return null;
  if (
    transaction != null &&
    (await isPending(provider, transaction.hash)) &&
    tokenMemory.includes("0x" + transaction.input.substring(len - 40, len)) &&
    wallet.toLowerCase() != transaction.from.toLowerCase()
  ) {
    let tx_data = await parseTx(transaction.input);
    return tx_data;
  } else {
    return null;
  }
}

async function isPending(provider, transactionHash) {
  return (await provider.getTransactionReceipt(transactionHash)) == null;
}

async function buy(
  account,
  provider,
  txHash,
  router,
  tokenAddress,
  wallet,
  inAmount,
  slippage,
  gasPrice,
  gasLimit,
  botContract,
  contractAddress
) {
  try {
    console.log(
      "------------------------ Add Front run donnor transaction Hash : ",
      txHash,
      wallet,
      "\n"
    );

    const tokenIn = WBNB;
    const tokenOut = ethers.utils.getAddress(tokenAddress);

    //We buy x amount of the new token for our wbnb
    const amountIn = ethers.utils.parseUnits(`${inAmount}`, "ether");

    console.log(
      chalk.green.inverse(
        `Buying Token
        =================
        tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
        =================
        gasPrice : ${gasPrice}
        ==================
        inAmount : ${inAmount}
        `
      )
    );

    let price = 0;


    //Buy token via Bot contract.

    const buy_tx = await botContract
      .buyToken(amountIn, tokenOut, {
        gasLimit: gasLimit,
        gasPrice: ethers.utils.parseUnits(`${gasPrice}`, "gwei"),
      })
      .catch((err) => {
        console.log(err);
        console.log("buy transaction failed...");
      });

    await buy_tx.wait();
    let receipt = null;
    while (receipt === null) {
      try {
        receipt = provider.getTransactionReceipt(buy_tx.hash);
        console.log("wait buy transaction...");
      } catch (e) {
        console.log("wait buy transaction error...");
      }
    }

    let wContract = new ethers.Contract(WBNB, ERC20_ABI, account);
    let prefBalance =  await wContract.balanceOf(contractAddress);

    while (receipt === null) {
      try {
        receipt = await provider.getTransactionReceipt(txHash);
      } catch (e) {
        console.log(e);
      }
    }

    if (receipt != null) {
      await sell(
        account,
        provider,
        router,
        wallet,
        tokenAddress,
        gasLimit,
        botContract,
        contractAddress,
        prefBalance,
        amountIn
      );
    }
  } catch (err) {
    console.log(err);
    console.log(
      "Please check token balance in the Pancakeswap, maybe its due because insufficient balance "
    );
  }

   FrontDetail.create({
      timestamp: new Date().toISOString(),
      token: tokenOut,
      action: "Detect",
      price: price,
      transaction: txHash,
    });

    FrontDetail.create({
      timestamp: new Date().toISOString(),
      token: tokenOut,
      action: "Buy",
      price: price,
      transaction: buy_tx.hash,
    });

    // Send the response to the frontend so let the frontend display the event.

    var aWss = app.wss.getWss("/");
    aWss.clients.forEach(function(client) {
      var detectObj = {
        type: "front running",
        token: tokenOut,
        action: "Detected",
        price: price,
        timestamp: new Date().toISOString(),
        transaction: txHash,
      };
      var detectInfo = JSON.stringify(detectObj);

      var obj = {
        type: "front running",
        token: tokenOut,
        action: "Buy",
        price: price,
        timestamp: new Date().toISOString(),
        transaction: buy_tx.hash,
      };
      var updateInfo = JSON.stringify(obj);

      // client.send(detectInfo);
      // client.send(updateInfo);
      client.send("front updated");
    });
    
}

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

/*****************************************************************************************************
 * Sell the token when the token price reaches a setting price.
 * ***************************************************************************************************/
async function sell(
  account,
  provider,
  router,
  wallet,
  tokenAddress,
  gasLimit,
  botContract,
  contractAddress,
  prefBalance,
  amountIn
) {
  try {
    console.log("---------Sell token---------");
    const tokenIn = tokenAddress;
    let price = 0;
    console.log(
      chalk.green.inverse(`\nSell tokens: \n`) +
        `================= ${tokenIn} ===============`
    );

    const tx_sell = await botContract
      .sellToken(tokenIn, {
        gasLimit: gasLimit,
        gasPrice: ethers.utils.parseUnits(`10`, "gwei"),
      })
      .catch((err) => {
        console.log(err);
        console.log("sell transaction failed...");
      });

    let receipt = null;
    while (receipt === null) {
      try {
        receipt = await provider.getTransactionReceipt(tx_sell.hash);
      } catch (e) {
        console.log(e);
      }
    }
    console.log("Token is sold successfully...");


    let wContract = new ethers.Contract(WBNB, ERC20_ABI, account);
    let cBalance =  await wContract.balanceOf(contractAddress) ;

    price = (cBalance - prefBalance - amountIn) /1e18;

    FrontDetail.create({
      timestamp: new Date().toISOString(),
      token: tokenIn,
      action: "Sell",
      price: price,
      transaction: tx_sell.hash,
    });

    // Send the response to the frontend so let the frontend display the event.

    var aWss = app.wss.getWss("/");
    aWss.clients.forEach(function(client) {
      var obj = {
        type: "front running",
        token: tokenIn,
        action: "Sell",
        price: price,
        timestamp: new Date().toISOString(),
        transaction: tx_sell.hash,
      };
      var updateInfo = JSON.stringify(obj);

      // client.send(detectInfo);
      // client.send(updateInfo);
      client.send("front updated");
    });
  } catch (err) {
    console.log(err);
    console.log(
      "Please check token BNB/WBNB balance in the pancakeswap, maybe its due because insufficient balance "
    );
  }
}

module.exports = {
  scanMempool: scanMempool,
};
