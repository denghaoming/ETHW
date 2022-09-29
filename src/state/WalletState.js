import Web3 from 'web3'
import { CHAIN_ID, CHAIN_SYMBOL, CHAIN_ERROR_TIP } from '../abi/config'
import toast from '../components/toast/toast'
class WalletState {
    wallet = {
        chainId: null,
        account: null,
        lang: "EN"
    }

    config = {
        //ETHW
        CHAIN_ID: 10001,
        RPC: 'https://mainnet.ethereumpow.org/',
        Browser: 'https://www.oklink.com/en/ethw/',
        USDT: '0x2AD7868CA212135C6119FD7AD1Ce51CFc5702892',
        WETH: '0x7Bf88d2c0e32dE92CdaF2D43CcDc23e8Edfd5990',
        MultiSend: "0x961245F31145ba6216d308CbE7548C14d2af83a9",
        SwapRouter: "0x4f381d5fF61ad1D0eC355fEd2Ac4000eA1e67854",
        SwapCheck: "0x8306096b68b8422f9BdBEEc00BFD181C33f63E6c",
        SwapCheck2: "0x3712B77abF2438BcB2BAc32A6B60D831bB8A1471",
        Tokens: ["0x7Bf88d2c0e32dE92CdaF2D43CcDc23e8Edfd5990",
            "0x5F9eE0642d58795a94eE1c2DB055254D55a2974e",
            "0x2ad7868ca212135c6119fd7ad1ce51cfc5702892",
            "0x25de68ef588cb0c2c8f3537861e828ae699cd0db",
            "0xf61eb8999f2f222f425d41da4c2ff4b6d8320c87"],
    }

    listeners = []

    constructor() {
        this.subcripeWeb3();
        this.getConfig();
    }
    //listen the wallet event
    async subcripeWeb3() {
        let page = this;
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', function (accounts) {
                page.connetWallet();
                // window.location.reload();
            });
            window.ethereum.on('chainChanged', function (chainId) {
                page.connetWallet();
                page.getConfig();
                // window.location.reload();
            });
        }
        // window.ethereum.on('connect', (connectInfo) => { });
        // window.ethereum.on('disconnect', (err) => { });
        // window.ethereum.isConnected();

        //         4001
        // The request was rejected by the user
        // -32602
        // The parameters were invalid
        // -32603
        // Internal error
    }

    async getConfig() {
        if (!Web3.givenProvider) {
            console.log("not wallet found");
        }

        var storage = window.localStorage;
        if (storage) {
            var lang = storage["lang"];
            if (lang) {
                this.wallet.lang = lang;
            }
        }
        console.log("config", this.config);
        this.notifyAll();
    }

    async connetWallet() {
        let provider = Web3.givenProvider || window.ethereum;
        console.log("provider", provider);
        if (provider) {
            Web3.givenProvider = provider;
            const web3 = new Web3(provider);
            const chainId = await web3.eth.getChainId();
            console.log(chainId);
            this.wallet.chainId = chainId;
            const accounts = await web3.eth.requestAccounts();
            console.log('accounts');
            console.log(accounts);
            this.wallet.account = accounts[0];
            this.notifyAll();
        } else {
            setTimeout(() => {
                this.connetWallet();
            }, 3000);
            // window.location.reload();
        }
    }

    changeLang(lang) {
        this.wallet.lang = lang;
        var storage = window.localStorage;
        if (storage) {
            storage["lang"] = lang;
        }
        this.notifyAll();
    }

    onStateChanged(cb) {
        this.listeners.push(cb);
    }

    removeListener(cb) {
        this.listeners = this.listeners.filter(item => item !== cb);
    }

    notifyAll() {
        for (let i = 0; i < this.listeners.length; i++) {
            const cb = this.listeners[i];
            cb();
        }
    }

}
export { CHAIN_ID, CHAIN_SYMBOL, CHAIN_ERROR_TIP };
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const MAX_INT = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
export default new WalletState();