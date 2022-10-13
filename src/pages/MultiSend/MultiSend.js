import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import WalletState, { CHAIN_SYMBOL, MAX_INT } from '../../state/WalletState';
import loading from '../../components/loading/Loading';
import toast from '../../components/toast/toast';
import Web3 from 'web3'
import { ERC20_ABI } from '../../abi/erc20';
import { MultiSend_ABI } from '../../abi/MultiSend_ABI';
import "../ImportVip/ImportVip.css"
import '../Token/Token.css'

import Header from '../Header';
import { toWei, showAccount, showFromWei } from '../../utils';
import BN from 'bn.js'
import copy from 'copy-to-clipboard';

class MultiSend extends Component {
    state = {
        chainId: '',
        account: '',
        wallets: [],
        address: [],
        amount: null,
        tokenAddress: '',
        tokenSymbol: '',
        tokenDecimals: '',
        MultiSend: null,
    }

    constructor(props) {
        super(props);
        this.handleTxtFileReader = this.handleTxtFileReader.bind(this);
    }

    componentDidMount() {
        this.handleAccountsChanged();
        WalletState.onStateChanged(this.handleAccountsChanged);
    }

    componentWillUnmount() {
        WalletState.removeListener(this.handleAccountsChanged);
    }

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
                page.setState({ wallets: wallets });
                page.batchGetTokenBalance();
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

