const { expect } = require("chai");
const { ethers } = require("hardhat");

const networkName = hre.network.name;

require('dotenv').config();

const chain = hre.network.name;

const factoryJSON = require("../artifacts/contracts/StreamStakerFactory.sol/StreamStakerFactory.json");
const backeeJSON = require("../artifacts/contracts/StreamStaker.sol/StreamStaker.json");
const hostJSON = require("./abis/host.json");
const cfaJSON = require("./abis/cfa.json");
const superJSON = require("./abis/super.json");
const erc20JSON = require("./abis/erc20.json");