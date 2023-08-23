import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import WalletState, { MAX_INT } from '../../state/WalletState';
import loading from '../../components/loading/Loading';
import toast from '../../components/toast/toast';
import Web3 from 'web3'
import { FindV3Pair_ABI } from '../../abi/FindV3Pair_ABI';
import "../ImportVip/ImportVip.css"
import '../Token/Token.css'

import Header from '../Header';
import { showFromWei, toWei, showAccount } from '../../utils';
import BN from 'bn.js'

const CHAIN_SYMBOL = 'ETHW';

class FindV3Pairs extends Component {
    state = {
        chainId: 8453,
        account: '',
        //Sushi
        //0x80C7DD17B01855a6D2347444a0FCC36136a314de
        //dackie
        //0xCfB05AB06D338FD85BBF4486e69809D96A906b77
        //uni
        //0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1
        swapRouter: '0xCfB05AB06D338FD85BBF4486e69809D96A906b77',
        tmpSwapRouter: '0xCfB05AB06D338FD85BBF4486e69809D96A906b77',
        pairs: [],
        findSwapPair: '0xDdA459109A51538b15E0d1781Dd0CE33ACD78A73',
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
            const findSwapPairContract = new myWeb3.eth.Contract(FindV3Pair_ABI, this.state.findSwapPair);

            var pairs = [];
            var startIndex = 0;
            var pageSize = 1000;
            let inList = {};
            while (true) {
                console.log(startIndex, pageSize);
                let pairInfos = await findSwapPairContract.methods.getPairInfos(this.state.swapRouter, startIndex, pageSize).call();
                let pairList = await findSwapPairContract.methods.getPairList(this.state.swapRouter, startIndex, pageSize).call();
                let len = parseInt(pairInfos[0]);
                let token0s = pairList[1];
                let token0Amounts = pairList[2];
                let token1s = pairList[3];
                let token1Amounts = pairList[4];
                let pools = pairList[5];

                let token0Decimals = pairInfos[1];
                let token1Decimals = pairInfos[2];
                let token0Symbols = pairInfos[3];
                let token1Symbols = pairInfos[4];
                for (let i = 0; i < len; ++i) {
                    let pool = pools[i];
                    if (inList[pool]) {
                        continue;
                    }
                    let isValue = false;
                    let token;
                    let minAmount = '500000000000000000';
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
                        inList[pool] = true;
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
            if (this.state.pairs.length == 0) {
                this.setState({
                    pairs: pairs,
                })
            }
        } finally {
            loading.hide();
            setTimeout(() => {
                this.refreshPairs();
            }, 1 * 60 * 1000);
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
                    <div>NFT地址：</div>
                    <input className="ModuleBg" type="text" value={this.state.tmpSwapRouter} onChange={this.handleSwapRouterChange.bind(this)} placeholder='输入节点链接地址' />
                    <div className='Confirm' onClick={this.confirmSwapRouter.bind(this)}>确定</div>
                </div>
                {
                    this.state.pairs.map((item, index) => {
                        return <div key={index} className="mt10 Item column">
                            <div className='Index'>{index + 1}.</div>
                            <div className='ml20 flex text'>
                                <a href={'https://basescan.org/address/' + item.token0} target='_blank'><div>{item.token0}</div></a>
                                <div className='ml20 flex-1'> {item.showToken0Amount} {item.token0Symbol}</div>
                            </div>
                            <div className='ml20 flex text'>
                                <a href={'https://basescan.org/address/' + item.token1} target='_blank'><div>{item.token1}</div></a>
                                <div className='ml20 flex-1'>{item.showToken1Amount} {item.token1Symbol}</div>
                            </div>
                        </div>
                    })
                }
            </div>
        );
    }
}

export default withNavigation(FindV3Pairs);