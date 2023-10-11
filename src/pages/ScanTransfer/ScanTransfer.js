import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import WalletState from '../../state/WalletState';
import toast from '../../components/toast/toast';
import Web3 from 'web3'
import { ERC20_ABI } from '../../abi/erc20';
import "../ImportVip/ImportVip.css"
import '../Token/Token.css'

import Header from '../Header';
import { showFromWei } from '../../utils';
import BN from 'bn.js'
import axios from 'axios'

class ScanTransfer extends Component {
    state = {
        // chainId: 56,
        // rpc: "https://rpc-bsc.48.club",
        // codeUrl: 'https://api.bscscan.com/api?module=contract&action=getsourcecode&address=',

        // chainId: 8453,
        // rpc: "https://mainnet.base.org",
        // codeUrl: 'https://api.basescan.org/api?module=contract&action=getsourcecode&address=',


        chainId: 20201022,
        rpc: "https://pegorpc.com",
        codeUrl: 'https://scan.pego.network/api?module=contract&action=getsourcecode&address=',
        scanUrl: 'https://scan.pego.network',

        account: '',
        transfers: [],
        blockNumber: 0,
    }

    inList = {};

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.handleAccountsChanged();
        WalletState.onStateChanged(this.handleAccountsChanged);
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this.getTransfer();
    }

    componentWillUnmount() {
        WalletState.removeListener(this.handleAccountsChanged);
        if (this._timer) {
            clearTimeout(this._timer);
        }
    }

    _loading = false;
    _timer;
    async getTransfer() {
        console.log('getTransfer')
        if (this._loading) {
            return;
        }
        this._loading = true;
        try {
            const myWeb3 = new Web3(new Web3.providers.HttpProvider(this.state.rpc));
            // const myWeb3 = new Web3(Web3.givenProvider);
            let blockNumber = this.state.blockNumber;
            let latestBlockNum = await myWeb3.eth.getBlockNumber();
            if (blockNumber == latestBlockNum) {
                return;
            }
            if (blockNumber == 0) {
                blockNumber = parseInt(latestBlockNum) - 28800;
            }
            console.log('blockNumber', blockNumber);

            let start = blockNumber;
            let pageSize = 2000;
            let transfers = [];
            let txHash = {};
            let inTransfer = {};
            let index = 1;
            let tokens = [];
            while (start < latestBlockNum) {
                console.log('index', index);
                let end = start + pageSize;
                if (end > latestBlockNum) {
                    end = latestBlockNum;
                }
                let syncEvents = await myWeb3.eth.getPastLogs({ fromBlock: start, toBlock: end, address: null, topics: ['0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'] });
                let syncLen = syncEvents.length;
                // console.log('syncEvents', syncLen, syncEvents);
                for (let i = 0; i < syncLen; ++i) {
                    let syncEvent = syncEvents[i];
                    let address = syncEvent.address;
                    if (!this.inList[address]) {
                        let transactionHash = syncEvent.transactionHash;
                        let key = address + transactionHash;
                        if (txHash[key]) {
                            txHash[key] += 1;
                            if (txHash[key] >= 3) {
                                this.inList[address] = true;
                            }
                        } else {
                            txHash[key] = 1;
                        }
                    }
                }

                let transferEvents = await myWeb3.eth.getPastLogs({ fromBlock: start, toBlock: end, address: null, topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, ['0x000000000000000000000000000000000000000000000000000000000000dEaD']] });
                let transferLen = transferEvents.length;
                // console.log('transferEvents', transferLen, transferEvents);
                for (let i = 0; i < transferLen; ++i) {
                    let transferEvent = transferEvents[i];
                    let from = transferEvent.topics[1].replace('000000000000000000000000', '');
                    from = myWeb3.utils.toChecksumAddress(from);
                    if (!inTransfer[from]) {
                        if (this.inList[from]) {
                            transfers.push({
                                blockNumber: transferEvent.blockNumber,
                                txID: transferEvent.transactionHash,
                                lp: from,
                                token: transferEvent.address,
                            });
                            inTransfer[from] = true;
                            tokens.push(transferEvent.address);
                            console.log('lp', from);
                        }
                    }
                }

                start = end;
                index++;
            }
            this.setState({
                blockNumber: latestBlockNum,
                transfers: transfers,
                tokens: tokens,
            })
            console.log('tokens', tokens);
            this.getSourceCode(tokens);
        } catch (e) {
            console.log(e.message);
            toast.show(e.message);
        } finally {
            this._loading = false;
            // this._timer = setTimeout(() => {
            //     this.getTransfer();
            // }, 1000 * 60);
        }
    }

    async getSourceCode(tokens, i) {
        let len = tokens.length;
        let synTokens = [];
        for (let i = 0; i < len; ++i) {
            let code = await axios.get(this.state.codeUrl + tokens[i]);
            // console.log('code', code);
            var codeStr = JSON.stringify(code);
            if (codeStr.includes('.sync')) {
                // console.log('.sync', tokens[i]);
                synTokens.push(tokens[i]);
            }
            await this.sleep(1000);
        }
        console.log('synTokens', synTokens);
    }

    sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));


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
                                <div className='flex text'>{index + 1} . 区块号：{item.blockNumber}</div>
                                <div className='ml20'></div>
                            </div>
                            <a href={this.state.scanUrl + '/tx/' + item.txID} target='_blank'><div className='ml20 flex text'>
                                <div>txID：</div>
                                <div className='ml20 flex-1'> {item.txID}</div>
                            </div></a>
                            <div className='ml20 flex text'>
                                <div>Token：</div>
                                <a className='ml20 flex-1' href={this.state.scanUrl + '/address/' + item.token} target='_blank'><div>{item.token}</div></a>
                            </div>
                            <div className='ml20 flex text'>
                                <div>LP：</div>
                                <a className='ml20 flex-1' href={this.state.scanUrl + '/address/' + item.lp} target='_blank'><div>{item.lp}</div></a>
                            </div>
                        </div>
                    })
                }
            </div>
        );
    }
}

export default withNavigation(ScanTransfer);