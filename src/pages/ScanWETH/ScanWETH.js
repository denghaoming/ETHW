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

class ScanWETH extends Component {
    state = {
        chainId: 56,
        account: '',
        transfers: [],
        WETH: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        blockNumber: 0,
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.handleAccountsChanged();
        WalletState.onStateChanged(this.handleAccountsChanged);
        if(this._timer){
            clearTimeout(this._timer);
        }
        this.getWETHTransfer();
    }

    componentWillUnmount() {
        WalletState.removeListener(this.handleAccountsChanged);
        if(this._timer){
            clearTimeout(this._timer);
        }
    }

    _loading = false;
    _timer;
    async getWETHTransfer() {
        console.log('getWETHTransfer')
        if (this._loading) {
            return;
        }
        this._loading = true;
        try {
            const myWeb3 = new Web3(Web3.givenProvider);
            let blockNumber = this.state.blockNumber;
            let latestBlockNum = await myWeb3.eth.getBlockNumber();
            if (blockNumber == latestBlockNum) {
                return;
            }
            if (blockNumber == 0) {
                blockNumber = parseInt(latestBlockNum)-10;
            }
            console.log('blockNumber', blockNumber);
            const wethContract = new myWeb3.eth.Contract(ERC20_ABI, this.state.WETH);
            let events = await wethContract.getPastEvents('Transfer', { fromBlock: blockNumber, toBlock: 'latest' });
            let len = events.length;
            console.log('events', len, events);
            let transfers = [];
            for (let i = 0; i < len; ++i) {
                let returnValues = events[i].returnValues;
                if (new BN(returnValues.value, 10).gte(new BN('1000000000000000000', 10))) {
                    transfers.push({
                        blockNumber:events[i].blockNumber,
                        txID: events[i].transactionHash,
                        from: returnValues.from,
                        to: returnValues.to,
                        amount: returnValues.value,
                        showAmount: showFromWei(returnValues.value, 18, 4),
                    });
                }

            }

            len = transfers.length;
            let allLen = 100;
            //显示部分旧数据
            if (len < allLen) {
                let addLen = 100 - len;
                let oldTransfers = this.state.transfers;
                let oldLen = oldTransfers.length;
                if (addLen > oldLen) {
                    addLen = oldLen;
                }
                for (let i = 0; i < addLen; ++i) {
                    transfers.push(oldTransfers[i]);
                }
            }
            this.setState({
                blockNumber: latestBlockNum,
                transfers: transfers,
            })
        } catch (e) {
            console.log(e.message);
            toast.show(e.message);
        } finally {
            this._loading = false;
            this._timer = setTimeout(() => {
                this.getWETHTransfer();
            }, 1000 * 60);
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
                {
                    this.state.transfers.map((item, index) => {
                        return <div key={index} className="mt10 Item column">
                            <div className='flex text'>
                                <div className='flex text'>{index + 1} . 数量：{item.showAmount} WETH</div>
                                <div className='ml20'>区块号：{item.blockNumber}</div>
                            </div>
                            <a href={'https://basescan.org/tx/'+item.txID} target='_blank'><div className='ml20 flex text'>
                                <div>txID：</div>
                                <div className='ml20 flex-1'> {item.txID}</div>
                            </div></a>
                            <div className='ml20 flex text'>
                                <div>From：</div>
                                <div className='ml20 flex-1'>{item.from}</div>
                            </div>
                            <div className='ml20 flex text'>
                                <div>To：</div>
                                <div className='ml20 flex-1'>{item.to}</div>
                            </div>
                        </div>
                    })
                }
            </div>
        );
    }
}

export default withNavigation(ScanWETH);