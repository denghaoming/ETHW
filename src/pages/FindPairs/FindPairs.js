import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import WalletState, { MAX_INT } from '../../state/WalletState';
import loading from '../../components/loading/Loading';
import toast from '../../components/toast/toast';
import Web3 from 'web3'
import { ERC20_ABI } from '../../abi/erc20';
import { SwapCheck_ABI } from '../../abi/SwapCheck_ABI';
import { SwapRouter_ABI } from '../../abi/SwapRouter_ABI';
import { FindSwapPair_ABI } from '../../abi/FindSwapPair_ABI';
import "../ImportVip/ImportVip.css"
import '../Token/Token.css'

import Header from '../Header';
import { showFromWei, toWei, showAccount } from '../../utils';
import BN from 'bn.js'
import { TeaPair_ABI } from '../../abi/TeaPair_ABI';

const CHAIN_SYMBOL = 'ETHW';

class FindPairs extends Component {
    state = {
        chainId: 8453,
        account: '',
        wallets: [],
        // swapRouter: '0x4f381d5fF61ad1D0eC355fEd2Ac4000eA1e67854',
        // swapRouter:'0x7a76e55aaa625e1e56d0dde79e391e5cbb59d097',
        //base leetswap
        //  swapRouter: '0xfCD3842f85ed87ba2889b4D35893403796e67FF1',
        //xswap：0xBCEb0Ee20ED1489DbEa44dB08A1E95004ca2753a
        //baseswap：0x327Df1E6de05895d2ab08513aaDD9313Fe505d86
        //rocketSwap：0x4cf76043B3f97ba06917cBd90F9e3A2AAC1B306e
        swapRouter: '0xfCD3842f85ed87ba2889b4D35893403796e67FF1',
        tmpSwapRouter:'0xfCD3842f85ed87ba2889b4D35893403796e67FF1',
        pairs: [],
        // findSwapPair: '0x0431670CeeadCE996FcA26d8A069E3f7760E110F',
        findSwapPair: '0x1355a40074919FBDfca8B9E966a4B1d80CD519DA',
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.handleAccountsChanged();
        WalletState.onStateChanged(this.handleAccountsChanged);
        this.refreshPairs();
    }

    componentWillUnmount() {
        WalletState.removeListener(this.handleAccountsChanged);
    }

    handleSwapRouterChange(event) {
        let value = event.target.value;
        this.setState({
            tmpSwapRouter: value
        })
    }

    async confirmSwapRouter() {
        this.setState({
            swapRouter: this.state.tmpSwapRouter
        })
    }

    async refreshPairs() {
        if (this.state.pairs.length == 0) {
            loading.show();
        }
        try {
            const myWeb3 = new Web3(Web3.givenProvider);
            const findSwapPairContract = new myWeb3.eth.Contract(FindSwapPair_ABI, this.state.findSwapPair);

            var pairs = [];
            var startIndex = 0;
            var pageSize = 1000;
            while (true) {
                console.log(startIndex, pageSize);
                let pairInfos = await findSwapPairContract.methods.getPairInfos(this.state.swapRouter, startIndex, pageSize).call();
                let pairList = await findSwapPairContract.methods.getPairList(this.state.swapRouter, startIndex, pageSize).call();
                let len = parseInt(pairInfos[0]);
                let token0s = pairList[1];
                let token0Amounts = pairList[2];
                let token1s = pairList[3];
                let token1Amounts = pairList[4];

                let token0Decimals = pairInfos[1];
                let token1Decimals = pairInfos[2];
                let token0Symbols = pairInfos[3];
                let token1Symbols = pairInfos[4];
                for (let i = 0; i < len; ++i) {
                    let isValue = false;
                    let token;
                    let minAmount = '5000000000000000';
                    let valutToken = '0x4200000000000000000000000000000000000006';
                    if (valutToken == token0s[i] && new BN(token0Amounts[i], 10).gte(new BN(minAmount, 10))) {
                        isValue = true;
                        token = token1s[i];
                    }
                    if (valutToken == token1s[i] && new BN(token1Amounts[i], 10).gte(new BN(minAmount, 10))) {
                        isValue = true;
                        token = token0s[i];
                    }
                    if (isValue) {
                        pairs.push({
                            token0: token0s[i],
                            token0Decimal: token0Decimals[i],
                            token0Amount: token0Amounts[i],
                            showToken0Amount: showFromWei(token0Amounts[i], parseInt(token0Decimals[i]), parseInt(token0Decimals[i])),
                            token1: token1s[i],
                            token1Decimal: token1Decimals[i],
                            token1Amount: token1Amounts[i],
                            showToken1Amount: showFromWei(token1Amounts[i], parseInt(token1Decimals[i]), parseInt(token1Decimals[i])),
                            token0Symbol: token0Symbols[i],
                            token1Symbol: token1Symbols[i],
                            token: token,
                        });
                    }
                }
                if (len < pageSize) {
                    break;
                }
                startIndex += pageSize;
            }
            this.setState({
                pairs: pairs,
            })

            let len = pairs.length;

            // for (let i = 0; i < len; ++i) {
            //     setTimeout(() => {
            //         this.teaPair(pairs[i].token, i);
            //     }, i * 1000);
            // }

            // let tokens = ["0x6e5749B66b481314Ad03280A28e3d2543023F61F","0x7b9e401a24550fC9B7343c980F06A898A5e46718","0x2E3f759C4C0C43dbcE9E16B6F2435AeE5bDEdEbC","0x7B1e1C119E33c55E7D21EC61774439554c08b7a4","0xC9f1d7B0BB72742311fd0b23D465c84e9111d9A7","0x7170b8Ad1C34e51086fB0F3f47Fc01FFF1cEDC24","0xC3D5521915fC5ECA08AEd852449059D76E81e4fb"];
            // len = pairs.length;

            // for (let i = 0; i < len; ++i) {
            //     setTimeout(() => {
            //         this.teaPair(tokens[i], i);
            //     }, i * 30000);
            // }
        } catch (e) {
            console.log(e.message);
            toast.show(e.message);
            this.setState({
                pairs: pairs,
            })
        } finally {
            loading.hide();
            setTimeout(() => {
                this.refreshPairs();
            }, 1 * 60*1000);
        }
    }

