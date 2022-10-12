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

const CHAIN_SYMBOL = 'ETHW';

class FindPairs extends Component {
    state = {
        chainId: 10001,
        account: '',
        wallets: [],
        address: [],
        amountIn: null,
        amountOut: null,
        swapRouter: '0x4f381d5fF61ad1D0eC355fEd2Ac4000eA1e67854',
        // swapRouter:'0x7a76e55aaa625e1e56d0dde79e391e5cbb59d097',
        pairs: [],
        auto: false,
        tmpRpc: 'https://mainnet.ethereumpow.org/',
        rpcUrl: 'https://mainnet.ethereumpow.org/',
        gasMulti: 2,
        findSwapPair: '0x0431670CeeadCE996FcA26d8A069E3f7760E110F',
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
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

    async refreshPairs() {
        let options = {
            timeout: 600000, // milliseconds,
            headers: [{ name: 'Access-Control-Allow-Origin', value: '*' }]
        };
        loading.show();
        try {
            const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpcUrl, options));
            const findSwapPairContract = new myWeb3.eth.Contract(FindSwapPair_ABI, this.state.findSwapPair);

            var pairs = [];
            var startIndex = 0;
            var pageSize = 100;
            while (true && startIndex <= 100000) {
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
                    pairs.push({
                        token0: token0s[i],
                        token0Decimal: token0Decimals[i],
                        token0Amount: token0Amounts[i],
                        showToken0Amount: showFromWei(token0Amounts[i], parseInt(token0Decimals[i]), 3),
                        token1: token1s[i],
                        token1Decimal: token1Decimals[i],
                        token1Amount: token1Amounts[i],
                        showToken1Amount: showFromWei(token1Amounts[i], parseInt(token1Decimals[i]), 3),
                        token0Symbol: token0Symbols[i],
                        token1Symbol: token1Symbols[i],
                    });
                }
                if (len < pageSize) {
                    break;
                }
                startIndex += pageSize;
            }
            this.setState({
                pairs: pairs,
            })
        } catch (e) {
            console.log(e.message);
            toast.show(e.message);
            this.setState({
                pairs: pairs,
            })
        } finally {
            loading.hide();
        }
    }

    handleAccountsChanged = () => {
        const wallet = WalletState.wallet;
        let page = this;
        page.setState({
            account: wallet.account
        });
    }

    render() {
        return (
            <div className="Token ImportVip">
                <Header></Header>
                <div className='flex TokenAddress ModuleTop'>
                    <input className="ModuleBg" type="text" value={this.state.tmpRpc} onChange={this.handleRpcUrlChange.bind(this)} placeholder='输入节点链接地址' />
                    <div className='Confirm' onClick={this.confirmRpcUrl.bind(this)}>确定</div>
                </div>
                {
                    this.state.pairs.map((item, index) => {
                        return <div key={index} className="mt10 Item column">
                            <div className='Index'>{index + 1}.</div>
                            <div className='flex text'>
                                <div>{item.token0}</div>
                                <div className='ml20 flex-1'> {item.showToken0Amount} {item.token0Symbol}</div>
                            </div>
                            <div className='flex text'>
                                <div>{item.token1}</div>
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