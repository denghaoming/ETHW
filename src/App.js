import React, { Component } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

import WalletState, { CHAIN_ID, CHAIN_ERROR_TIP } from './state/WalletState'
import toast from './components/toast/toast'
import "./common.css"
import './App.css'
import CreateWallet from './pages/createwallet/CreateWallet'
import MultiSend from './pages/MultiSend/MultiSend'
import Tabs from './Tabs'
import More from './pages/More/More'
import Swap from './pages/Swap/Swap'
import Collect from './pages/Collect/Collect'
import MultiTransfer from './pages/MultiTransfer/MultiTransfer'
import OrderSwap from './pages/OrderSwap/OrderSwap'
import CopyTx from './pages/CopyTx/CopyTx'
import FindPairs from './pages/FindPairs/FindPairs'
import KillCat from './pages/KillCat/KillCat'
import Speed from './pages/Speed/Speed'
import ScanWETH from './pages/ScanWETH/ScanWETH'
import FindV3Pairs from './pages/FindV3Pairs/FindV3Pairs'
import OpBNBFindPairs from './pages/OpBNBFindPairs/OpBNBFindPairs'
import FindV2Pairs from './pages/FindV2Pairs/FindV2Pairs'
import ScanTransfer from './pages/ScanTransfer/ScanTransfer'
import ScanNewC from './pages/ScanNewC/ScanNewC'


class App extends Component {
    state = { account: null, chainId: null, shortAccount: null }

    constructor(props) {
        super(props);
        this.connetWallet = this.connetWallet.bind(this);
    }

    componentDidMount() {
        WalletState.onStateChanged(this.handleAccountsChanged);
        WalletState.connetWallet();
        this.saveRef();
    }

    //保存链接里的邀请人在浏览器的缓存中,单页面应用，应用入口组件处调用
    saveRef() {
        var url = window.location.href;
        var obj = new Object();
        var scan_url = url.split("?");
        if (2 == scan_url.length) {
            scan_url = scan_url[1];
            var strs = scan_url.split("&");
            for (var x in strs) {
                var arr = strs[x].split("=");
                obj[arr[0]] = arr[1];
                //邀请人保存在浏览器的 localStorage 里
                if ("ref" == arr[0] && arr[1]) {
                    var storage = window.localStorage;
                    if (storage) {
                        storage["ref"] = arr[1];
                    }
                }
            }
        }
        return obj;
    }

    componentWillUnmount() {
        WalletState.removeListener(this.handleAccountsChanged)
    }

    connetWallet() {
        WalletState.connetWallet();
    }

    handleAccountsChanged = () => {
        const wallet = WalletState.wallet;
        if (wallet.chainId && wallet.chainId != CHAIN_ID) {
            toast.show(CHAIN_ERROR_TIP);
            return;
        }
        let page = this;
        page.setState({
            account: wallet.account,
            chainId: wallet.chainId
        });
    }

    render() {
        return (
            <Router>
                <div>
                    <div className="content">
                        <Routes>
                            <Route path="/" exact element={<Swap />}></Route>
                            <Route path="/buy" exact element={<Swap />}></Route>
                            <Route path="/orderSwap" exact element={<OrderSwap />}></Route>
                            <Route path="/multiSend" exact element={<MultiSend />}></Route>
                            <Route path="/createWallets" exact element={<CreateWallet />}></Route>
                            <Route path="/more" exact element={<More />}></Route>
                            <Route path="/collect" exact element={<Collect />}></Route>
                            <Route path="/multiTransfer" exact element={<MultiTransfer />}></Route>
                            <Route path="/copyTx" exact element={<CopyTx />}></Route>
                            <Route path="/killCat" exact element={<KillCat />}></Route>
                            <Route path="/speed" exact element={<Speed />}></Route>
                            <Route path="/findPairs" exact element={<FindPairs />}></Route>
                            <Route path="/findV3Pairs" exact element={<FindV3Pairs />}></Route>
                            <Route path="/scanWETH" exact element={<ScanWETH />}></Route>
                            <Route path="/opBNBPairs" exact element={<OpBNBFindPairs />}></Route>
                            <Route path="/findV2Pairs" exact element={<FindV2Pairs />}></Route>
                            <Route path="/ScanTransfer" exact element={<ScanTransfer />}></Route>
                            <Route path="/ScanNewC" exact element={<ScanNewC />}></Route>
                        </Routes>
                    </div>
                    <Tabs></Tabs>
                </div>
            </Router>
        );
    }
}

export default App;