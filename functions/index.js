const functions = require("firebase-functions");
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const { storeApiKey, getUserByKey, isUserRegistered, logApiHit, getNeededHolding, setCache, getCache } = require('./firebase.js');
const uuidAPIKey = require('uuid-apikey');
const app = express();

const VERIFICATION_TEXT = `Verifying my account for https://www.bitcloutapi.net`;
const DEMO_HANDLE = 'antoinedc';
const CONTACT_HANDLE = 'antoinedc';
const BILLING_HANDLE = 'antoinedc';
const BILLING_THRESHOLD = 15 / 1000;
const DEMO_POST = '227d2e5275e53145705c15055958931d44fa62f5ce71586454113948bf454bde';
const DEMO_TRANSACTION_HASH = '3JuET8bY4KirJZorWGdNusEYYMSqUAHLxzUGVcAdQBtif8zm3TnkTU';
const DEMO_PUBLIC_KEY = 'BC1YLhK4pMSExJSiLs1jQJCyNJtcKtEM3ZrWwcMctzD9DzJMvMnpGM2';
const DEMO_BLOCK_HASH = '000000000005cf983f97a56a325469775ed72c5fd5451a3573cf2461e77ac805';
const DEMO_BLOCK_HEIGHT = '15101';
const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 500;

const PUPPETEER_OPTIONS = {
    headless: true,
    args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process',
        '--proxy-bypass-list=*',
        '--deterministic-fetch'
    ],
};

const rewriterMiddleware = function(req, res, next) {
    if (req.url.indexOf('/api/') === 0) {
        req.url = req.url.substring(4);
    }
    next();
};

