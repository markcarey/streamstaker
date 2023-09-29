var firebase = require('firebase-admin');
if (!firebase.apps.length) {
    firebase.initializeApp();
}
var db = firebase.firestore();

const express = require("express");
const api = express();

const { ethers } = require("ethers");

const factoryJSON = require(__base + 'staker/StreamStakerFactory.json');
const stakerJSON = require(__base + 'staker/StreamStaker.json');
const superJSON = require(__base + 'staker/super.json');

const fetch = require('node-fetch');

var provider = new ethers.providers.JsonRpcProvider({"url": process.env.API_URL_BASE});
var signer;

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
    "WETH": "0x4200000000000000000000000000000000000006"
};

function getWidgetJSON(to) {
    const widget = {
        "productDetails": {
            "name": `Stream Staker`,
            "description": 'Stream USDC on Base to dollar-cost-average into staked ETH (cbETH)',
            "imageURI": `https://encycolorpedia.com/emojis/water-wave.svg`,
            "image": null
        },
        "paymentDetails": {
            "defaultReceiverAddress": "",
            "paymentOptions": [
                {
                    "receiverAddress": to,
                    "superToken": {
                        "address": addr.USDCx
                    },
                    "chainId": 8453,
                    "flowRate": {
                        "amountEther": "1",
                        "period": "day"
                    }
                },
                {
                    "receiverAddress": to,
                    "superToken": {
                        "address": addr.USDCx
                    },
                    "chainId": 8453,
                    "flowRate": {
                        "amountEther": "10",
                        "period": "month"
                    }
                },
                {
                    "receiverAddress": to,
                    "superToken": {
                        "address": addr.USDCx
                    },
                    "chainId": 8453,
                    "flowRate": {
                        "amountEther": "100",
                        "period": "month"
                    }
                },
                {
                    "receiverAddress": to,
                    "superToken": {
                        "address": addr.USDCx
                    },
                    "chainId": 8453,
                    "flowRate": {
                        "amountEther": "500",
                        "period": "month"
                    }
                },
                {
                    "receiverAddress": to,
                    "superToken": {
                        "address": addr.USDCx
                    },
                    "chainId": 8453,
                    "flowRate": {
                        "amountEther": "1000",
                        "period": "month"
                    }
                },
            ]
        },
        "layout": "page",
        "theme": {
            "typography": {
                "fontFamily": "'Noto Sans', 'sans-serif'"
            },
            "palette": {
                "mode": "light",
                "primary": {
                    "main": "#1DB227"
                },
                "secondary": {
                    "main": "#fff"
                }
            },
            "shape": {
                "borderRadius": 20
            },
            "components": {
                "MuiStepIcon": {
                    "styleOverrides": {
                        "text": {
                            "fill": "#fff"
                        }
                    }
                },
                "MuiOutlinedInput": {
                    "styleOverrides": {
                        "root": {
                            "borderRadius": 10
                        }
                    }
                },
                "MuiButton": {
                    "styleOverrides": {
                        "root": {
                            "borderRadius": 10
                        }
                    }
                }
            }
        }
    };
    return widget;
}

async function stake(stakerAddress) {
    return new Promise(async (resolve, reject) => {
        const signer = new ethers.Wallet(process.env.STAKER_PRIV, provider);
        const staker = new ethers.Contract(stakerAddress, stakerJSON.abi, signer);
        await staker.stake();
        resolve(1);
    });
}

async function pinJson(widget) {
    return new Promise(async (resolve, reject) => {
        const pinataUri = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
        const headers = {
            'Content-Type': 'application/json',
            'pinata_api_key': process.env.PINATA_API_KEY,
            'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
        };
        var res = await fetch(pinataUri, { 
            method: 'POST', 
            headers: headers,
            body: JSON.stringify(widget)
        });
        var pinResult = await res.json(); 
        console.log(pinResult);
        resolve(pinResult.IpfsHash);
    });
}

function getParams(req, res, next) {
    var params;
    if (req.method === 'POST') {
      params = req.body;
    } else {
      params = req.query;
    }
    req.q = params;
    next();
}

function cors(req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      // Send response to OPTIONS requests
      res.set('Access-Control-Allow-Methods', 'GET, POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    } else {
      // Set CORS headers for the main request
      res.set('Access-Control-Allow-Origin', '*');
    }
    next();
}

api.use(cors);
api.use(getParams);

api.get("/api", async function (req, res) {
    return res.json({"what": "streamstaker.finance", "why": "tba"});
});

api.get("/api/staker", async function (req, res) {
    const owner = req.q.owner;
    
    // TODO: lookup owner's staker contract address
    const stakerRef = db.collection('stakers').doc(owner);
    const stakerDoc = await stakerRef.get();
    var to;
    if (stakerDoc.exists) {
        to = stakerDoc.data().address;
        return res.json({"address": to});
    } else {
        return res.json({"error": "no staker found for owner"});
    }
});

api.post("/api/widget", async function (req, res) {
    const owner = req.q.owner;
    
    // TODO: lookup owner's staker contract address
    const stakerRef = db.collection('stakers').doc(owner);
    const stakerDoc = await stakerRef.get();
    var to;
    if (stakerDoc.exists) {
        to = stakerDoc.data().address;
    } else {
        return res.json({"error": "no staker found for owner"});
    }

    const widget = getWidgetJSON(to);

    const cid = await pinJson(widget);

    return res.json({"from": owner, "to": to, "widgetJSON": widget, "widgetUri": `https://checkout.superfluid.finance/${cid}`});
});

module.exports.api = api;

module.exports.indexer = async function(context) {
    console.log('This will be run every 5 minutes!');
    var latestBlock = 4604727;
    // TODO: store latestBlock in firestore
    var start = latestBlock + 1;
    var end = 'latest';
    const factory = new ethers.Contract(addr.factory, factoryJSON.abi, provider);
    let created = factory.filters.StreamStakerCreated();
    let logs = await factory.queryFilter(created, start, end);
    console.log(JSON.stringify(logs));
    for (let i = 0; i < logs.length; i++) {
        const owner = logs[i].args[0];
        const clone = logs[i].args[1];
        console.log(`owner: ${owner}, clone: ${clone}`);
        const stakerRef = db.collection('stakers').doc(owner);
        const stakerDoc = await stakerRef.get();
        if (stakerDoc.exists) {
            console.log(`staker exists for ${owner}`);
        } else {
            console.log(`creating staker for ${owner}`);
            await stakerRef.set({
                "address": clone,
                "last": 0
            });
        }
    }
    return;
} // indexer

module.exports.automate = async function(context) {
    console.log('This will be run every 5 minutes!');
    return db.collection("stakers").where("last", ">=", 0)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach(async (doc) => {
                const staker = doc.data();
                const USDCx = new ethers.Contract(addr.USDCx, superJSON.abi, provider);
                const balance = await USDCx.balanceOf(staker.address);
                console.log("balance: ", balance.toString());
                if (balance >= ethers.utils.parseUnits("100", 6)) {
                    await stake(staker.address);
                    // TODO: update last
                } else {
                    console.log(`skipping: balance too low for ${staker.address}`);
                }
            });
        });
} // automate

