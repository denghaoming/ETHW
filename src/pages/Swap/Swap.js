import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import WalletState, { MAX_INT, CHAIN_SYMBOL } from '../../state/WalletState';
import loading from '../../components/loading/Loading';
import toast from '../../components/toast/toast';
import Web3 from 'web3'
import { ERC20_ABI } from '../../abi/erc20';
import { SwapCheck_ABI } from '../../abi/SwapCheck_ABI';
import { SwapRouter_ABI } from '../../abi/SwapRouter_ABI';
import "../ImportVip/ImportVip.css"
import '../Token/Token.css'

import Header from '../Header';
import { showFromWei, toWei, showAccount } from '../../utils';
import BN from 'bn.js'

class Swap extends Component {
    state = {
        chainId: '',
        account: '',
        wallets: [],
        address: [],
        amountIn: null,
        tokenOut: null,
        swapRouter: WalletState.config.SwapRouter,
        approveAccount: 0,
        auto: false,
        tmpRpc: WalletState.config.RPC,
        rpcUrl: WalletState.config.RPC,
        gasMulti: 2,
        tokenInDecimals: 18,
        slige: null,
    }

    constructor(props) {
        super(props);
        this.handleFileReader = this.handleFileReader.bind(this);
        this._autoBuy = this._autoBuy.bind(this);
    }

    componentDidMount() {
        this.handleAccountsChanged();
        WalletState.onStateChanged(this.handleAccountsChanged);
    }

    componentWillUnmount() {
        WalletState.removeListener(this.handleAccountsChanged);
    }