const authMiddleware = async function(req, res, next) {
    try {
        const apiKey = req.query.key;
        if (!apiKey)
            throw new Error('Unauthenticated request - Get an API key at https://www.bitcloutapi.net');
        
        const user = await getUserByKey(apiKey);
        const neededHolding = await getNeededHolding(apiKey);

        if (user) {
            const holdingAmount = await userHoldingAmount(user.publicKey);

            if (holdingAmount >= neededHolding || holdingAmount >= 2 * 1e9)
                next();
            else
                throw new Error(`Not holding enough! You need to hold at least ${neededHolding / 1e9} of @${BILLING_HANDLE}'s coin to use the API. More pricing info here: https://bitclout.com/posts/3edfddf9976b24d7b92116c1f5de7fb86743f1cef1fdc3b67a38cca1e680ef35`);
        }
        else
            throw new Error('Invalid API key - Get one at https://www.bitcloutapi.net');
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
};

const loggingMiddleware = function(req, res, next) {
    try {
        const apiKey = req.query.key;
        if (!apiKey)
            throw new Error('Unauthenticated request - Get an API key at https://www.bitcloutapi.net');
        
        const resource = req.route.path;
        logApiHit(apiKey, resource)

        next();
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }   
};

const getCacheResource = (resource, index) => {
    switch (resource) {
        case '/blockHeight/:height':
            return `blockHeight/${index}`;
            break;
        case '/transactions/:hash':
            return `transactions/${index}`;
            break;
        case '/posts/:hash':
            return `posts/${index}`;
            break;
        case '/transactionsByPublicKey/:key':
            return `transactionsByPublicKey/${index}`
            break;
        default:
            return null;
            break;
    }
};

// Usage:
// requests = [
//     {
//         id: ''
//         url: '',
//         body: '',
//         method: ''
//     }
// ]
const request = async function(requests) {
    try {
        // const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
        // console.log('browser launched')
        // var page = await browser.newPage();
        
        // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
        // await page.goto('https://api.bitclout.com');
        // await page.setBypassCSP(true);
        // const requestsRes = await page.evaluate(async (requests) => {
        //     var res = {};
        //     for (var i = 0; i < requests.length; i++) {
        //         var apiRes = await fetch(requests[i].url, {
        //             headers: {
        //                 'content-type': 'application/json',
        //             },
        //             body: requests[i].body,
        //             method: requests[i].method,
        //         });
        //         res[requests[i].id] = JSON.parse(await apiRes.text());
        //     }
        //     return res;
        // }, requests);
        // browser.close();
        var res = {};
        for (var i = 0; i < requests.length; i++) {
            const requestRes = await axios({
                url: requests[i].url,
                headers: {
                    'content-type': 'application/json',
                },
                data: requests[i].body,
                method: requests[i].method,
            });
            res[requests[i].id] = requestRes.data
        }
        return res;
    } catch(error) {
        console.log(error);
        return error;
    }
};

const getMempool = async function(publicKey) {
    const mempoolRequest = {
        id: 'mempool',
        url: 'https://api.bitclout.com/api/v1/transaction-info',
        body: `{"PublicKeyBase58Check":"${publicKey}", "IsMempool": true}`,
        method: 'POST'
    };
    const mempoolRes = await request([mempoolRequest]);
    return mempoolRes[mempoolRequest.id].Transactions;
};

const getTransaction = async function(hash) {
    try {
        const cache = await getCache(getCacheResource('/transactions/:hash', hash));
        var value = null;
        if (cache) {
            console.log('Getting from cache');
            return cache;
        }
        else {
            const transactionRequest = {
                id: 'tx',
                url: 'https://api.bitclout.com/api/v1/transaction-info',
                body: `{"TransactionIDBase58Check":"${hash}"}`,
                method: 'POST'
            };
            const requestRes = await request([transactionRequest]);
            if (requestRes.tx && (!requestRes[transactionRequest.id] || !requestRes[transactionRequest.id].Transactions))
                value = requestRes.tx;
            else
                value = requestRes[transactionRequest.id].Transactions[0];

            await setCache(`transactions/${hash}`, value);
            return value;
        }
    } catch(error) {
        console.log(error);
        return error;
    }
};

const getTransactionByPK = async function(key, offset, limit) {
    const cache = await getCache(getCacheResource('/transactionsByPublicKey/:key', key));
    var value = null;
    if (cache) {
        console.log('Getting from cache');
        value = cache;
    }
    else {
        const transactionRequest = {
            id: 'tx',
            url: 'https://api.bitclout.com/api/v1/transaction-info',
            body: `{"PublicKeyBase58Check":"${key}"}`,
            method: 'POST'
        };

        const requestRes = await request([transactionRequest]);
        value = requestRes[transactionRequest.id].Transactions;
        await setCache(`transactionsByPublicKey/${key}`, value);
    }

    if (!offset)
        var offset = DEFAULT_OFFSET;
    if (!limit)
        var limit = DEFAULT_LIMIT;

    var filteredValue = value.slice(offset, offset + limit);

    return filteredValue;
};

const getBlock = async function(hash, offset, limit) {
    const blockRequest = {
        id: 'block',
        url: 'https://api.bitclout.com/api/v1/block',
        body: `{"HashHex":"${hash}","FullBlock":true}`,
        method: 'POST'
    };

    const requestRes = await request([blockRequest]);

    return await getBlockByHeight(requestRes[blockRequest.id].Header.Height, offset, limit)
};

const getBlockByHeight = async function(height, offset, limit) {
    const cache = await getCache(getCacheResource('/blockHeight/:height', height));
    var value = null;
    if (cache) {
        console.log('Getting from cache');
        value = cache;
    }
    else {
        const blockHeightRequest = {
            id: 'block',
            url: 'https://api.bitclout.com/api/v1/block',
            body: `{"Height":${height},"FullBlock":true}`,
            method: 'POST'
        };

        const requestRes = await request([blockHeightRequest]);
        value = {
            Header: { ...requestRes[blockHeightRequest.id].Header },
            Transactions: { ...requestRes[blockHeightRequest.id].Transactions }
        };

        await setCache(`blockHeight/${height}`, value);
    }

    if (!offset)
        var offset = DEFAULT_OFFSET;
    if (!limit)
        var limit = DEFAULT_LIMIT;

    var filteredValue = {
        Header: value.Header,
        Transactions: Object.values(value.Transactions).slice(offset, offset + limit)
    }

    return filteredValue;
};

const getUserFollowers = async function(handle) {
    try {
        const followersRequest = {
            id: 'followers',
            url: 'https://api.bitclout.com/get-follows-stateless',
            body: `{"username":"${handle}","PublicKeyBase58Check":"","GetEntriesFollowingUsername":true,"LastPublicKeyBase58Check":"","NumToFetch":10000000000}`,
            method: 'POST'
        };

        const requestRes = await request([followersRequest]);
        const followers = requestRes[followersRequest.id].PublicKeyToProfileEntry;
        return {
            Followers: Object.values(followers)
        };
    } catch(error) {
        console.log(error)
        return error;
    }
};

const getUserFollowings = async function(handle) {
    try {
        const followingRequest = {
            id: 'following',
            url: 'https://api.bitclout.com/get-follows-stateless',
            body: `{"username":"${handle}","PublicKeyBase58Check":"","GetEntriesFollowingUsername":false,"LastPublicKeyBase58Check":"","NumToFetch":10000000000}`,
            method: 'POST'
        };

        const requestRes = await request([followingRequest]);
        const followings = requestRes[followingRequest.id].PublicKeyToProfileEntry;

        return {
            Followings: Object.values(followings)
        };
    } catch(error) {
        console.log(error)
        return error;
    }
};

const getUserPosts = async function(handle) {
    try {
        const profileRequest = {
            id: 'profile',
            url: 'https://api.bitclout.com/get-profiles',
            body: `{\"PublicKeyBase58Check\":\"\",\"Username\":\"${handle}\",\"UsernamePrefix\":\"\",\"Description\":\"\",\"OrderBy\":\"newest_last_post\",\"NumToFetch\":1,\"ReaderPublicKeyBase58Check\":\"\",\"ModerationType\":\"\",\"FetchUsersThatHODL\":true,\"AddGlobalFeedBool\":false}`,
            method: 'POST'
        };

        const batchRequestRes = await request([profileRequest, followersRequest, followingRequest]);

        const userData = batchRequestRes[profileRequest.id];
        
        if (!userData.ProfilesFound)
            return userData;

        return userData.ProfilesFound[0].Posts;
    } catch(error) {
        console.log(error)
        return error;
    }
};

const getUserByHandle = async function(handle) {
    try {
        const profileRequest = {
            id: 'profile',
            url: 'https://api.bitclout.com/get-profiles',
            body: `{\"PublicKeyBase58Check\":\"\",\"Username\":\"${handle}\",\"UsernamePrefix\":\"\",\"Description\":\"\",\"OrderBy\":\"newest_last_post\",\"NumToFetch\":1,\"ReaderPublicKeyBase58Check\":\"\",\"ModerationType\":\"\",\"FetchUsersThatHODL\":true,\"AddGlobalFeedBool\":false}`,
            method: 'POST'
        };

        const followingRequest = {
            id: 'following',
            url: 'https://api.bitclout.com/get-follows-stateless',
            body: `{"username":"${handle}","PublicKeyBase58Check":"","GetEntriesFollowingUsername":false,"LastPublicKeyBase58Check":"","NumToFetch":10000000000}`,
            method: 'POST'
        };

        const followersRequest = {
            id: 'followers',
            url: 'https://api.bitclout.com/get-follows-stateless',
            body: `{"username":"${handle}","PublicKeyBase58Check":"","GetEntriesFollowingUsername":true,"LastPublicKeyBase58Check":"","NumToFetch":10000000000}`,
            method: 'POST'
        };

        const batchRequestRes = await request([profileRequest, followersRequest, followingRequest]);

        const userData = batchRequestRes[profileRequest.id];
        const followings = batchRequestRes[followingRequest.id].PublicKeyToProfileEntry;
        const followers = batchRequestRes[followersRequest.id].PublicKeyToProfileEntry;
        
        if (!userData.ProfilesFound)
            return userData;

        return {
            ...userData.ProfilesFound[0],
            FollowersCount : Object.values(followers).length,
            FollowingsCount: Object.values(followings).length
        }
    } catch(error) {
        console.log(error)
        return error;
    }
};

const getPostByHash = async function(hash) {
    try {
        const cache = await getCache(getCacheResource('/posts/:hash', hash));

        if (cache) {
            console.log('Getting from cache');
            return cache;
        }
        else {
            const postRequest = {
                id: 'post',
                url: 'https://api.bitclout.com/get-single-post',
                body: `{\"PostHashHex\":\"${hash}\",\"ReaderPublicKeyBase58Check\":\"\",\"FetchParents\":true,\"CommentOffset\":0,\"CommentLimit\":20,\"AddGlobalFeedBool\":false}`,
                method: 'POST'
            };
            
            const postRes = await request([postRequest]);
            await setCache(`posts/${hash}`, postRes[postRequest.id].PostFound);

            return postRes[postRequest.id].PostFound;
        }
    } catch(error) {
        console.log(error)
        return error;
    }
};

const isUserHolding = async function(publicKey) {
    const profileRequest = {
        id: 'profile',
        url: 'https://api.bitclout.com/get-profiles',
        body: `{\"PublicKeyBase58Check\":\"\",\"Username\":\"${BILLING_HANDLE}\",\"UsernamePrefix\":\"\",\"Description\":\"\",\"OrderBy\":\"newest_last_post\",\"NumToFetch\":1,\"ReaderPublicKeyBase58Check\":\"\",\"ModerationType\":\"\",\"FetchUsersThatHODL\":true,\"AddGlobalFeedBool\":false}`,
        method: 'POST'
    };

    const requestsRes = await request([profileRequest]);
    const user = requestsRes[profileRequest.id].ProfilesFound[0];
    
    const holders = user.UsersThatHODL;

    for (var i = 0; i < holders.length; i++) {
        var holderKey = holders[i].HODLerPublicKeyBase58Check;
        if (holderKey == publicKey) {
            var balance = holders[i].BalanceNanos;
            if (balance >= BILLING_THRESHOLD * 1e9) {
                return true;
            }
        }
    }

    return false;
}

const userHoldingAmount = async function(publicKey) {
    const profileRequest = {
        id: 'profile',
        url: 'https://api.bitclout.com/get-profiles',
        body: `{\"PublicKeyBase58Check\":\"\",\"Username\":\"${BILLING_HANDLE}\",\"UsernamePrefix\":\"\",\"Description\":\"\",\"OrderBy\":\"newest_last_post\",\"NumToFetch\":1,\"ReaderPublicKeyBase58Check\":\"\",\"ModerationType\":\"\",\"FetchUsersThatHODL\":true,\"AddGlobalFeedBool\":false}`,
        method: 'POST'
    };
    
    const requestsRes = await request([profileRequest]);
    const user = requestsRes[profileRequest.id].ProfilesFound[0];
    const holders = user.UsersThatHODL;

    for (var i = 0; i < holders.length; i++) {
        var holderKey = holders[i].HODLerPublicKeyBase58Check;
        if (holderKey == publicKey) {
            return holders[i].BalanceNanos;
        }
    }
    return 0;
}

const getExchangeRate = async function() {
    const exchangeRateRequest = {
        id: 'exchange',
        url: 'https://api.bitclout.com/get-exchange-rate',
        method: 'GET'
    };

    const requestsRes = await request([exchangeRateRequest]);
    const rate = requestsRes[exchangeRateRequest.id];
    const usdcToBtc = (await axios.get('https://blockchain.info/ticker')).data.USD.last;
    return parseFloat(1e9 / rate.SatoshisPerBitCloutExchangeRate / usdcToBtc * 1e8);
}

app.use(rewriterMiddleware);
app.use(cors({ origin: true }));

app.get('/checkVerification/:postHash', async (req, res) => {
    try {
        var data = {};
        const postData = await getPostByHash(req.params.postHash);
        if (postData.Body.indexOf(VERIFICATION_TEXT) > -1) {
            const publicKey = postData.PosterPublicKeyBase58Check;
            
            if (!postData.ProfileEntryResponse)
                throw new Error('Could not find your profile - make sure it is not anonymous. If it isn\'t, contact @antoinedc.');

            if (await isUserRegistered(publicKey))
                throw new Error(`This account already registered a key. If you are the owner and want another key, please message @${CONTACT_HANDLE}.`);

            const isHolding = await isUserHolding(publicKey);
            if (!isHolding)
                throw new Error(`Not holding enough! You need at least ${BILLING_THRESHOLD} of @${BILLING_HANDLE}'s coin to use the API`);

            const key = uuidAPIKey.create()
            data.key = key.uuid;
            await storeApiKey(publicKey, key.uuid, req.params.postHash);
        }
        else {
            console.log(postData.Body)
            throw new Error('This post does not seem to contain the verification message.');
        }
        res.send(data);
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/exchangeRate', [authMiddleware, loggingMiddleware], async (req, res) => {
    try {
        const exchangeRate = await getExchangeRate();
        res.send({ rate: exchangeRate });
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/users/:handle', [authMiddleware, loggingMiddleware], async (req, res) => {
    try {
        const userData = await getUserByHandle(req.params.handle);
        res.send(userData)    
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/users/:handle/followers', [authMiddleware, loggingMiddleware], async (req, res) => {
    try {
        const userData = await getUserFollowers(req.params.handle);
        res.send(userData)    
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/users/:handle/followings', [authMiddleware, loggingMiddleware], async (req, res) => {
    try {
        const userData = await getUserFollowings(req.params.handle);
        res.send(userData)    
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/posts/:hash', [authMiddleware, loggingMiddleware], async (req, res) => {
    try {
        const postData = await getPostByHash(req.params.hash);
        res.send(postData);
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/transactions/:hash', [authMiddleware, loggingMiddleware], async (req, res) => {
    try {
        const txData = await getTransaction(req.params.hash);
        res.send(txData);
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/transactionsByPublicKey/:key', [authMiddleware, loggingMiddleware], async (req, res) => {
    try {
        const txData = await getTransactionByPK(req.params.key, parseInt(req.query.offset), parseInt(req.query.limit));
        res.send(txData);
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/blocks/:hash', [authMiddleware, loggingMiddleware], async (req, res) => {
    try {
        const blockData = await getBlock(req.params.hash, parseInt(req.query.offset), parseInt(req.query.limit));
        res.send(blockData);
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/blockHeight/:height', [authMiddleware, loggingMiddleware], async (req, res) => {
    try {
        const blockData = await getBlockByHeight(req.params.height, parseInt(req.query.offset), parseInt(req.query.limit));
        res.send(blockData);
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/mempool', authMiddleware, async (req, res) => {
    try {
        const mempool = await getMempool(req.params.publicKey);
        res.send(mempool);
    } catch(error) {
        res.status(401).json({
            message: error.message
        });
    }
});

app.get('/blockDemo', async (req, res) => {
    try {
        const blockData = await getBlock(DEMO_BLOCK_HASH, 0, 10);
        res.send(blockData)    
    } catch(error) {
        res.json({
            message: error.message
        });
    }
});

app.get('/transactionsPKDemo', async (req, res) => {
    try {
        const txData = await getTransactionByPK(DEMO_PUBLIC_KEY, 0, 10);
        res.send(txData)    
    } catch(error) {
        res.json({
            message: error.message
        });
    }
});

app.get('/blockHeightDemo', async (req, res) => {
    try {
        const bkData = await getBlockByHeight(DEMO_BLOCK_HEIGHT, 0, 10);
        res.send(bkData)    
    } catch(error) {
        res.json({
            message: error.message
        });
    }
});

app.get('/transactionDemo', async (req, res) => {
    try {
        const txData = await getTransaction(DEMO_TRANSACTION_HASH);
        res.send(txData)    
    } catch(error) {
        res.json({
            message: error.message
        });
    }
});

app.get('/userDemo', async (req, res) => {
    try {
        const userData = await getUserByHandle(DEMO_HANDLE);
        res.send(userData)    
    } catch(error) {
        res.json({
            message: error.message
        });
    }
});

app.get('/userFollowingsDemo', async (req, res) => {
    try {
        const userData = await getUserFollowings(DEMO_HANDLE);
        res.send(userData)    
    } catch(error) {
        res.json({
            message: error.message
        });
    }
});

app.get('/userFollowerDemo', async (req, res) => {
    try {
        const userData = await getUserFollowers(DEMO_HANDLE);
        res.send(userData)    
    } catch(error) {
        res.json({
            message: error.message
        });
    }
});

app.get('/postDemo', async (req, res) => {
    try {
        const postData = await getPostByHash(DEMO_POST);
        res.send(postData);
    } catch(error) {
        res.json({
            message: error.message
        });
    }
});

app.get('/mempoolDemo', async (req, res) => {
    try {
        const mempool = await getMempool(DEMO_PUBLIC_KEY);
        res.send(mempool[0]);
    } catch(error) {
        res.json({
            message: error.message
        });
    }
});

exports.api = functions.https.onRequest(app);
