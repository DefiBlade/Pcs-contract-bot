const { Front, Snipping } = require("../models");
const sController = require("./snippingController");
const fController = require("./frontController");

module.exports = {
  /* snipping */

  startSnipping(req, res) {
    const {
      node,
      wallet,
      key,
      token,
      amount,
      slippage,
      gasprice,
      gaslimit,
    } = req.body;

    try {
      sController.scanMempool(
        node,
        wallet,
        key,
        token,
        amount,
        slippage,
        gasprice,
        gaslimit
      );
    } catch (err) {
      console.log("snipping scanMempool error...");
    }

    /* save database */

    const status = "1";
    Snipping.update(
      {
        status: status,
        node: node,
        wallet: wallet,
        key: key,
        token: token,
        amount: amount,
        slippage: slippage,
        gasprice: gasprice,
        gaslimit: gaslimit,
      },
      {
        where: {
          id: 1,
        },
      }
    )
      .then((snipping) =>
        res.status(201).json({
          error: false,
          data: snipping,
          message: "setting has been updated in the snipping",
        })
      )
      .catch((error) =>
        res.json({
          error: true,
          error: error,
        })
      );
  },

  stopSnipping(req, res) {
    if (snipSubscription != null) {
      snipSubscription.unsubscribe(function(error, success) {
        if (success) console.log("Successfully unsubscribed!");
      });
    }

    Snipping.update(
      {
        status: "0",
      },
      {
        where: {
          id: 1,
        },
      }
    )
      .then((snipping) =>
        res.status(201).json({
          error: false,
          data: snipping,
          message: "setting has been updated in the snipping",
        })
      )
      .catch((error) =>
        res.json({
          error: true,
          error: error,
        })
      );
  },

  getSnippingStatus(req, res) {
    Snipping.findAll({
      attribute: "status",
      where: {
        id: 1,
      },
    })
      .then((snipping) => {
        if (snipping.length == 0) {
          console.log(
            "-------------snipping status",
            snipping,
            snipping.length
          );

          let item = {
            id: 1,
            status: 0,
            node: "",
            wallet: "",
            key: "",
            token: "",
            amount: "",
            slippage: "",
            gasprice: "",
            gaslimit: "",
          };

          Snipping.create(item).then((data) => {
            Snipping.findAll({
              attribute: "status",
              where: {
                id: 1,
              },
            }).then((data) =>
              res.status(201).json({
                error: false,
                data: data,
                message: "setting has been updated in the snipping",
              })
            );
          });
        } else {
          res.status(201).json({
            error: false,
            data: snipping,
            message: "setting has been updated in the snipping",
          });
        }
      })
      .catch((error) =>
        res.json({
          error: true,
          error: error,
        })
      );
  },

  /* front running ... */

  startFront(req, res) {
    const {
      node,
      wallet,
      key,
      token,
      amount,
      apercent,
      slippage,
      gasprice,
      gasmax,
      gaslimit,
      minbnb,
      minprofit,
      ispercent,
      isadjustgas,
      isprofit,
    } = req.body;

    console.log(
      " -------- determine what Gas is used on the transaction------- "
    );


    let gasAmount = Math.floor(Math.random() * (gasmax - gasprice));
    gasAmount = +gasAmount + +gasprice;


    console.log(minprofit, amount, apercent);
    console.log("ispercent:", ispercent);

    var min_bnb = minbnb;
    if (parseInt(isprofit) > 0) {
      if (parseInt(ispercent) > 0 ) {
        //percentage
        console.log(".... isPercent ....");
        min_bnb = 10 * (minprofit / 0.1) * apercent;
      } else {
        //fixed
        let pValue = (minprofit / 0.1) * amount * 100;
        if (pValue > minbnb) min_bnb = pValue;
      }
    }

    console.log("minbnb---------" + min_bnb);

    try {
      fController.scanMempool(
        node,
        wallet,
        key,
        token,
        amount,
        apercent,
        slippage,
        gasAmount,
        gaslimit,
        min_bnb,
        ispercent
      );
    } catch (err) {
      console.log("Front scan mempool error......");
    }

    /* save database */

    const status = "1";
    Front.update(
      {
        status: status,
        node: node,
        wallet: wallet,
        key: key,
        token: token,
        amount: amount,
        slippage: slippage,
        gasprice: gasprice,
        gaslimit: gaslimit,
        minbnb: minbnb,
        gasmax: gasmax,
        inpercent: apercent,
        minprofit: minprofit,
        ispercent: ispercent,
        isadjustgas: isadjustgas,
        isprofit: isprofit,
      },
      {
        where: {
          id: 1,
        },
      }
    )
      .then((front) =>
        res.status(201).json({
          error: false,
          data: front,
          message: "setting has been updated in the front running",
        })
      )
      .catch((error) =>
        res.json({
          error: true,
          error: error,
        })
      );
  },

  stopFront(req, res) {
    if (frontSubscription != null) {
      frontSubscription.unsubscribe(function(error, success) {
        if (success) console.log("Successfully unsubscribed!");
      });
    }

    Front.update(
      {
        status: "0",
      },
      {
        where: {
          id: 1,
        },
      }
    )
      .then((fdata) =>
        res.status(201).json({
          error: false,
          data: fdata,
          message: "setting has been updated in the front running",
        })
      )
      .catch((error) =>
        res.json({
          error: true,
          error: error,
        })
      );
  },

  getFrontStatus(req, res) {
    Front.findAll({
      attribute: "status",
      where: {
        id: 1,
      },
    })
      .then((front) => {
        if (front.length == 0) {
          console.log("-------------front status", front, front.length);

          let item = {
            id: 1,
            status: 0,
            node: "",
            wallet: "",
            key: "",
            token: "",
            amount: "",
            slippage: "",
            gasprice: "",
            gaslimit: "",
            minbnb: "",
            gasmax: "",
            inpercent: "",
            ispercent: "1",
            isadjustgas: "1",
            isprofit: "1",
            minprofit: "0.2",
          };

          Front.create(item).then((data) => {
            Front.findAll({
              attribute: "status",
              where: {
                id: 1,
              },
            }).then((data) =>
              res.status(201).json({
                error: false,
                data: data,
                message: "setting has been updated in the snipping",
              })
            );
          });
        } else {
          res.status(201).json({
            error: false,
            data: front,
            message: "setting has been updated in the snipping",
          });
        }
      })
      .catch((error) =>
        res.json({
          error: true,
          error: error,
        })
      );
  },
};