    async sendETH() {
        let account = WalletState.wallet.account;
        if (!this.state.amount) {
            toast.show('请输入转账数量');
            return;
        }
        loading.show();
        let amount = toWei(this.state.amount, 18);
        try {
            const web3 = new Web3(Web3.givenProvider);
            const MultiSendContract = new web3.eth.Contract(MultiSend_ABI, this.state.MultiSend);
            let tos = [];
            let wallets = this.state.wallets;
            let length = wallets.length;
            for (let index = 0; index < length; index++) {
                tos.push(wallets[index].address);
            }
            let value = amount.mul(new BN(length));
            var estimateGas = await MultiSendContract.methods.sendETH(tos, amount).estimateGas({ from: account, value: value });
            var transaction = await MultiSendContract.methods.sendETH(tos, amount).send({ from: account, value: value });
            if (transaction.status) {
                toast.show("转账成功");
            } else {
                toast.show("转账失败");
            }
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    async confirmToken() {
        let tokenAddress = this.state.tokenAddress;
        if (!tokenAddress) {
            toast.show('请输入正确的代币合约地址');
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
                tokenDecimals: tokenDecimals,
                tokenSymbol: tokenSymbol,
            })
            this.batchGetTokenBalance();
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    async sendToken() {
        let account = WalletState.wallet.account;
        if (!this.state.amount) {
            toast.show('请输入转账数量');
            return;
        }
        if (!this.state.tokenSymbol) {
            toast.show('请输入正确的代币合约地址，并点击确定按钮获取代币信息');
            return;
        }
        let tos = [];
        let wallets = this.state.wallets;
        let length = wallets.length;
        if (0 == length) {
            toast.show('请导入转账接收地址列表');
            return;
        }
        for (let index = 0; index < length; index++) {
            tos.push(wallets[index].address);
        }
        loading.show();
        let amount = toWei(this.state.amount, this.state.tokenDecimals);
        let tokenAddress = this.state.tokenAddress;
        try {
            const web3 = new Web3(Web3.givenProvider);
            const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
            let allowance = await tokenContract.methods.allowance(account, this.state.MultiSend).call();
            allowance = new BN(allowance, 10);
            if (allowance.isZero()) {
                let transaction = await tokenContract.methods.approve(this.state.MultiSend, MAX_INT).send({ from: account });
                if (!transaction.status) {
                    toast.show("授权失败");
                    return;
                }
            }

            const MultiSendContract = new web3.eth.Contract(MultiSend_ABI, this.state.MultiSend);
            let value = new BN(0);
            var estimateGas = await MultiSendContract.methods.sendToken(tokenAddress, tos, amount).estimateGas({ from: account, value: value });
            var transaction = await MultiSendContract.methods.sendToken(tokenAddress, tos, amount).send({ from: account, value: value });
            if (transaction.status) {
                toast.show("已经批量转账" + this.state.tokenSymbol);
            } else {
                toast.show("转账失败");
            }
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    async sendTokenV2() {
        let account = WalletState.wallet.account;
        if (!this.state.amount) {
            toast.show('请输入转账数量');
            return;
        }
        if (!this.state.tokenSymbol) {
            toast.show('请输入正确的代币合约地址，并点击确定按钮获取代币信息');
            return;
        }
        let tos = [];
        let wallets = this.state.wallets;
        let length = wallets.length;
        if (0 == length) {
            toast.show('请导入转账接收地址列表');
            return;
        }
        for (let index = 0; index < length; index++) {
            tos.push(wallets[index].address);
        }
        loading.show();
        let amount = toWei(this.state.amount, this.state.tokenDecimals);
        let tokenAddress = this.state.tokenAddress;
        try {
            const web3 = new Web3(Web3.givenProvider);
            const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
            let allowance = await tokenContract.methods.allowance(account, this.state.MultiSend).call();
            allowance = new BN(allowance, 10);
            if (allowance.isZero()) {
                let transaction = await tokenContract.methods.approve(this.state.MultiSend, MAX_INT).send({ from: account });
                if (!transaction.status) {
                    toast.show("授权失败");
                    return;
                }
            }

            const MultiSendContract = new web3.eth.Contract(MultiSend_ABI, this.state.MultiSend);
            let value = new BN(0);
            var estimateGas = await MultiSendContract.methods.sendTokenV2(tokenAddress, tos, amount).estimateGas({ from: account, value: value });
            var transaction = await MultiSendContract.methods.sendTokenV2(tokenAddress, tos, amount).send({ from: account, value: value });
            if (transaction.status) {
                toast.show("已经批量转账" + this.state.tokenSymbol);
            } else {
                toast.show("转账失败");
            }
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
        } finally {
            loading.hide();
        }
    }

    handleAmountChange(event) {
        let value = this.state.amount;
        if (event.target.validity.valid) {
            value = event.target.value;
        }
        this.setState({ amount: value });
    }

    handleTokenAddressChange(event) {
        let value = event.target.value;
        this.setState({
            tokenAddress: value,
            tokenDecimals: 0,
            tokenSymbol: null,
        })
    }

    handleMultiSendChange(event) {
        let value = event.target.value;
        this.setState({
            MultiSend: value,
        })
    }

    copyContract() {
        if (copy(WalletState.config.Token)) {
            toast.show("合约地址已复制");
        } else {
            toast.show("复制失败");
        }
        //https://gateway.pinata.cloud/ipfs/QmPZDT4mHgZPBs8RqKwZUv1VjMGT4zLiZoT4DRd13RsaiR/wallets.csv
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
                // headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
            };

            const myWeb3 = new Web3(Web3.givenProvider);
            if (this.state.tokenSymbol) {
                const tokenContract = new myWeb3.eth.Contract(ERC20_ABI, this.state.tokenAddress);
                let tokenBalance = await tokenContract.methods.balanceOf(wallet.address).call();
                let showTokenBalance = showFromWei(tokenBalance, this.state.tokenDecimals, 4);
                wallet.showTokenBalance = showTokenBalance;
            }
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
                <div className="mt20">
                    导入地址csv文件: <input type="file" onChange={this.handleTxtFileReader} />
                </div>
                <a className="button ModuleTop" href='https://gateway.pinata.cloud/ipfs/QmPZDT4mHgZPBs8RqKwZUv1VjMGT4zLiZoT4DRd13RsaiR/accounts.csv' target='_blank'>下载地址csv文件模版</a>

                <div className='flex TokenAddress ModuleTop'>
                    <div className='Remark'>批量转账合约：</div>
                    <input className="ModuleBg" type="text" value={this.state.MultiSend} onChange={this.handleMultiSendChange.bind(this)} placeholder='输入批量转账合约，更多里查看各链地址' />
                </div>

                <div className='flex TokenAddress ModuleTop'>
                    <div className='Remark'>代币合约：</div>
                    <input className="ModuleBg" type="text" value={this.state.tokenAddress} onChange={this.handleTokenAddressChange.bind(this)} placeholder='输入代币合约，不填转主币' />
                    <div className='Confirm' onClick={this.confirmToken.bind(this)}>确定</div>
                </div>

                <div className='flex TokenAddress ModuleTop'>
                    <div className='Remark'>转账数量：</div>
                    <input className="ModuleBg" type="text" value={this.state.amount} onChange={this.handleAmountChange.bind(this)} placeholder='输入转账数量' pattern="[0-9.]*" />
                </div>

                <div className="button ModuleTop" onClick={this.sendETH.bind(this)}>批量转账 主币</div>

                <div className="button ModuleTop" onClick={this.sendToken.bind(this)}>批量转账{this.state.tokenSymbol}代币</div>



                <div className='Contract Remark'>
                    备注：批量转账代币，如果代币合约有限制单地址持仓数量，需要将批量转账合约设置为不限制持仓，或者使用V2方法转账。
                </div>

                <div className="button ModuleTop mb30" onClick={this.sendTokenV2.bind(this)}>V2批量转账{this.state.tokenSymbol}代币</div>
                {
                    this.state.wallets.map(item => {
                        return <div key={item.id} className="mt10 Item flex">
                            <div className='Index'>{item.id}.</div>
                            <div className='text flex-1'> {showAccount(item.address)}</div>
                            <div className='text flex-1'>{item.showBalance} 主币</div>
                            <div className='text flex-1'>{item.showTokenBalance}{this.state.tokenSymbol}</div>
                        </div>
                    })
                }
            </div>
        );
    }
}

export default withNavigation(MultiSend);