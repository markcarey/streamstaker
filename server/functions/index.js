global.__base = __dirname + '/';
const functions = require("firebase-functions");

var staker = require(__base + 'staker');

exports.indexer = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
    return staker.indexer(context);
}); // indexer
