import React, { useState, useEffect } from "react";
import { Button, FormControl } from "react-bootstrap";
import { Spinner } from "reactstrap";
import "./style/Setting.css";
import { saveSettingAPI, depositAPI, withdrawAPI, loadSettingAPI } from "./api";
import Web3 from "web3";
import CONFIG from "./constant/config";
import { abi } from "./constant/abi";

const Setting = () => {
  const wssWeb3 = new Web3(
    new Web3.providers.WebsocketProvider(CONFIG.NODE_URL)
  );

  const [wallet, setWallet] = useState("");
  const [key, setKey] = useState("");
  const [contract, setContract] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [wBalance, setWBalance] = useState("");
  const [cBalance, setCBalance] = useState("");
  const [loading, setLoading] = useState("");
  const [loading2, setLoading2] = useState("");

  const saveSetting = () => {
    saveSettingAPI(wallet, key, contract);
  };
  const deposit = async () => {
    setLoading(true);
    let result = await depositAPI(depositAmount);
    setLoading(false);
    getBalance(wallet, contract);
  };
  const withdraw = async () => {
    setLoading2(true);
    let result = await withdrawAPI();
    setLoading2(false);
    getBalance(wallet, contract);
  };

  const loadSetting = async () => {
    let data = await loadSettingAPI();
    setWallet(data.wallet);
    setKey(data.key);
    setContract(data.contract);
    await getBalance(data.wallet, data.contract);
  };

  const getBalance = async (_wallet, _contract) => {
    if (_wallet && _contract) {
      try {
      let tokenContract = new wssWeb3.eth.Contract(abi, CONFIG.WBNB);
      let wBal = await tokenContract.methods.balanceOf(_wallet).call();
      let cBal = await tokenContract.methods.balanceOf(_contract).call();
      setWBalance(Math.floor((wBal / 1e18) * 10000) / 10000);
      setCBalance(Math.floor((cBal / 1e18) * 10000) / 10000);
      }
      catch(err) {
        console.log(err);
      }
    }
  };

  useEffect(() => {
    loadSetting();
  }, []);

  return (
    <div className="row">
      <div className="col-sm-12 col-md-6 col-lg-6">
        <div className="form-group">
          <label htmlFor="usr">Wallet Address:</label>
          <FormControl
            type="text"
            id="walletAddr"
            value={wallet}
            onChange={(e) => {
              setWallet(e.target.value);
            }}
            className="form-control form-control-md"
          />
        </div>
      </div>
      <div className="col-sm-12 col-md-6 col-lg-6">
        <div className="form-group">
          <label htmlFor="usr">Private Key:</label>
          <FormControl
            type="password"
            id="privateKey"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
            }}
            className="form-control form-control-md"
          />
        </div>
      </div>
      <div className="col-sm-12 col-md-6 col-lg-6">
        <div className="form-group">
          <label htmlFor="usr">Contract Address:</label>
          <FormControl
            type="text"
            id="contractAddress"
            value={contract}
            onChange={(e) => {
              setContract(e.target.value);
            }}
            className="form-control form-control-md"
          />
        </div>
      </div>
      <div className="col-sm-12 col-md-6 col-lg-6">
        <div className="form-group">
          <label htmlFor="empty">&nbsp;</label>
          <Button
            className="save-btn"
            variant="primary"
            id="setSetting"
            onClick={() => saveSetting()}
          >
            Save
          </Button>
        </div>
      </div>
      <div className="col-sm-12 col-md-12 col-lg-12">
        <div className="form-group withdraw-wrapper">
          <label htmlFor="label">Deposit or Withdraw ?</label>
          <label htmlFor="label">Wallet Balance : {wBalance}</label>
          <div>
            <input
              type="text"
              className="form-control"
              id="depositAmount "
              value={depositAmount}
              onChange={(e) => {
                setDepositAmount(e.target.value);
              }}
            />
            <button className="btn btn-primary" onClick={() => deposit()}>
              {loading && (
                <Spinner
                  style={{ width: "1.2rem", height: "1.2rem" }}
                  color="light"
                />
              )}

              {!loading && "Deposit"}
            </button>
          </div>
          <label htmlFor="label">Contract Balance : {cBalance} </label>
          <button className="btn btn-primary" onClick={() => withdraw()}>
            {loading2 && (
              <Spinner
                style={{ width: "1.2rem", height: "1.2rem" }}
                color="light"
              />
            )}

            {!loading2 && "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setting;
