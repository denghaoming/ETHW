import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import WalletState, { MAX_INT, CHAIN_SYMBOL } from '../../state/WalletState';
import loading from '../../components/loading/Loading';
import toast from '../../components/toast/toast';
import Web3 from 'web3'
import "../ImportVip/ImportVip.css"
import '../Token/Token.css'

import Header from '../Header';
import { showAccount, showFromWei, toWei } from '../../utils';
import BN from 'bn.js'

class CopyTx extends Component {
    state = {
        chainId: '',
        account: '',
        wallets: [],
        address: [],
        rpcUrl: WalletState.config.RPC,
        //调用的合约地址
        to: null,
        //调用合约要传的数据
        inputdata: null,
        //调用合约要转账的主币数量
        value: null,
        //gas倍数，默认1倍
        gasMulti: null,
        collectAccount: 0,
    }

    constructor(props) {
        super(props);
        this.handleFileReader = this.handleFileReader.bind(this);
        this._batchCopyTx = this._batchCopyTx.bind(this);
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

    handleAccountsChanged = () => {
        const wallet = WalletState.wallet;
        let page = this;
        page.setState({
            chainId: wallet.chainId,
            account: wallet.account
        });
    }

    async batchCopyTx() {
        if (!this.state.to) {
            toast.show("请输入合约地址");
            return;
        }
        if (!this.state.inputdata) {
            toast.show("请输入inputdata");
            return;
        }
        this._batchCopyTx();
    }

    async _batchCopyTx() {
        let wallets = this.state.wallets;
        let length = wallets.length;
        this.setState({ collectAccount: 0 })
        for (let index = 0; index < length; index++) {
            this.copyTx(wallets[index]);
        }
    }

    async copyTx(wallet) {
        try {
            loading.show();
            let options = {
                timeout: 600000, // milliseconds,
                //headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
            };
            if (this.state.chainId == 10001 || this.state.chainId == 2000) {
                options = {
                    timeout: 600000, // milliseconds,
                    headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
                };
            }

            // const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl, options));
            const myWeb3 = new Web3(Web3.givenProvider);
            var gasPrice = await myWeb3.eth.getGasPrice();
            //var gasPrice = '1000000000';
            console.log('gasPrice', gasPrice);
            gasPrice = new BN(gasPrice, 10);
            //gas倍数
            let gasMulti = this.state.gasMulti;
            if (!gasMulti) {
                gasMulti = 1;
            }
            gasMulti = parseFloat(gasMulti);
            gasMulti = parseInt(gasMulti * 100);
            gasPrice = gasPrice.mul(new BN(gasMulti)).div(new BN(100));

            let to = this.state.to;
            let data = this.state.inputdata;
            let value = this.state.value;
            if (!value) {
                value = '0';
            }
            value = toWei(value, 18);

            var gas = await myWeb3.eth.estimateGas({
                from: wallet.address,
                to: to,
                data: data,
                value: Web3.utils.toHex(value),
            });
            console.log('gas', gas);
            gas = new BN(gas, 10).mul(new BN(110)).div(new BN(100));

            var nonce = await myWeb3.eth.getTransactionCount(wallet.address, "pending");
            console.log("nonce", nonce);

            var txParams = {
                gas: Web3.utils.toHex(gas),
                gasPrice: Web3.utils.toHex(gasPrice),
                nonce: Web3.utils.toHex(nonce),
                chainId: this.state.chainId,
                value: Web3.utils.toHex(value),
                to: to,
                data: data,
                from: wallet.address,
            };

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
                toast.show("调用失败");
                return;
            }
            console.log("交易成功");
            toast.show("交易成功");
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
                // // headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
            };
            if (this.state.chainId == 10001 || this.state.chainId == 2000) {
                options = {
                    timeout: 600000, // milliseconds,
                    headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
                };
            }

            // const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl, options));
            const myWeb3 = new Web3(Web3.givenProvider);
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
            rpcUrl: value
        })
    }

    handleChainIdChange(event) {
        let value = event.target.value;
        this.setState({
            chainId: value
        })
    }

    handleToChange(event) {
        let value = event.target.value;
        this.setState({
            to: value,
        })
    }

    handleInputdataChange(event) {
        let value = event.target.value;
        this.setState({ inputdata: value });
    }

    handleValueChange(event) {
        let value = this.state.value;
        if (event.target.validity.valid) {
            value = event.target.value;
        }
        this.setState({ value: value });
    }

    handleGasMultiChange(event) {
        let value = this.state.gasMulti;
        if (event.target.validity.valid) {
            value = event.target.value;
        }
        this.setState({ gasMulti: value });
    }

    render() {
        return (
            <div className="Token ImportVip">
                <Header></Header>
                <div className='flex TokenAddress ModuleTop'>
                    <div className='Remark'>RPC：</div>
                    <input className="ModuleBg" type="text" value={this.state.rpcUrl} onChange={this.handleRpcUrlChange.bind(this)} placeholder='输入节点链接地址' />
                </div>

                <div className='flex TokenAddress ModuleTop'>
                    <div className='Remark'>chainID：</div>
                    <input className="ModuleBg" type="text" value={this.state.chainId} onChange={this.handleChainIdChange.bind(this)} placeholder='输入链ID' />
                </div>

                <div className='flex TokenAddress ModuleTop'>
                    <div className='Remark'>合约地址：</div>
                    <input className="ModuleBg" type="text" value={this.state.to} onChange={this.handleToChange.bind(this)} placeholder='输入合约地址' />
                </div>

                <div className='flex TokenAddress ModuleTop'>
                    <div className='Remark'>调用数据：</div>
                    <input className="ModuleBg" type="text" value={this.state.inputdata} onChange={this.handleInputdataChange.bind(this)} placeholder='输入inputdata' />
                </div>

                <div className='flex TokenAddress ModuleTop'>
                    <div className='Remark'>{CHAIN_SYMBOL} 数量：</div>
                    <input className="ModuleBg" type="text" value={this.state.value} onChange={this.handleValueChange.bind(this)} placeholder={'输入' + CHAIN_SYMBOL + '数量'} pattern="[0-9.]*" />
                </div>

                <div className='flex TokenAddress ModuleTop'>
                    <div className='Remark'>gas 倍数：</div>
                    <input className="ModuleBg" type="text" value={this.state.gasMulti} onChange={this.handleGasMultiChange.bind(this)} pattern="[0-9.]*" placeholder='输入gas倍数，最少1倍' />
                </div>

                <div className="mt20">
                    导入钱包csv文件: <input type="file" onChange={this.handleFileReader} />
                </div>
                <div className="button ModuleTop" onClick={this.batchCopyTx.bind(this)}>克隆交易</div>
                <div className='Contract Remark'>
                    调用钱包数量：{this.state.collectAccount}
                </div>
                {
                    this.state.wallets.map((item, index) => {
                        return <div key={index} className="mt10 Item flex">
                            <div className='Index'>{index + 1}.</div>
                            <div className='text flex-1'> {item.address}</div>
                            <div className='text flex-1'>{item.showBalance}{CHAIN_SYMBOL}</div>
                        </div>
                    })
                }
            </div>
        );
    }
}

export default withNavigation(CopyTx);