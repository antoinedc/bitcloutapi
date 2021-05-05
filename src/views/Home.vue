<template>
    <v-container class="text-center">
        <h2>Bitclout API</h2>
        <v-row>
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        This is an unofficial API that lets you fetch all sorts of info about Bitclout users just from their handles.<br>
                        You can get stats about their coin, market cap, followers...<br>
                        You can also retrieve info about a specific post, such as likes, comments, reclouts, etc...<br><br>
                        <div class="warning--text">/!\ Please note that this API can unexpectedly break if Bitclout changes their. If that happens, mention or DM <a href="https://bitclout.com/u/antoinedc" target="_blank">@antoinedc</a> and I'll do my best to fix things!</div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>User Endpoint</h3>
                        <v-row>
                            <v-col>
                                Pass any handle to retrieve a bunch of info about the user.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="5" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/users/antoinedc?key=xxx" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="5">
                                <v-btn depressed class="primary" :loading="loadingHandle" @click="submitHandle()">Try It</v-btn>
                            </v-col>
                        </v-row>
                        <div ref="responseEl"></div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>Followers Endpoint</h3>
                        <v-row>
                            <v-col>
                                Pass any handle to retrieve followers of the user.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="5" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/users/antoinedc/followers?key=xxx" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="5">
                                <v-btn depressed class="primary" :loading="loadingFollowers" @click="submitFollowers()">Try It</v-btn>
                            </v-col>
                        </v-row>
                        <div ref="responseFollowersEl"></div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>Followings Endpoint</h3>
                        <v-row>
                            <v-col>
                                Pass any handle to retrieve followings of the user.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="5" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/users/antoinedc/followings?key=xxx" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="5">
                                <v-btn depressed class="primary" :loading="loadingFollowings" @click="submitFollowings()">Try It</v-btn>
                            </v-col>
                        </v-row>
                        <div ref="responseFollowingsEl"></div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>        
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>Post Endpoint</h3>
                        <v-row>
                            <v-col>
                                Pass any post hash to retrieve a bunch of info about the post.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="9" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/posts/227d2e5275e53145705c15055958931d44fa62f5ce71586454113948bf454bde?key=xxx" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="2">
                                <v-btn depressed class="primary" :loading="loadingPost" @click="submitPost()">Try It</v-btn>
                            </v-col>
                        </v-row>
                        <div ref="responsePostEl"></div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>Transaction Endpoint</h3>
                        <v-row>
                            <v-col>
                                Pass a transaction hash to fetch details from the Bitclout Network.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="9" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/transactions/3JuET8bY4KirJZorWGdNusEYYMSqUAHLxzUGVcAdQBtif8zm3TnkTU?key=xxx" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="2">
                                <v-btn depressed class="primary" :loading="loadingTx" @click="submitTx()">Try It</v-btn>
                            </v-col>
                        </v-row>
                        <div ref="responseTxEl"></div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>        
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>Block Hash Endpoint</h3>
                        <v-row>
                            <v-col>
                                <div class="warning--text">/!\ This request can be slow and return a lot of data.</div>
                                Pass a block hash to fetch details from the Bitclout Network.<br>
                                By default, only the first 500 transactions from the block are returned (for performance reason). A <code>offset</code> and a <code>limit</code> parameters are available to paginate them.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="9" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/blocks/000000000005cf983f97a56a325469775ed72c5fd5451a3573cf2461e77ac805?key=xxx" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="2">
                                <v-btn depressed class="primary" :loading="loadingBk" @click="submitBk()">Try It</v-btn>
                            </v-col>
                        </v-row>
                        <div ref="responseBkEl"></div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>Block Height Endpoint</h3>
                        <v-row>
                            <v-col>
                                <div class="warning--text">/!\ This request can be slow and return a lot of data.</div>
                                Pass a block height to fetch details from the Bitclout Network.<br>
                                By default, only the first 500 transactions from the block are returned (for performance reason). A <code>offset</code> and a <code>limit</code> parameters are available to paginate them.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="9" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/blockHeight/15101?limit=10&key=xxx" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="2">
                                <v-btn depressed class="primary" :loading="loadingBkHeight" @click="submitBkHeight()">Try It</v-btn>
                            </v-col>
                        </v-row>
                        <div ref="responseBkHeightEl"></div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>Public Key Transactions Endpoint</h3>
                        <v-row>
                            <v-col>
                                <div class="warning--text">/!\ This request can be slow and return a lot of data.</div>
                                Pass a public key to fetch its transactions from the Bitclout Network.<br>
                                By default, only the first 500 transactions are returned (for performance reason). A <code>offset</code> and a <code>limit</code> parameters are available to paginate them.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="9" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/transactionsByPublicKey/BC1YLhK4pMSExJSiLs1jQJCyNJtcKtEM3ZrWwcMctzD9DzJMvMnpGM2?limit=10&key=xxx" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="2">
                                <v-btn depressed class="primary" :loading="loadingPKTx" @click="submitPKTx()">Try It</v-btn>
                            </v-col>
                        </v-row>
                        <div ref="responsePKTxEl"></div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>Exchange Rate Endpoint</h3>
                        <v-row>
                            <v-col>
                                This endpoint returns a JSON object containing a single <code>rate</code> key. The returned number is $1 in BitcloutNanos. So dividing <code>CoinPriceBitCloutNanos</code> by it for example can give you the price a coin in $.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="9" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/exchangeRate?key=xxx" type="text"></v-text-field>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>        
        <v-row class="text-left">
            <v-col>
                <v-card outlined>
                    <v-card-text>
                        <h3>Mempool Endpoint</h3>
                        <v-row>
                            <v-col>
                                <div class="warning--text">/!\ This request can be slow and returns a lot of data. The demo only returns the first transaction of the mempool, to avoid crashing everything.</div>
                                If you don't pass any parameter, you'll get the entire mempool. You can add a <code>publicKey</code> GET parameter to filter.<br>
                                Add a <code>key</code> GET parameter with your api key for authentication.<br>
                                If you receive a 401 check the body for the error message.
                            </v-col>
                        </v-row>
                        <v-row class="mt-0">
                            <div class="d-inline-flex pa-2 align-self-center">
                                <v-chip label small class="green white--text font-weight-bold" color="green">GET</v-chip>
                            </div>
                            <v-col cols="9" class="px-0">
                                <v-text-field disabled dense hide-details="auto" outlined placeholder="https://www.bitcloutapi.net/api/mempool/?publicKey=BC1YLhK4pMSExJSiLs1jQJCyNJtcKtEM3ZrWwcMctzD9DzJMvMnpGM2&key=xxx" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="2">
                                <v-btn depressed class="primary" :loading="loadingMempool" @click="submitMempool()">Try It</v-btn>
                            </v-col>
                        </v-row>
                        <div ref="responseMempool"></div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="text-left">
            <v-col>
                <v-card outlined class="text-left">
                    <v-card-text>
                        <h3 class="pb-3">How to get a key?</h3>
                        <ol class="pb-3">
                            <li><b>Make sure your profile is not anonymous as it won't work otherwise!</b></li>
                            <li>Check that your hold {{ billingThreshold }} of <a target="_blank" href="https://bitclout.com/u/antoinedc">@antoinedc's coin</a>. It is necessary to get the API key <b>and</b> to make requests with it, if you don't hold at least {{ billingThreshold }}, requests will fail.</li>
                            <li>With {{ billingThreshold }}, you'll get 100 requests per day. To do more, you'll need to hold 0.001 coin per requests that you need. Example: if you need 200 requests you need to hold 0.2, 400 requests? 0.4, etc...This is capped at 2 coins. If you hold 2 coins, there is no request limit.</li>
                            <li>Post <code>Verifying my account for https://www.bitcloutapi.net</code> (you can hide it) for account verification.</li>
                            <li>Enter the hash of the post (the last part of the url, after 'posts/') below.</li>
                            <li>Submit and you should get back an API key that you should append to every request as a <code>key</code> get parameter. See the examples above for how to use the API.</li>
                        </ol>
                        <v-row>
                            <v-col cols="7">
                                <v-text-field outlined dense hide-details="auto" v-model="verifPosthash" placeholder="227d2e5275e53145705c15055958931d44fa62f5ce71586454113948bf454bde" type="text"></v-text-field>
                            </v-col>
                            <v-col cols="2" class="px-0">
                                <v-btn depressed class="primary" :loading="loadingVerif" @click="submitVerif()">Submit</v-btn>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col>
                                <v-alert v-show="postVerifSuccess" type="success">{{ postVerifSuccess}} </v-alert>
                                <v-alert v-show="postVerifFail" type="error">{{ postVerifFail }}</v-alert>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row class="text-left">
            <v-col>
                <v-card outlined class="text-left">
                    <v-card-text>
                        <h3 class="pb-3">Showcase</h3>
                        <p>
                            You built an app on top of the Bitclout API? Message <a href="https://bitclout.com/u/antoinedc" target="_blank">@antoinedc</a> to showcase it here!
                        </p>
                        <ul class="pb-3">
                            <li><a href="https://www.bitcloutmarketcap.net" target="_blank">BitcloutMarketCap</a>: Stats tracker for your Bitclout account</li>
                        </ul>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
