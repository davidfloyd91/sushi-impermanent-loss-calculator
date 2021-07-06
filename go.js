const Web3 = require("web3");
const colors = require("colors");

const decimals = require("./decimals.js");
const pairs = require("./pairs.js");
const tokenAddresses = require("./tokenAddresses.js");

const erc20Abi = require("./abis/erc20.js");
const uniswapPairAbi = require("./abis/uniswapPair.js");

const { ETH_ADDRESS, WEB3_INFURA_PROJECT_ID } = process.env;

const wsUrl = `wss://mainnet.infura.io/ws/v3/${WEB3_INFURA_PROJECT_ID}`;

const {
  providers: { WebsocketProvider },
} = Web3;

const wsOptions = {
  reconnect: {
    auto: true,
    delay: 5000,
    maxAttempts: 5,
    onTimeout: false,
  },
};

const wsProvider = new WebsocketProvider(wsUrl, wsOptions);
const web3 = new Web3(wsProvider);

const {
  eth: { Contract, getBlockNumber, getTransaction },
} = web3;

const { red, yellow, green, magenta, cyan } = colors;

const colorFuncs = [red, yellow, green, magenta, cyan];

const BLOCKS_TO_CHECK = 500_000;

let currentBlockNumber = BLOCKS_TO_CHECK;
let amount0 = 0;
let amount1 = 0;
let balance0 = 0;
let balance1 = 0;
let liquidityBalance = 0;
let mintAmount0 = 0;
let mintAmount1 = 0;
let totalSupply = 0;

const go = async () => {
  for (const _pair of pairs) {
    const { pair: pairAddress, tokenA, tokenB } = _pair;

    const pairContract = new Contract(uniswapPairAbi, pairAddress);
    const tokenAContract = new Contract(erc20Abi, tokenA);
    const tokenBContract = new Contract(erc20Abi, tokenB);

    const mintEvents = await pairContract.getPastEvents("Mint", {
      fromBlock: currentBlockNumber - BLOCKS_TO_CHECK,
    });

    if (!mintEvents || !mintEvents.length) {
      console.log("nothing here boss");
      return;
    }

    let userHasPosition = false;
    const lastEventIndex = mintEvents.length - 1;
    let currentEvent = 0;

    for (const item of mintEvents) {
      const percentDone = (currentEvent / lastEventIndex) * 100;

      if (currentEvent % 5 === 0) {
        const colorIndex =
          currentEvent === 0 ? 0 : (currentEvent / 5) % colorFuncs.length;
        const colorFunc = colorFuncs[colorIndex];
        const formattedPercentDone = `${percentDone.toFixed(2)}%`;
        console.log(`${colorFunc(formattedPercentDone)}`);
      }

      const { returnValues, transactionHash } = item || {};

      const transaction = await getTransaction(transactionHash);
      const { from } = transaction || {};

      if (from === ETH_ADDRESS) {
        userHasPosition = true;
        const { amount0: _amount0, amount1: _amount1 } = returnValues || {};
        mintAmount0 = parseInt(_amount0, 10);
        mintAmount1 = parseInt(_amount1, 10);
      }

      currentEvent++;
    }

    if (userHasPosition) {
      const _liquidityBalance = await pairContract.methods
        .balanceOf(ETH_ADDRESS)
        .call();
      liquidityBalance = parseInt(_liquidityBalance, 10);

      const _balance0 = await tokenAContract.methods
        .balanceOf(pairAddress)
        .call();
      balance0 = parseInt(_balance0, 10);

      const _balance1 = await tokenBContract.methods
        .balanceOf(pairAddress)
        .call();
      balance1 = parseInt(_balance1, 10);

      const _totalSupply = await pairContract.methods.totalSupply().call();
      totalSupply = parseInt(_totalSupply, 10);

      // const amount0Decimals = decimals[tokenA];
      // const amount1Decimals = decimals[tokenB];

      amount0 =
        totalSupply > 0 ? (liquidityBalance * balance0) / totalSupply : 0;

      amount1 =
        totalSupply > 0 ? (liquidityBalance * balance1) / totalSupply : 0;

      const tokenASymbol =
        (tokenAddresses[tokenA] && tokenAddresses[tokenA].symbol) || tokenA;
      const tokenBSymbol =
        (tokenAddresses[tokenB] && tokenAddresses[tokenB].symbol) || tokenB;

      const amount0Change = amount0 - mintAmount0;

      const amount0PercentChange = (amount0Change / mintAmount0) * 100;
      const formattedAmount0PercentChange = `${amount0PercentChange.toFixed(
        2
      )}%`;

      const amount1Change = amount1 - mintAmount1;

      const amount1PercentChange = (amount1Change / mintAmount1) * 100;
      const formattedAmount1PercentChange = `${amount1PercentChange.toFixed(
        2
      )}%`;

      const theDeal = {
        [tokenASymbol]: {
          initialAmount: mintAmount0,
          currentAmount: amount0,
          change: amount0Change,
          percentChange: formattedAmount0PercentChange,
        },
        [tokenBSymbol]: {
          initialAmount: mintAmount1,
          currentAmount: amount1,
          change: amount1Change,
          percentChange: formattedAmount1PercentChange,
        },
        liquidityBalance,
      };

      console.log(theDeal);
    }
  }
};

// ===========================================
// ==== the party ============================
// ===========================================

console.log({ ETH_ADDRESS });

getBlockNumber().then(async (res) => {
  if (typeof res === "number") {
    currentBlockNumber = res;
    await go();
    process.exit(0);
  } else {
    console.log("woops couldn't make it happen");
  }
});
