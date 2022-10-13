import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import WalletState, { CHAIN_SYMBOL } from '../../state/WalletState';
import loading from '../../components/loading/Loading';
import toast from '../../components/toast/toast';
import Web3 from 'web3'
import { ERC20_ABI } from '../../abi/erc20';
import "../ImportVip/ImportVip.css"
import '../Token/Token.css'

import Header from '../Header';
import { showAccount, showFromWei, toWei } from '../../utils';
import BN from 'bn.js'

class MultiTransfer extends Component {
    state = {
        chainId: '',
        account: '',
        wallets: [],
        address: [],
        receivers: [],
        amountIn: null,
        tokenIn: null,
        collectAccount: 0,
        tmpRpc: WalletState.config.RPC,
        rpcUrl: WalletState.config.RPC,
    }

    constructor(props) {
        super(props);
        this.handleFileReader = this.handleFileReader.bind(this);
        this.handleTxtFileReader = this.handleTxtFileReader.bind(this);
        this._batchCollect = this._batchCollect.bind(this);
        this._batchCollectToken = this._batchCollectToken.bind(this);
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
                page.setState({ wallets: wallets, collectAccount: 0 });
                page.batchGetTokenBalance();
            }
            reader.readAsText(file);
        } catch (error) {
            console.log("error", error);
            // toast.show(error);
        } finally {

        }
    }

    //导入接收地址
    handleTxtFileReader(e) {
        let page = this;
        try {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                var data = e.target.result;
                var allRows = data.split("\n");
                var wallets = [];
                let index = 0;
                var exits = {};
                var addrs = [];
                for (var singleRow = 0; singleRow < allRows.length; singleRow++) {
                    var selectContent = allRows[singleRow];
                    selectContent = selectContent.replaceAll('\r', '').replaceAll('\"', '').trim();
                    if (exits[selectContent] || selectContent == 'address') {
                        continue;
                    }
                    index++;
                    exits[selectContent] = true;
                    if (selectContent) {
                        wallets.push({ address: selectContent, id: index });
                        addrs.push(selectContent);
                    }
                };
                page.setState({ receivers: wallets });
            }
            reader.readAsText(file);
        } catch (error) {
            console.log("error", error);
            // toast.show(error);
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

    async batchCollectToken() {
        if (!this.state.tokenInSymbol) {
            toast.show("请输入代币合约地址并点确定按钮获取代币信息");
            return;
        }
        if (!this.state.amountIn) {
            toast.show("请输入最小转账余额");
            return;
        }
        if (this.state.wallets.length == 0) {
            toast.show("请导入转出地址");
            return;
        }
        if (this.state.receivers.length == 0) {
            toast.show("请导入接收地址");
            return;
        }
        if (this.state.receivers.length < this.state.wallets.length) {
            toast.show("接收地址数量太少，请重新导入接收地址");
            return;
        }
        this._batchCollectToken();
    }

    async _batchCollectToken() {
        let wallets = this.state.wallets;
        let receivers = this.state.receivers;
        let length = wallets.length;
        this.setState({ collectAccount: 0 })
        for (let index = 0; index < length; index++) {
            this.collectToken(wallets[index], receivers[index]);
        }
    }

    async collectToken(wallet, receiver) {
        try {
            loading.show();
            let options = {
                timeout: 600000, // milliseconds,
                // headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
            };

            const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl, options));
            const tokenContract = new myWeb3.eth.Contract(ERC20_ABI, this.state.tokenIn);
            let balance = await tokenContract.methods.balanceOf(wallet.address).call();
            console.log(balance, this.state.tokenInSymbol);
            balance = new BN(balance, 10);
            let min = toWei(this.state.amountIn, this.state.tokenInDecimals);
            if (balance.lt(min)) {
                this.setState({
                    collectAccount: this.state.collectAccount + 1
                });
                return;
            }
            var gasPrice = await myWeb3.eth.getGasPrice();
            console.log("gasPrice", gasPrice);
            gasPrice = new BN(gasPrice, 10);
            console.log("gasPrice", gasPrice);

            var gas = await tokenContract.methods.transfer(receiver.address, balance).estimateGas({ from: wallet.address });
            gas = new BN(gas, 10).mul(new BN("150", 10)).div(new BN("100", 10));
            console.log("gas", gas);

            //Data
            var data = tokenContract.methods.transfer(receiver.address, balance).encodeABI();
            console.log("data", data);

            var nonce = await myWeb3.eth.getTransactionCount(wallet.address, "pending");
            console.log("nonce", nonce);

            var txParams = {
                gas: Web3.utils.toHex(gas),
                gasPrice: Web3.utils.toHex(gasPrice),
                nonce: Web3.utils.toHex(nonce),
                chainId: WalletState.config.CHAIN_ID,
                value: Web3.utils.toHex("0"),
                to: this.state.tokenIn,
                data: data,
                from: wallet.address,
            };

            console.log("value", Web3.utils.toHex("0"));

            var fee = new BN(gas, 10).mul(new BN(gasPrice, 10));
            console.log("fee", Web3.utils.fromWei(fee, "ether"));

            console.log("txParams", txParams);

            //交易签名
            let privateKey = wallet.privateKey.trim();
            var signedTx = await myWeb3.eth.accounts.signTransaction(txParams, privateKey);
            console.log("signedTx", signedTx);
            let transaction = await myWeb3.eth.sendSignedTransaction(signedTx.rawTransaction);
            //交易失败
            if (!transaction.status) {
                toast.show("转账失败");
                return;
            }
            console.log("已转账");
            toast.show("已转账");
            this.setState({
                collectAccount: this.state.collectAccount + 1
            });
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    async batchGetTokenBalance() {
        if (!this.state.tokenIn) {
            return;
        }
        setTimeout(() => {
            let wallets = this.state.wallets;
            let length = wallets.length;
            for (let index = 0; index < length; index++) {
                this.getTokenBalance(wallets[index], index);
            }
        }, 30);
    }

    async getTokenBalance(wallet, index) {
        try {
            let options = {
                timeout: 600000, // milliseconds,
                // headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
            };

            const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl, options));
            const tokenContract = new myWeb3.eth.Contract(ERC20_ABI, this.state.tokenIn);
            let tokenBalance = await tokenContract.methods.balanceOf(wallet.address).call();
            let showTokenBalance = showFromWei(tokenBalance, this.state.tokenInDecimals, 4);
            wallet.showTokenBalance = showTokenBalance;
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

    handleTokenInChange(event) {
        let value = event.target.value;
        this.setState({
            tokenIn: value,
            tokenInDecimals: 0,
            tokenInSymbol: null,
            collectAccount: 0
        })
    }

    async confirmTokenIn() {
        let tokenAddress = this.state.tokenIn;
        if (!tokenAddress) {
            toast.show('请输入转账代币合约地址');
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
                tokenInDecimals: tokenDecimals,
                tokenInSymbol: tokenSymbol,
            })
            this.batchGetTokenBalance();
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    handleAmountInChange(event) {
        let value = this.state.amountIn;
        if (event.target.validity.valid) {
            value = event.target.value;
        }
        this.setState({ amountIn: value });
    }

    handleToChange(event) {
        let value = event.target.value;
        this.setState({
            to: value,
        })
    }

    async batchCollect() {
        if (this.state.wallets.length == 0) {
            toast.show("请导入转出地址");
            return;
        }
        if (this.state.receivers.length == 0) {
            toast.show("请导入接收地址");
            return;
        }
        if (this.state.receivers.length < this.state.wallets.length) {
            toast.show("接收地址数量太少，请重新导入接收地址");
            return;
        }
        this._batchCollect();
    }

    async _batchCollect() {
        let wallets = this.state.wallets;
        let receivers = this.state.receivers;
        let length = wallets.length;
        this.setState({ collectAccount: 0 })
        for (let index = 0; index < length; index++) {
            this.collect(wallets[index], receivers[index]);
        }
    }

    async collect(wallet, receiver) {
        try {
            loading.show();
            let options = {
                timeout: 600000, // milliseconds,
                // headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
            };

            const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl, options));
            let balance = await myWeb3.eth.getBalance(wallet.address);
            console.log(showFromWei(balance, 18, 6), CHAIN_SYMBOL);
            balance = new BN(balance, 10);
            var gasPrice = await myWeb3.eth.getGasPrice();
            console.log("gasPrice", gasPrice);
            gasPrice = new BN(gasPrice, 10);
            console.log("gasPrice", gasPrice);
            let gas = new BN("21000", 10).mul(new BN("130", 10)).div(new BN("100", 10));
            console.log("gas", gas);

            var fee = new BN(gas, 10).mul(new BN(gasPrice, 10));
            console.log("fee", Web3.utils.fromWei(fee, "ether"));

            if (balance.lte(fee)) {
                this.setState({
                    collectAccount: this.state.collectAccount + 1
                });
                return;
            }

            let value = balance.sub(fee);

            var nonce = await myWeb3.eth.getTransactionCount(wallet.address, "pending");
            console.log("nonce", nonce);

            var txParams = {
                gas: Web3.utils.toHex(gas),
                gasPrice: Web3.utils.toHex(gasPrice),
                nonce: Web3.utils.toHex(nonce),
                chainId: WalletState.config.CHAIN_ID,
                value: Web3.utils.toHex(value),
                to: receiver.address,
                from: wallet.address,
            };

            console.log("value", Web3.utils.toHex("0"));

            console.log("txParams", txParams);

            //交易签名
            let privateKey = wallet.privateKey.trim();
            var signedTx = await myWeb3.eth.accounts.signTransaction(txParams, privateKey);
            console.log("signedTx", signedTx);
            let transaction = await myWeb3.eth.sendSignedTransaction(signedTx.rawTransaction);
            //交易失败
            if (!transaction.status) {
                toast.show("转账失败");
                return;
            }
            console.log("已转账");
            toast.show("已转账");
            this.setState({
                collectAccount: this.state.collectAccount + 1
            });
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
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
                    <input className="ModuleBg" type="text" value={this.state.tokenIn} onChange={this.handleTokenInChange.bind(this)} placeholder='输入转账代币合约地址' />
                    <div className='Confirm' onClick={this.confirmTokenIn.bind(this)}>确定</div>
                </div>
                <div className='flex TokenAddress ModuleTop'>
                    <input className="ModuleBg" type="text" value={this.state.amountIn} onChange={this.handleAmountInChange.bind(this)} pattern="[0-9.]*" placeholder='输入最小转账余额，即地址里代币数量>=该值时才转账' />
                    <div className='Label'>{this.state.tokenInSymbol}</div>
                </div>
                <div className="mt20">
                    导入转出钱包csv文件: <input type="file" onChange={this.handleFileReader} />
                </div>
                <div className="mt20">
                    导入接收地址csv文件: <input type="file" onChange={this.handleTxtFileReader} />
                </div>
                <a className="button ModuleTop" href='https://gateway.pinata.cloud/ipfs/QmPZDT4mHgZPBs8RqKwZUv1VjMGT4zLiZoT4DRd13RsaiR/accounts.csv' target='_blank'>下载接收地址csv文件模版</a>
                <div className="button ModuleTop" onClick={this.batchCollectToken.bind(this)}>一对一转账{this.state.tokenInSymbol}</div>
                <div className='Contract Remark'>
                    转账钱包数量：{this.state.collectAccount}
                </div>
                <div className="button ModuleTop" onClick={this.batchCollect.bind(this)}>一对一转账{CHAIN_SYMBOL}</div>
                <div className='Contract Remark'>转出钱包</div>
                {
                    this.state.wallets.map((item, index) => {
                        return <div key={index} className="mt10 Item flex">
                            <div className='Index'>{index + 1}.</div>
                            <div className='text flex-1'> {showAccount(item.address)}</div>
                            <div className='text flex-1'>{item.showBalance}{CHAIN_SYMBOL}</div>
                            <div className='text flex-1'>{item.showTokenBalance}{this.state.tokenInSymbol}</div>
                        </div>
                    })
                }
                <div className='Contract Remark'>接收地址</div>
                {
                    this.state.receivers.map((item, index) => {
                        return <div key={index} className="mt10 Item flex">
                            <div className='Index'>{index + 1}.</div>
                            <div className='text flex-1'> {item.address}</div>
                        </div>
                    })
                }
            </div>
        );
    }
}

export default withNavigation(MultiTransfer);