const { expect } = require("chai");
const { ethers } = require("hardhat");

const networkName = hre.network.name;

require('dotenv').config();

const chain = hre.network.name;

const factoryJSON = require("../artifacts/contracts/StreamStakerFactory.sol/StreamStakerFactory.json");
const streamStakerJSON = require("../artifacts/contracts/StreamStaker.sol/StreamStaker.json");
const hostJSON = require("./abis/host.json");
const cfaJSON = require("./abis/cfa.json");
const superJSON = require("./abis/super.json");
const erc20JSON = require("./abis/erc20.json");

var addr = {
    "factory": "",
    "streamStaker": "",
    "host": "0x4C073B3baB6d8826b8C5b229f3cfdC1eC6E47E74",
    "cfa": "0x19ba78B9cDB05A877718841c574325fdB53601bb",
    "USDbC": "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    "USDbCx": "0x4dB26C973FaE52f43Bd96A8776C2bf1b0DC29556",
    "cbETH": "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
};

const signer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
const USDbC = new ethers.Contract(addr.USDbC, erc20JSON.abi, signer);
const USDbCx = new ethers.Contract(addr.USDbCx, superJSON.abi, signer);
const cbETH = new ethers.Contract(addr.cbETH, erc20JSON.abi, signer);
const host = new ethers.Contract(addr.host, hostJSON.abi, signer);
const cfa = new ethers.Contract(addr.cfa, cfaJSON.abi, signer);
var factory, streamStaker;

describe("StreamStakerFactory", function () {

});