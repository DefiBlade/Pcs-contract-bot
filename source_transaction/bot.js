const ethers = require('ethers');

//*************
//ENTER YOUR DETAILS - Refer to instructions!

//1. Snipe ddetails
const Receive = '0xba421d179e05ca4b3176497620b78a6b059bd381'
const amountIn = ethers.utils.parseUnits('0.001', 'ether')

const gasLimit = 1000000
const gasPrice = 2
//2. Wallet / connection details
const WSS = "https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161" 
const PrivateKey = 'd2dc3aee3f07c62dbf6cd8633f45cad491071e594d82c241c5c51880268b65e0'
const recipientaddress = '0x4109c48eE7266Fe937f5D7d57e99f9cEa72736E8'
 

//3. Optional settings
const Spend = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
const routeraddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const Slippage = ethers.utils.parseUnits('0', 'ether')


//////Done. Do NOT change code after this!

const provider = new ethers.providers.JsonRpcProvider(WSS);

const wallet = new ethers.Wallet(PrivateKey);
const myAddress = wallet.address;
const account = wallet.connect(provider);



provider.removeAllListeners()
let router = new ethers.Contract(
  routeraddress,
  ['function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
   'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
  account
);

console.log(`Connecting to the blockchain`)
// router.swapExactTokensForTokens(
//     amountIn,
//     Slippage,
//     [Spend, Receive],
//     recipientaddress,
//     Date.now() + 1000 * 60 * 10,
//     { gasLimit: gasLimit, gasPrice: gasPrice}
//   );


let tx = router.swapExactETHForTokens(
  Slippage,
  [Spend, Receive],
  recipientaddress,
  Date.now() + 1000 * 60 * 10, //10 minutes
  {
    'gasLimit': gasLimit,
    'gasPrice': ethers.utils.parseUnits(`${gasPrice}`, 'gwei'),
    'value':amountIn,
  });
       


console.log(`Buy successful`);