const axios = require('axios');
const JSONFormatter = require('json-formatter-js');

const ROOT_URL = process.env.VUE_APP_NODE_ENV == 'development' ? process.env.VUE_APP_HOSTING : '';
const BILLING_THRESHOLD = 15 / 1000;

export default {
    name: 'Home',
    data: () => ({
        loadingHandle: false,
        loadingPost: false,
        loadingVerif: false,
        loadingTx: false,
        loadingBk: false,
        loadingPKTx: false,
        loadingBkHeight: false,
        loadingMempool: false,
        loadingFollowers: false,
        loadingFollowings: false,
        verifPosthash: '',
        postVerifSuccess: null,
        postVerifFail: null,
        billingThreshold: BILLING_THRESHOLD
    }),
    methods: {
        submitHandle() {
            this.loadingHandle = true;
            axios.get(`${ROOT_URL}/api/userDemo`).then(res => {
                const formatter = new JSONFormatter(res.data);
                this.$refs.responseEl.appendChild(formatter.render());
            })
            .catch(res => {
                alert(res.response.data.message);
            })
            .finally(() => this.loadingHandle = false);
        },
        submitPost() {
            this.loadingPost = true;
            axios.get(`${ROOT_URL}/api/postDemo`).then(res => {
                const formatter = new JSONFormatter(res.data);
                this.$refs.responsePostEl.appendChild(formatter.render());
            })
            .catch(res => {
                alert(res.response.data.message);
            })
            .finally(() => this.loadingPost = false);
        },
        submitFollowers() {
            this.loadingFollowers = true;
            axios.get(`${ROOT_URL}/api/userFollowerDemo`).then(res => {
                const formatter = new JSONFormatter(res.data);
                this.$refs.responseFollowersEl.appendChild(formatter.render());
            })
            .catch(res => {
                alert(res.response.data.message);
            })
            .finally(() => this.loadingFollowers = false);
        },
        submitFollowings() {
            this.loadingFollowings = true;
            axios.get(`${ROOT_URL}/api/userFollowingsDemo`).then(res => {
                const formatter = new JSONFormatter(res.data);
                this.$refs.responseFollowingsEl.appendChild(formatter.render());
            })
            .catch(res => {
                alert(res.response.data.message);
            })
            .finally(() => this.loadingFollowings = false);
        },              
        submitTx() {
            this.loadingTx = true;
            axios.get(`${ROOT_URL}/api/transactionDemo`).then(res => {
                const formatter = new JSONFormatter(res.data);
                this.$refs.responseTxEl.appendChild(formatter.render());
            })
            .catch(res => {
                alert(res.response.data.message);
            })
            .finally(() => this.loadingTx = false);
        },
        submitBk() {
            this.loadingBk = true;
            axios.get(`${ROOT_URL}/api/blockDemo`).then(res => {
                const formatter = new JSONFormatter(res.data);
                this.$refs.responseBkEl.appendChild(formatter.render());
            })
            .catch(res => {
                alert(res.response.data.message);
            })
            .finally(() => this.loadingBk = false);
        },
        submitBkHeight() {
            this.loadingBkHeight = true;
            axios.get(`${ROOT_URL}/api/blockHeightDemo`).then(res => {
                const formatter = new JSONFormatter(res.data);
                this.$refs.responseBkHeightEl.appendChild(formatter.render());
            })
            .catch(res => {
                alert(res.response.data.message);
            })
            .finally(() => this.loadingBkHeight = false);
        },
        submitPKTx() {
            this.loadingPKTx = true;
            axios.get(`${ROOT_URL}/api/transactionsPKDemo`).then(res => {
                const formatter = new JSONFormatter(res.data);
                this.$refs.responsePKTxEl.appendChild(formatter.render());
            })
            .catch(res => {
                alert(res.response.data.message);
            })
            .finally(() => this.loadingPKTx = false);
        },
        submitMempool() {
            this.loadingMempool = true;
            axios.get(`${ROOT_URL}/api/mempoolDemo`).then(res => {
                const formatter = new JSONFormatter(res.data);
                this.$refs.responseMempool.appendChild(formatter.render());
            })
            .catch(res => {
                alert(res.response.data.message);
            })
            .finally(() => this.loadingMempool = false);
        },
        submitVerif() {
            this.loadingVerif = true;
            this.postVerifSuccess = null;
            this.postVerifFail = null;
            axios.get(`${ROOT_URL}/api/checkVerification/${this.verifPosthash}`).then(res => {
                this.postVerifSuccess = `Here is your api key (we won't show it again): ${res.data.key}`;
            })
            .catch(res => {
                this.postVerifFail = res.response.data.message;
            })
            .finally(() => this.loadingVerif = false);
        }
    }
}
</script>
<style>
.material-icons, .icon-text, .icon-text-caps, .icon-text-tweaked {
      vertical-align: middle;
    }
</style>