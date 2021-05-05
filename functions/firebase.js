const firebase = require('firebase/app');
const admin = require('firebase-admin');
require('firebase/firestore');
require('firebase/database');

var config = {
    databaseURL: `http://${process.env.VUE_APP_DATABASE_HOST}/?ns=bitcloutapi-default-rtdb`
};

if (!process.env.FIRESTORE_EMULATOR_HOST) {
    var serviceAccount = require('./bitcloutapi-firebase-adminsdk-pv3ba-e7c44b71d2.json');
    config = {
        projectId: 'bitcloutapi',
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://bitcloutapi-default-rtdb.firebaseio.com'
    };
}
const app = admin.initializeApp(config);

const _firestore = app.firestore();
const _rtdb = app.database();

const _storeApiKey = function(publicKey, key, hash) {
    return _firestore.collection('users')
        .doc(publicKey)
        .set({ key: key, postHash: hash }, { merge: true });
};

function incrementCounter(key, numShards) {
    const shardId = Math.floor(Math.random() * numShards);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const shardRef = _firestore.collection('users').doc(key).collection(`shards-${new Date(start).getTime()}`).doc(shardId.toString());
    return shardRef.set({count: admin.firestore.FieldValue.increment(1)}, {merge: true});
}

async function getCount(key) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const querySnapshot = await _firestore.collection('users').doc(key).collection(`shards-${new Date(start).getTime()}`).get();
    const documents = querySnapshot.docs;

    let count = 0;
    for (const doc of documents) {
        count += doc.get('count');
    }
    return count;
}

const _getNeededHolding = async function(key) {
    const FREE_QUOTA = 100;

    const counter = await getCount(key)
    return counter <= FREE_QUOTA ? 0.015 * 1e9 : parseFloat(counter) / 1000 * 1e9;
}

const _getUserByKey = async function(key) {
    const userDoc = await _firestore.collection('users')
        .where('key', '==', key)
        .get();
    if (userDoc.empty) {
        return null;
    }
    else {
        const results = []
        userDoc.forEach(doc => {
            results.push({
                publicKey: doc.id,
                ...doc.data()
            });
        });
        return results[0];
    }
};

const _isUserRegistered = async function(publicKey) {
    const userDoc =  await _firestore.collection('users')
        .doc(publicKey)
        .get();
    console.log(userDoc.data())
    return userDoc.exists;
}

const _logApiHit = function(key, resource) {
    incrementCounter(key, 4);
    return _firestore.collection('hits').add({
        key: key,
        resource: resource,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
   });
}

const _setCache = function(resource, value) {
    return _rtdb.ref(`cache/${resource}`).set(value);
};

const _getCache = async function(resource) {
    const cacheDoc = await _rtdb.ref(`cache/${resource}`).once('value');
    return cacheDoc.val();
};

module.exports = {
    storeApiKey: _storeApiKey,
    getUserByKey: _getUserByKey,
    isUserRegistered: _isUserRegistered,
    logApiHit: _logApiHit,
    getNeededHolding: _getNeededHolding,
    setCache: _setCache,
    getCache: _getCache
};
