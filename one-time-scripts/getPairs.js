const Web3 = require("web3");
const fs = require("fs");

const tokenList = require("../uniswapDefaultTokenList.js");
const uniswapV2FactoryAbi = require("../abis/uniswapV2Factory.js");

const { WEB3_INFURA_PROJECT_ID } = process.env;

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
  eth: { Contract },
} = web3;

const SUSHI_V2_FACTORY_ABI = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";

const uniswapV2Factory = new Contract(
  uniswapV2FactoryAbi,
  SUSHI_V2_FACTORY_ABI
);

const { tokens } = tokenList;

const pairs = [];
const uniquePairs = {};

const go = () => {
  for (let i = 0; i < tokens.length; i++) {
    const tokenA = tokens[i]?.address;

    for (let j = 1; j < tokens.length + 1; j++) {
      const _tokenB = j < tokens.length ? tokens[j] : tokens[0];
      const tokenB = _tokenB?.address;

      uniswapV2Factory.methods
        .getPair(tokenA, tokenB)
        .call()
        .then((pair) => {
          if (
            pair !== "0x0000000000000000000000000000000000000000" &&
            !uniquePairs[pair]
          ) {
            uniquePairs[pair] = true;
            pairs.push({ tokenA, tokenB, pair });
          }
        })
        .catch(() => {})
        .finally(() => {
          if (i == tokens.length - 1 && j == tokens.length) {
            console.log({ pairs });

            try {
              fs.writeFileSync(
                "pairs.js",
                `module.exports = ${JSON.stringify(pairs)}`,
                "utf-8"
              );
            } catch (err) {
              console.log({ err });
            }

            console.log("dun 🥝");
          }
        });
    }
  }
};

go();
