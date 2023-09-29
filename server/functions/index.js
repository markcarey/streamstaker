global.__base = __dirname + '/';
const functions = require("firebase-functions");

var staker = require(__base + 'staker');

exports.indexer = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
    return staker.indexer(context);
}); // indexer

exports.automate = functions.runWith({secrets: ["STAKER_PRIV"]}).pubsub.schedule('every 5 minutes').onRun((context) => {
    return staker.automate(context);
}); // automate

exports.api = functions.https.onRequest((req, res) => {
    return staker.api(req, res);
}); // api

