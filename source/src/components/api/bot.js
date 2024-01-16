import { errorMessage, createNotification, client } from "./api";

export async function startSnipping(node, wallet, key, token, amount, slippage, gasprice, gaslimit) {
    try {
      await client.post('bots/startSnipping', {
        node: node,
        wallet: wallet,
        key : key,
        token : token,
        amount: amount,
        slippage : slippage,
        gasprice : gasprice,
        gaslimit : gaslimit
      });
    } catch (err) {
      createNotification("error", errorMessage(err));
    }
 
}

export async function stopSnipping() {
    try {
      await client.post('bots/stopSnipping');
    } catch (err) {
      createNotification("error", errorMessage(err));
    }
}

export async function getSnippingStatus() {
  try {
    let res =  await client.get('bots/getSnippingStatus');
    let status = res.data.data[0];
    return status;
  } catch (err) {
    createNotification("error", errorMessage(err));
  }
}

export async function startFront(node, wallet, key, token, amount, apercent, slippage, gasprice, gasmax, gaslimit, minbnb, minprofit, ispercent, isadjustgas, isprofit) {
  try {
    await client.post('bots/startFront', {
      node: node,
      wallet: wallet,
      key : key,
      token : token,
      amount: amount,
      apercent : apercent,
      slippage : slippage,
      gasprice : gasprice,
      gasmax : gasmax,
      gaslimit : gaslimit,
      minbnb : minbnb,
      minprofit : minprofit,
      ispercent: ispercent,
      isadjustgas : isadjustgas,
      isprofit: isprofit
    });
  } catch (err) {
    createNotification("error", errorMessage(err));
  }

}

export async function stopFront() {
  try {
    await client.post('bots/stopFront');
  } catch (err) {
    createNotification("error", errorMessage(err));
  }
}

export async function getFrontStatus() {
try {
  let res =  await client.get('bots/getFrontStatus');
  let status = res.data.data[0];
  return status;
} catch (err) {
  createNotification("error", errorMessage(err));
}
}