    handleFileReader(e) {
        let page = this;
        try {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                var data = e.target.result;
                var allRows = data.split("\n");
                var wallets = [];
                var exits = {};
                var privateKeyTitle = "privateKey";
                var privateKeyIndex = 1;
                var addressTitle = "address";
                var addressIndex = 0;
                var addrs = [];
                for (let singleRow = 0; singleRow < allRows.length; singleRow++) {
                    let rowCells = allRows[singleRow].split(',');
                    if (singleRow === 0) {

                    } else {
                        // 表格内容
                        //rowCells[rowCell];
                        let address = rowCells[addressIndex].replaceAll('\"', '');
                        if (exits[address]) {
                            console.log("exits", address);
                            continue;
                        }
                        exits[address] = true;
                        let privateKey = rowCells[privateKeyIndex];
                        if (privateKey) {
                            privateKey = privateKey.replaceAll('\"', '').trim();
                        }
                        if (address && privateKey) {
                            wallets.push({ address: address, privateKey: privateKey })
                            addrs.push(address);
                        }
                    }
                };
                page.setState({ wallets: wallets, approveAccount: 0 });
                page.clearAutoCheckBuyInterval();
                page.batchGetTokenBalance();
            }
            reader.readAsText(file);
        } catch (error) {
            console.log("error", error);
            toast.show(error);
        } finally {

        }
    }

    handleAccountsChanged = () => {
        const wallet = WalletState.wallet;
        let page = this;
        page.setState({
            chainId: wallet.chainId,
            account: wallet.account
        });
    }

    async checkBuy() {
        this._checkBuy();
    }

    //检测购买滑点
    async _checkBuy() {
        let account = WalletState.wallet.account;
        if (!this.state.amountIn) {
            toast.show('请输入购买支付数量');
            return;
        }
        if (!this.state.tokenOutSymbol) {
            toast.show('请输入正确的购买代币合约地址，并点击确定按钮获取代币信息');
            return;
        }
        let tokenAddress = this.state.tokenOut;
        loading.show();
        let amountIn = toWei(this.state.amountIn, this.state.tokenInDecimals);
        try {
            const web3 = new Web3(Web3.givenProvider);
            const checkContract = new web3.eth.Contract(SwapCheck_ABI, WalletState.config.SwapCheck);
            let transaction = await checkContract.methods.checkETHSwap(this.state.swapRouter, tokenAddress, WalletState.config.Tokens).call({ from: account, value: amountIn });
            let pairOther = transaction[0];
            let calAmountOut = new BN(transaction[1], 10);
            let buyAmountOut = new BN(transaction[2], 10);
            let calSellAmount = new BN(transaction[3], 10);
            let realSellAmount = new BN(transaction[4], 10);
            //买入滑点
            let buySlige = new BN(0);
            if (!calAmountOut.isZero()) {
                buySlige = buyAmountOut.mul(new BN(10000)).div(calAmountOut);
            }
            let showBuySlide = (10000 - buySlige.toNumber()) / 100;
            //卖出滑点
            let sellSlige = new BN(0);
            if (!calSellAmount.isZero()) {
                sellSlige = realSellAmount.mul(new BN(10000)).div(calSellAmount);
            }
            let showSellSlide = (10000 - sellSlige.toNumber()) / 100;
            this.setState({
                pairOther: pairOther,
                showBuySlide: showBuySlide,
                calAmountOut: calAmountOut,
                showBuyAmount: showFromWei(buyAmountOut, this.state.tokenOutDecimals, 6),
                showCalAmount: showFromWei(calAmountOut, this.state.tokenOutDecimals, 6),
                showSellSlide: showSellSlide,
                showSellAmount: showFromWei(realSellAmount, this.state.tokenInDecimals, 6),
                showCalSellAmount: showFromWei(calSellAmount, this.state.tokenInDecimals, 6),
            })
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    handleRpcUrlChange(event) {
        let value = event.target.value;
        this.setState({
            tmpRpc: value
        })
    }

    async confirmRpcUrl() {
        this.setState({
            rpcUrl: this.state.tmpRpc
        })
    }

    handleAmountInChange(event) {
        let value = this.state.amountIn;
        if (event.target.validity.valid) {
            value = event.target.value;
        }
        this.setState({ amountIn: value });
        this.clearAutoCheckBuyInterval();
    }

    handleTokenOutChange(event) {
        let value = event.target.value;
        this.setState({
            tokenOut: value,
            tokenOutDecimals: 0,
            tokenOutSymbol: null,
        })
        this.clearAutoCheckBuyInterval();
    }

    async confirmTokenOut() {
        let tokenAddress = this.state.tokenOut;
        if (!tokenAddress) {
            toast.show('请输入兑换得到代币合约地址');
            return;
        }
        loading.show();
        try {
            const web3 = new Web3(Web3.givenProvider);
            const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
            let tokenSymbol = await tokenContract.methods.symbol().call();
            let tokenDecimals = await tokenContract.methods.decimals().call();
            tokenDecimals = parseInt(tokenDecimals);
            this.setState({
                tokenOutDecimals: tokenDecimals,
                tokenOutSymbol: tokenSymbol,
            })
            this.batchGetTokenBalance();
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    handleSligeChange(event) {
        let value = this.state.slige;
        if (event.target.validity.valid) {
            value = event.target.value;
        }
        this.setState({ slige: value });
    }

    async batchBuy(auto, e) {
        if (!this.state.amountIn) {
            toast.show('请输入兑换支付代币数量');
            return;
        }
        if (!this.state.tokenOutSymbol) {
            toast.show('请输入正确的兑换得到代币合约地址，并点击确定按钮获取代币信息');
            return;
        }
        if (!this.state.slige) {
            toast.show('请输入交易滑点');
            return;
        }
        let wallets = this.state.wallets;
        let length = wallets.length;
        if (length == 0) {
            toast.show('请导入购买钱包地址和私钥');
            return;
        }
        for (let index = 0; index < length; index++) {
            this.buy(wallets[index], auto);
        }
    }

    async buy(wallet, auto) {
        try {
            loading.show();
            let options = {
                timeout: 600000, // milliseconds,
                headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
            };

            const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl, options));
            const swapContract = new myWeb3.eth.Contract(SwapRouter_ABI, this.state.swapRouter);
            var gasPrice = await myWeb3.eth.getGasPrice();
            console.log("gasPrice", gasPrice);
            gasPrice = new BN(gasPrice, 10);
            if (auto) {
                gasPrice = gasPrice.mul(new BN(this.state.gasMulti, 10));
                console.log("gasPrice", gasPrice);
            }

            let path = [];
            let pairOther = this.state.pairOther;
            path.push(WalletState.config.WETH);
            if (pairOther != WalletState.config.WETH) {
                path.push(pairOther);
            }
            path.push(this.state.tokenOut);
            console.log('path', path);

            let amountIn = toWei(this.state.amountIn, this.state.tokenInDecimals);

            let slige = this.state.slige;
            slige = parseInt(parseFloat(slige) * 100);
            let amountOut = this.state.calAmountOut.mul(new BN(10000 - slige)).div(new BN(10000));
            //Data
            var data = swapContract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                amountOut, path, wallet.address, 1914823077
            ).encodeABI();
            console.log("data", data);

            var nonce = await myWeb3.eth.getTransactionCount(wallet.address, "pending");
            console.log("nonce", nonce);

            var gas = await swapContract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
                amountOut, path, wallet.address, 1914823077
            ).estimateGas({ from: wallet.address, value: amountIn });
            gas = new BN(gas, 10).mul(new BN(150)).div(new BN(100));
            console.log("gas", gas);

            var txParams = {
                gas: Web3.utils.toHex(gas),
                gasPrice: Web3.utils.toHex(gasPrice),
                nonce: Web3.utils.toHex(nonce),
                chainId: WalletState.config.CHAIN_ID,
                value: Web3.utils.toHex(amountIn),
                to: this.state.swapRouter,
                data: data,
                from: wallet.address,
            };

            console.log("value", Web3.utils.toHex("0"));

            var fee = new BN(gas, 10).mul(new BN(gasPrice, 10));
            console.log("fee", Web3.utils.fromWei(fee, "ether"));

            //交易签名
            let privateKey = wallet.privateKey;
            var signedTx = await myWeb3.eth.accounts.signTransaction(txParams, privateKey);
            console.log("signedTx", signedTx);
            console.log("txParams", txParams);
            let transaction = await myWeb3.eth.sendSignedTransaction(signedTx.rawTransaction);
            // 交易失败
            if (!transaction.status) {
                toast.show("购买失败");
                return;
            }
            console.log("已够买");
            toast.show("已购买");
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    _autoCheckBuyIntervel = null;
    async autoCheckThenBuy() {
        this.clearAutoCheckBuyInterval();
        if (!this.state.amountIn) {
            toast.show('请输入购买支付数量');
            return;
        }
        if (!this.state.tokenOutSymbol) {
            toast.show('请输入正确的兑换得到代币合约地址，并点击确定按钮获取代币信息');
            return;
        }
        if (!this.state.slige) {
            toast.show('请输入交易滑点');
            return;
        }
        let wallets = this.state.wallets;
        let length = wallets.length;
        if (length == 0) {
            toast.show('请导入购买钱包地址和私钥');
            return;
        }
        this.setState({ auto: true })
        this._autoCheckBuyIntervel = setInterval(() => {
            this._autoCheckBuy();
        }, 1000);
    }

    checking = false;
    async _autoCheckBuy() {
        if (this.checking) {
            return;
        }
        this.checking = true;
        try {
            let options = {
                timeout: 600000, // milliseconds,
                headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
            };

            const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl, options));
            const checkContract = new myWeb3.eth.Contract(SwapCheck_ABI, WalletState.config.SwapCheck);
            let account = WalletState.wallet.account;
            let tokenAddress = this.state.tokenOut;
            let amountIn = toWei(this.state.amountIn, this.state.tokenInDecimals);
            let transaction = await checkContract.methods.checkETHSwap(this.state.swapRouter, tokenAddress, WalletState.config.Tokens).call({ from: account, value: amountIn });
            let pairOther = transaction[0];
            let calAmountOut = new BN(transaction[1], 10);
            let buyAmountOut = new BN(transaction[2], 10);
            let calSellAmount = new BN(transaction[3], 10);
            let realSellAmount = new BN(transaction[4], 10);
            //买入滑点
            let buySlige = new BN(0);
            if (!calAmountOut.isZero()) {
                buySlige = buyAmountOut.mul(new BN(10000)).div(calAmountOut);
            }
            let showBuySlide = (10000 - buySlige.toNumber()) / 100;
            //卖出滑点
            let sellSlige = new BN(0);
            if (!calSellAmount.isZero()) {
                sellSlige = realSellAmount.mul(new BN(10000)).div(calSellAmount);
            }
            let showSellSlide = (10000 - sellSlige.toNumber()) / 100;
            this.state.pairOther = pairOther;
            this.setState({
                pairOther: pairOther,
                showBuySlide: showBuySlide,
                calAmountOut: calAmountOut,
                showBuyAmount: showFromWei(buyAmountOut, this.state.tokenOutDecimals, 6),
                showCalAmount: showFromWei(calAmountOut, this.state.tokenOutDecimals, 6),
                showSellSlide: showSellSlide,
                showSellAmount: showFromWei(realSellAmount, this.state.tokenInDecimals, 6),
                showCalSellAmount: showFromWei(calSellAmount, this.state.tokenInDecimals, 6),
            })
            this._autoBuy(calAmountOut, showBuySlide);
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            this.checking = false;
        }
    }

    clearAutoCheckBuyInterval() {
        if (this._autoCheckBuyIntervel) {
            clearInterval(this._autoCheckBuyIntervel);
            this._autoCheckBuyIntervel = null;
            this.setState({ auto: false })
        }
    }

    async _autoBuy(calAmountOut, showBuySlide) {
        if (showBuySlide > parseFloat(this.state.slige)) {
            console.log('showBuySlide', this.state.slige)
            return;
        }
        this.clearAutoCheckBuyInterval();
        this.state.calAmountOut = calAmountOut;
        this.batchBuy(true);
    }

    handleGasMultiChange(event) {
        let value = this.state.gasMulti;
        if (event.target.validity.valid) {
            value = event.target.value;
        }
        this.setState({ gasMulti: value });
    }

    //批量获取余额
    async batchGetTokenBalance() {
        setTimeout(() => {
            let wallets = this.state.wallets;
            let length = wallets.length;
            for (let index = 0; index < length; index++) {
                this.getTokenBalance(wallets[index], index);
            }
        }, 30);
    }

    //获取单个钱包余额
    async getTokenBalance(wallet, index) {
        try {
            let options = {
                timeout: 600000, // milliseconds,
                headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
            };
            const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl, options));
            let balance = await myWeb3.eth.getBalance(wallet.address);
            let showBalance = showFromWei(balance, 18, 4);
            wallet.showBalance = showBalance;
            this.setState({
                wallets: this.state.wallets,
            })
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
        }
    }

    render() {
        return (
            <div className="Token ImportVip">
                <Header></Header>
                <div className='flex TokenAddress ModuleTop'>
                    <input className="ModuleBg" type="text" value={this.state.tmpRpc} onChange={this.handleRpcUrlChange.bind(this)} placeholder='输入节点链接地址' />
                    <div className='Confirm' onClick={this.confirmRpcUrl.bind(this)}>确定</div>
                </div>
                <div className='flex TokenAddress ModuleTop'>
                    <input className="ModuleBg" type="text" value={this.state.amountIn} onChange={this.handleAmountInChange.bind(this)} pattern="[0-9.]*" placeholder='输入购买支付数量' />
                    <div className='Label'>{CHAIN_SYMBOL}</div>
                </div>
                <div className='flex TokenAddress ModuleTop'>
                    <input className="ModuleBg" type="text" value={this.state.tokenOut} onChange={this.handleTokenOutChange.bind(this)} placeholder='输入购买代币合约地址' />
                    <div className='Confirm' onClick={this.confirmTokenOut.bind(this)}>确定</div>
                </div>
                <div className='flex TokenAddress ModuleTop'>
                    <input className="ModuleBg" type="text" value={this.state.slige} onChange={this.handleSligeChange.bind(this)} pattern="[0-9.]*" placeholder='输入交易滑点' />
                    <div className='Label'>%</div>
                </div>
                <div className="button ModuleTop" onClick={this.checkBuy.bind(this)}>检测交易滑点</div>
                <div className='Contract Remark mt10'>
                    检测结果：
                </div>
                <div className='Contract Remark'>
                    买入滑点：{this.state.showBuySlide}，可买入：{this.state.showBuyAmount}{this.state.tokenOutSymbol}
                </div>
                <div className='Contract Remark'>
                    卖出滑点：{this.state.showSellSlide}，可卖得：{this.state.showSellAmount}{CHAIN_SYMBOL}
                </div>

                <div className="mt20">
                    导入钱包csv文件: <input type="file" onChange={this.handleFileReader} />
                </div>
                <div className='Tip'>自动检测购买gas倍数</div>
                <div className='flex TokenAddress'>
                    <input className="ModuleBg" type="text" value={this.state.gasMulti} onChange={this.handleGasMultiChange.bind(this)} pattern="[0-9.]*" placeholder='输入自动检测购买gas倍数' />
                </div>
                <div className="button2 ModuleTop" onClick={this.autoCheckThenBuy.bind(this)}>自动检测并购买</div>
                {this.state.auto && <div className='Contract Remark' onClick={this.clearAutoCheckBuyInterval.bind(this)}>
                    自动检测购买中...
                </div>}
                <div className="button ModuleTop mb30" onClick={this.batchBuy.bind(this, false)}>手动批量购买</div>
                {
                    this.state.wallets.map((item, index) => {
                        return <div key={index} className="mt10 Item flex">
                            <div className='Index'>{index + 1}.</div>
                            <div className='text flex-1'> {showAccount(item.address)}</div>
                            <div className='text flex-1'>{item.showBalance}{CHAIN_SYMBOL}</div>
                        </div>
                    })
                }
            </div>
        );
    }
}

export default withNavigation(Swap);