    async teaPair(token, i) {
        try {
            console.log('token', i)
            const myWeb3 = new Web3(Web3.givenProvider);
            const teaContract = new myWeb3.eth.Contract(TeaPair_ABI, "0xe58047370dE61B17ca4E6c9389Cc33b96426f812");
            // let gasPrice = await myWeb3.eth.getGasPrice();
            let gasPrice = "100000050";
            console.log("gasPrice", gasPrice);
            gasPrice = new BN(gasPrice, 10);
            console.log("gasPrice", gasPrice);

            let wallet = {
                address: "0x496e36E810A37E60575Cdd742c88C9BFCc634f30",
                privateKey: '',
            }

            let gas = await teaContract.methods.swapEthPair('0xfCD3842f85ed87ba2889b4D35893403796e67FF1', token).estimateGas({ from: wallet.address });
            gas = new BN(gas, 10).mul(new BN("130", 10)).div(new BN("100", 10));
            console.log("gas", gas);

            //Data
            var data = teaContract.methods.swapEthPair('0xfCD3842f85ed87ba2889b4D35893403796e67FF1', token).encodeABI();
            console.log("data", data);

            var nonce = await myWeb3.eth.getTransactionCount(wallet.address, "pending");
            console.log("nonce", nonce);

            var txParams = {
                gas: Web3.utils.toHex(gas),
                gasPrice: Web3.utils.toHex(gasPrice),
                nonce: Web3.utils.toHex(nonce),
                chainId: this.state.chainId,
                value: Web3.utils.toHex("0"),
                to: "0xe58047370dE61B17ca4E6c9389Cc33b96426f812",
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
                toast.show("归集失败");
                return;
            }
            console.log("已归集");
            toast.show("已归集");
            this.setState({
                collectAccount: this.state.collectAccount + 1
            });
        } catch (e) {
            console.log("e", e);
            toast.show(e.message);
            if (e.message.includes('nonce too low')) {
                console.log('nonce too low', token);
            }
        } finally {
            loading.hide();
        }
    }

    handleAccountsChanged = () => {
        const wallet = WalletState.wallet;
        let page = this;
        page.setState({
            chainId:wallet.chainId,
            account: wallet.account
        });
    }

    render() {
        return (
            <div className="Token ImportVip">
                <Header></Header>
                <div className='flex TokenAddress ModuleTop'>
                    <div>路由地址：</div>
                    <input className="ModuleBg" type="text" value={this.state.tmpSwapRouter} onChange={this.handleSwapRouterChange.bind(this)} placeholder='输入节点链接地址' />
                    <div className='Confirm' onClick={this.confirmSwapRouter.bind(this)}>确定</div>
                </div>
                {
                    this.state.pairs.map((item, index) => {
                        return <div key={index} className="mt10 Item column">
                            <div className='Index'>{index + 1}.</div>
                            <div className='ml20 flex text'>
                                <a href={'https://basescan.org/address/'+item.token0} target='_blank'><div>{item.token0}</div></a>
                                <div className='ml20 flex-1'> {item.showToken0Amount} {item.token0Symbol}</div>
                            </div>
                            <div className='ml20 flex text'>
                                <a href={'https://basescan.org/address/'+item.token1} target='_blank'><div>{item.token1}</div></a>
                                <div className='ml20 flex-1'>{item.showToken1Amount} {item.token1Symbol}</div>
                            </div>
                        </div>
                    })
                }
            </div>
        );
    }
}

export default withNavigation(FindPairs);