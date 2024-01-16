import { API_URL, client } from "./api";

export async function resetSnippingAPI() {
  try {
    await client.post(`${API_URL}/setting/resetSnipping`);
  } catch (err) {
    console.log(err);
  }
}

export async function initSnippingAPI() {
  try {
    await client.post(`${API_URL}/setting/initSnipping`);
  } catch (err) {
    console.log(err);
  }
}

export async function resetFrontAPI() {
  try {
    await client.post(`${API_URL}/setting/resetFront`);
  } catch (err) {
    console.log(err);
  }
}

export async function initFrontAPI() {
  try {
    await client.post(`${API_URL}/setting/initFront`);
  } catch (err) {
    console.log(err);
  }
}

export async function resetAllAPI() {
  try {
    await client.post(`${API_URL}/setting/resetAll`);
  } catch (err) {
    console.log(err);
  }
}

export async function saveSettingAPI(wallet, key, contract) {
  try {
    await client.post(`${API_URL}/setting/saveSetting`, {
      wallet: wallet,
      key: key,
      contract : contract
    });
  } catch (err) {
    console.log(err);
  }
}

export async function depositAPI(amount) {
  try {
    let res = await client.post(`${API_URL}/setting/deposit`, {
      amount: amount,
    });
    return res.data.result;
  } catch (err) {
    console.log(err);
  }
}

export async function withdrawAPI() {
  try {
    let res = await client.post(`${API_URL}/setting/withdraw`);
    let data = res.data.data[0];
    return data;
  } catch (err) {
    console.log(err);
  }
}

export async function loadSettingAPI() {
  try {
    let res = await client.get(`${API_URL}/setting/loadSetting`);
    let data = res.data.data[0];
    return data;
  } catch (err) {
    console.log(err);
  }
}
