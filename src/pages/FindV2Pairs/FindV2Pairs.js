import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import WalletState, { MAX_INT } from '../../state/WalletState';
import loading from '../../components/loading/Loading';
import toast from '../../components/toast/toast';
import Web3 from 'web3'
import { FindSwapPair_ABI } from '../../abi/FindSwapPair_ABI';
import "../ImportVip/ImportVip.css"
import '../Token/Token.css'

import Header from '../Header';
import { showFromWei, toWei, showAccount } from '../../utils';
import BN from 'bn.js'

const CHAIN_SYMBOL = 'ETHW';

class FindV2Pairs extends Component {
    state = {
        chainId: 56,
        account: '',
        wallets: [],
        swapRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        tmpSwapRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        pairs: [],
        findSwapPair: '0x5aBD71E94713CB4ac57EB9E61F5515008a1A6709',
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
            var startIndex = 1460000;
            var pageSize = 1000;
            let minUsdtAmount = '1000000000000000000000';
            let usdtToken = '0x55d398326f99059fF775485246999027B3197955';
            let minBNBAmount = '5000000000000000000';
            let bnbToken = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
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
                    if (usdtToken == token0s[i] && new BN(token0Amounts[i], 10).gte(new BN(minUsdtAmount, 10))) {
                        isValue = true;
                        token = token1s[i];
                    } else if (usdtToken == token1s[i] && new BN(token1Amounts[i], 10).gte(new BN(minUsdtAmount, 10))) {
                        isValue = true;
                        token = token0s[i];
                    } else if (bnbToken == token0s[i] && new BN(token0Amounts[i], 10).gte(new BN(minBNBAmount, 10))) {
                        isValue = true;
                        token = token1s[i];
                    } else if (bnbToken == token1s[i] && new BN(token1Amounts[i], 10).gte(new BN(minBNBAmount, 10))) {
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
        } catch (e) {
            console.log(e.message);
            toast.show(e.message);
            this.setState({
                pairs: pairs,
            })
        } finally {
            loading.hide();
            // setTimeout(() => {
            //     this.refreshPairs();
            // }, 1 * 60*1000);
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
                                <a href={'https://bscscan.com/address/' + item.token0} target='_blank'><div>{item.token0}</div></a>
                                <div className='ml20 flex-1'> {item.showToken0Amount} {item.token0Symbol}</div>
                            </div>
                            <div className='ml20 flex text'>
                                <a href={'https://bscscan.com/address/' + item.token1} target='_blank'><div>{item.token1}</div></a>
                                <div className='ml20 flex-1'>{item.showToken1Amount} {item.token1Symbol}</div>
                            </div>
                        </div>
                    })
                }
            </div>
        );
    }
}

export default withNavigation(FindV2Pairs);