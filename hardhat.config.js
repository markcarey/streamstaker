/** @type import('hardhat/config').HardhatUserConfig */
const dot = require('dotenv').config();

require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-chai-matchers");
const { API_URL_BASE, API_URL_BASEGOERLI, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.19',
        settings: {
          evmVersion: 'paris'
        }
      },
      {
        version: '0.7.6'
      }
    ]
  },
  settings: {
    viaIR: true,
    optimizer: {
      enabled: true,
      runs: 200,
      details: {
        yulDetails: {
          optimizerSteps: "u",
        },
      },
    },
  },
  defaultNetwork: "base",
  networks: {
    hardhat: {
      accounts: [{ privateKey: `0x${PRIVATE_KEY}`, balance: "10000000000000000000000"}],
      forking: {
        url: API_URL_BASE,
        blockNumber: 4604727,
        gasPrice: 1000000000 * 10,
      },
      loggingEnabled: true,
      gasMultiplier: 10,
      gasPrice: 1000000000 * 500,
      blockGasLimit: 0x1fffffffffffff
    },
    baseGoerli: {
      url: API_URL_BASEGOERLI,
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: 1000000000 * 10,
    },
    base: {
      url: API_URL_BASE,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },
   etherscan: {
    apiKey: {
      baseGoerli: "PLACEHOLDER_STRING",
    },
    customChains: [
      {
        network: "baseGoerli",
        chainId: 84531,
        urls: {
         apiURL: "https://api-goerli.basescan.org/api",
         browserURL: "https://goerli.basescan.org"
        }
      }
    ]
  }
};

