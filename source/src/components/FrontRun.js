import React, { useState, useEffect } from "react";
import { Button, FormControl, Form } from "react-bootstrap";
import "./style/Display.css";
import { MDBDataTable, MDBInput, MDBFormInline } from "mdbreact";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { startFront, stopFront, getFrontStatus, listFront } from "./api";
import CONFIG from "./constant/config";
import { isAddress } from "@ethersproject/address";

const FrontRun = () => {
  const client = new W3CWebSocket("ws://localhost:8080/connect");

  var transactionItems = [];

  const [isRunning, setIsRunning] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [nodeUrl, setNodeUrl] = useState("");
  const [inAmount, setInAmount] = useState("");
  const [inPercent, setInPercent] = useState("");
  const [slippage, setSlippage] = useState("");
  const [gasPrice, setGasPrice] = useState("");
  const [gasMaxPrice, setGasMaxPrice] = useState("");
  const [gasLimit, setGasLimit] = useState("");
  const [minBNB, setMinBNB] = useState("");
  const [minProfit, setMinProfit] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isPercent, setIsPercent] = useState(0);
  const [isAjustGas, setIsAdjustGas] = useState(0);
  const [isProfit, setIsProfit] = useState(0);

  var rows = transactions.map((item) => {
    item.transaction = (
      <a href={CONFIG.EXPLORER + item.transaction} target="_blank">
        {item.transaction}
      </a>
    );

    return item;
  });

  const data = {
    columns: [
      {
        label: "TimeStamp",
        field: "timestamp",
      },

      {
        label: "Token",
        field: "token",
      },
      {
        label: "Buy/Sell",
        field: "action",
      },
      // {
      //   label: "Price",
      //   field: "price",
      // },

      {
        label: "Transaction",
        field: "transaction",
      },

      {
        label : "Profit",
        field : "price"
      }
    ],
    rows: rows,
  };

  const start = () => {
    if (
      nodeUrl == "" ||
      inAmount == "" ||
      inPercent == "" ||
      slippage == "" ||
      gasPrice == "" ||
      gasLimit == "" ||
      minBNB == "" ||
      gasMaxPrice < gasPrice
    ) {
      alert(
        "please input all correct information to start the Front running !"
      );
    } else {
      setIsRunning(true);
      startFront(
        nodeUrl,
        walletAddress,
        privateKey,
        tokenAddress,
        inAmount,
        inPercent,
        slippage,
        gasPrice,
        gasMaxPrice,
        gasLimit,
        minBNB,
        minProfit,
        isPercent,
        isAjustGas,
        isProfit
      );
    }
  };

  const stop = () => {
    setIsRunning(false);
    stopFront();
  };

  const loadSetting = (status) => {
    setWalletAddress(status.wallet);
    setPrivateKey(status.key);
    setNodeUrl(status.node);
    setTokenAddress(status.token);
    setInAmount(status.amount);
    setSlippage(status.slippage);
    setGasPrice(status.gasprice);
    setGasLimit(status.gaslimit);
    setMinBNB(status.minbnb);
    setGasMaxPrice(status.gasmax);
    setInPercent(status.inpercent);
    setMinProfit(status.minprofit);
    setIsPercent(status.ispercent);
    setIsAdjustGas(status.isadjustgas);
    setIsProfit(status.isprofit);
  };

  const setStatus = async () => {
    var curStatus = await getFrontStatus();
    loadSetting(curStatus);
    if (curStatus.status === "1") setIsRunning(true);
    else setIsRunning(false);
  };

  const listTransactions = async () => {
    transactionItems = await listFront();
    setTransactions(transactionItems);
  };

  useEffect(() => {
    setStatus();
    listTransactions();
    client.onopen = () => {
      console.log("WebSocket Client Connected");
    };
    client.onmessage = (message) => {
      if (message.data.includes("front")) listTransactions();
      if (message.data.includes("setting")) {
        setStatus();
        listTransactions();
      }
    };
  }, []);

  return (
    <div>
      <div className="row">
        <div className="col-sm-12 col-md-6 col-lg-6 hidden">
          <div className="form-group hidden">
            <label htmlFor="usr">Wallet Address:</label>
            <FormControl
              type="text"
              id="walletAddr"
              value={walletAddress}
              onChange={(e) => {
                setWalletAddress(e.target.value);
              }}
              className="form-control form-control-md"
            />
          </div>
          <div className="form-group hidden">
            <label htmlFor="tokenAddress">Token Address:</label>
            <FormControl
              disabled
              type="text"
              id="tokenAddress"
              value={tokenAddress}
              onChange={(e) => {
                setTokenAddress(e.target.value);
              }}
              size="md"
            />
          </div>
        </div>
        <div className="col-sm-12 col-md-6 col-lg-6">
          <div className="form-group">
            <label htmlFor="wssURL">Quick Node WSS URL:</label>
            <FormControl
              type="text"
              id="nodeUrl"
              value={nodeUrl}
              onChange={(e) => {
                setNodeUrl(e.target.value);
              }}
              className="form-control form-control-md"
            />
          </div>
          <div className="form-group hidden">
            <label htmlFor="pwd">Private Key:</label>
            <FormControl
              type="password"
              id="privateKey"
              value={privateKey}
              onChange={(e) => {
                setPrivateKey(e.target.value);
              }}
              className="form-control form-control-md"
            />
          </div>
        </div>
      </div>
      <h4>My address </h4>
      <div className="form-group">
        <label htmlFor="bnb-amount">BNB Amount (Fixed):</label>
        <input
          type="number"
          id="inAmount"
          placeholder="0.1"
          className="short-input"
          value={inAmount}
          onChange={(e) => {
            setInAmount(e.target.value);
          }}
        />
        <label htmlFor="bnb-amount">
          BNB Amount (% of original Transaction):
        </label>
        <input
          type="number"
          id="inPercent"
          className="short-input"
          placeholder="10"
          value={inPercent}
          onChange={(e) => {
            setInPercent(e.target.value);
          }}
          disabled={isPercent == 1 ? false : true}
        />
        <label htmlFor="pwd">Slippage(%):</label>
        <input
          type="number"
          id="slippage"
          placeholder="90"
          className="short-input"
          value={slippage}
          onChange={(e) => {
            setSlippage(e.target.value);
          }}
        />
        <div className="row"></div>
        <label htmlFor="pwd">Gas Price (Min):</label>
        <input
          type="number"
          id="gasPrice"
          placeholder="30"
          className="short-input"
          value={gasPrice}
          onChange={(e) => {
            setGasPrice(e.target.value);
          }}
          disabled={isAjustGas == 1 ? false : true}
        />

        <label htmlFor="pwd">Gas Price (Max):</label>
        <input
          type="number"
          placeholder="50"
          id="gasMaxPrice"
          className="short-input"
          value={gasMaxPrice}
          onChange={(e) => {
            setGasMaxPrice(e.target.value);
          }}
          disabled={isAjustGas == 1 ? false : true}
        />

        <label htmlFor="pwd">Gas Limit:</label>
        <input
          type="number"
          id="gasLimit"
          placeholder="300000"
          className="short-input"
          value={gasLimit}
          onChange={(e) => {
            setGasLimit(e.target.value);
          }}
          disabled={isAjustGas == 1 ? false : true}
        />
      </div>

      <h4>Front running </h4>

      <div className="form-group">
        {" "}
        <label htmlFor="pwd">Min BNB to follow:</label>
        <input
          type="number"
          id="minBNB"
          placeholder="10"
          className="short-input"
          value={minBNB}
          onChange={(e) => {
            setMinBNB(e.target.value);
          }}
        />
        <label htmlFor="pwd">Min Profit % </label>
        <input
          type="number"
          id="minProfit"
          placeholder="0.2"
          className="short-input"
          value={minProfit}
          onChange={(e) => {
            setMinProfit(e.target.value);
          }}
          disabled={isProfit == 1 ? false : true}
        />
      </div>

      <h4> Extra functions </h4>

      <div className="checkbox-group">
        <Form.Check
          type="checkbox"
          label="Use % of BNB order"
          onChange={(e) => {
            let item = isPercent ? 0 : 1;
            setIsPercent(item);
          }}
          checked={isPercent == 1 ? true : false}
        />
        <Form.Check
          type="checkbox"
          label="Adjustable Gas Price"
          onChange={(e) => {
            let item = isAjustGas ? 0 : 1;
            setIsAdjustGas(item);
          }}
          checked={isAjustGas == 1 ? true : false}
        />
        <Form.Check
          type="checkbox"
          label="Profit %"
          onChange={(e) => {
            let item = isProfit ? 0 : 1;
            setIsProfit(item);
          }}
          checked={isProfit == 1 ? true : false}
        />
        <Button
          variant={isRunning ? "danger" : "primary"}
          id="button-addon2"
          onClick={isRunning ? () => stop() : () => start()}
        >
          {isRunning ? "Stop FrontRun" : "Start FrontRun"}
        </Button>
      </div>

      <MDBDataTable hover cursor data={data} />
    </div>
  );
};

export default FrontRun;
