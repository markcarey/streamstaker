const { expect } = require("chai");
const { ethers } = require("hardhat");

const networkName = hre.network.name;

require('dotenv').config();

const chain = hre.network.name;
console.log("chain: ", chain);

const factoryJSON = require("../artifacts/contracts/StreamStakerFactory.sol/StreamStakerFactory.json");
const streamStakerJSON = require("../artifacts/contracts/StreamStaker.sol/StreamStaker.json");
const hostJSON = require("./abis/host.json");
const cfaJSON = require("./abis/cfa.json");
const superJSON = require("./abis/super.json");
const erc20JSON = require("./abis/erc20.json");

var addr = {
    "factory": "",
    "implementation": "",
    "streamStaker": "",
    "host": "0x4C073B3baB6d8826b8C5b229f3cfdC1eC6E47E74",
    "cfa": "0x19ba78B9cDB05A877718841c574325fdB53601bb",
    "USDbC": "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    "USDbCx": "0x4dB26C973FaE52f43Bd96A8776C2bf1b0DC29556",
    "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "USDCx": "0xD04383398dD2426297da660F9CCA3d439AF9ce1b",
    "cbETH": "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    "WETH": "0x4200000000000000000000000000000000000006",
};

const signer = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
const USDbC = new ethers.Contract(addr.USDbC, erc20JSON.abi, signer);
const USDbCx = new ethers.Contract(addr.USDbCx, superJSON.abi, signer);
const USDC = new ethers.Contract(addr.USDC, erc20JSON.abi, signer);
const USDCx = new ethers.Contract(addr.USDCx, superJSON.abi, signer);
const cbETH = new ethers.Contract(addr.cbETH, erc20JSON.abi, signer);
const WETH = new ethers.Contract(addr.WETH, erc20JSON.abi, signer);
const host = new ethers.Contract(addr.host, hostJSON.abi, signer);
const cfa = new ethers.Contract(addr.cfa, cfaJSON.abi, signer);
var factory, streamStaker;

describe("StreamStakerFactory", function () {

    it("should deploy the streamStaker implementation contract", async function() {
        const StreamStaker = await ethers.getContractFactory("StreamStaker");
        const implementation = await StreamStaker.deploy();
        addr.implementation = implementation.address;
        expect(addr.implementation).to.not.equal("");
    });

    it("should deploy the factory contract", async function() {
        const Factory = await ethers.getContractFactory("StreamStakerFactory");
        factory = await Factory.deploy(addr.implementation);
        addr.factory = factory.address;
        expect(addr.factory).to.not.equal("");
    });

    it("should deploy a streamStaker contract", async function() {
        const txn = await factory.create();
        const { events } = await txn.wait();
        const cloneEvent = events.find(x => x.event === "StreamStakerCreated");
        console.log("cloneEvent: ", cloneEvent);
        addr.streamStaker = cloneEvent.args[1];
        expect(addr.streamStaker).to.not.equal("");
    });

});

describe("Superfluid", function () {

    it("should get some USDCx tokens for testing", async function() {
        if ( chain != "localhost") {
            this.skip();
        } else {
            const eoa = "0xF417ACe7b13c0ef4fcb5548390a450A4B75D3eB3";
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [eoa],
            });
            const whaleSigner = await ethers.getSigner(eoa);
            let contract = new ethers.Contract(
                addr.USDCx,
                superJSON.abi,
                whaleSigner
            );
            var bal = await contract.balanceOf(eoa);
            console.log("USDCx balance: ", bal.toString());
            await contract.transfer(process.env.PUBLIC_KEY, "125000000000000000000");
            await hre.network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [eoa],
            });
            var myBal = await contract.balanceOf(process.env.PUBLIC_KEY);
            console.log("USDCx MY balance: ", myBal.toString());
            expect(myBal).to.be.gt(0);
        }
    });

    it("should start streaming to the streamStaker contract", async function() {
        const flowRate = "3805175038051"; // 10 USDCx per month
        let iface = new ethers.utils.Interface(cfaJSON.abi);
        await host.callAgreement(
            addr.cfa,
            iface.encodeFunctionData("createFlow", [
                addr.USDCx,
                addr.streamStaker,
                flowRate,
                "0x"
            ]),
            "0x"
        );
        var flow = await cfa.getFlow(addr.USDCx, process.env.PUBLIC_KEY, addr.streamStaker);
        console.log("flow b4: ", flow);
        const chainTime = Math.floor(Date.now() / 1000) + 3600;  // 1 hour from now
        let DAY = 1000 * 60 * 60 * 24;
        let WEEK = 60 * 60 * 24 * 7;
        let MONTH = 60 * 60 * 24 * 30;
        var getNow = await host.getNow();
        console.log("getNow: ", getNow.toString());
        await hre.network.provider.request({
            method: "evm_increaseTime",
            params: [MONTH]
        });
        await hre.network.provider.send("evm_mine");
        getNow = await host.getNow();
        console.log("getNow: ", getNow.toString());
        flow = await cfa.getFlow(addr.USDCx, process.env.PUBLIC_KEY, addr.streamStaker);
        console.log("flow after: ", flow);
        const balance = await USDCx.balanceOf(addr.streamStaker);
        console.log("USDCx balance: ", balance.toString());
        console.log("addr.streamStaker", addr.streamStaker);
        var sRealtimeBal = await USDCx.realtimeBalanceOfNow(addr.streamStaker);
        console.log("sRealtimeBal: ", sRealtimeBal.toString());
        expect(balance).to.be.gt(0);
    });

    it("should swap to cbETH", async function() {
        const balance = await USDCx.balanceOf(addr.streamStaker);
        console.log("USDCx balance: ", balance.toString());
        streamStaker = new ethers.Contract(addr.streamStaker, streamStakerJSON.abi, signer);
        await expect(streamStaker.stake())
            .to.emit(streamStaker, 'Staked');
    });

    it("should swap to cbETH AGAIN", async function() {
        let MONTH = 60 * 60 * 24 * 30;
        await hre.network.provider.request({
            method: "evm_increaseTime",
            params: [MONTH]
        });
        await hre.network.provider.send("evm_mine");
        const balance = await USDCx.balanceOf(addr.streamStaker);
        console.log("USDCx balance: ", balance.toString());
        streamStaker = new ethers.Contract(addr.streamStaker, streamStakerJSON.abi, signer);
        await expect(streamStaker.stake())
            .to.emit(streamStaker, 'Staked');
    });

    it("should have a cbETH balance", async function() {
        const balance = await cbETH.balanceOf(process.env.PUBLIC_KEY);
        console.log("cbETH balance: ", balance.toString());
        expect(balance).to.be.gt(0);
    });

    it("should have collected fees", async function() {
        const balance = await USDC.balanceOf(process.env.PUBLIC_KEY);
        console.log("USDC balance: ", balance.toString());
        const owner = await streamStaker.owner();
        if (owner == process.env.PUBLIC_KEY) {
            expect(balance).to.equal(0);
        } else {
            expect(balance).to.be.gt(0);
        }
    });

});

