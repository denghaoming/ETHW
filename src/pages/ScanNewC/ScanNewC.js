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

class ScanNewC extends Component {
    state = {
        chainId: 56,
        rpc: "https://rpc-bsc.48.club",
        codeUrl: 'https://api.bscscan.com/api?module=contract&action=getsourcecode&apikey=F2FE28XXVCR1KYGGARIRNKE87S7EK5IPEK&address=',
        scanUrl: 'https://bscscan.com',

        // chainId: 8453,
        // rpc: "https://mainnet.base.org",
        // codeUrl: 'https://api.basescan.org/api?module=contract&action=getsourcecode&address=',

        // chainId: 20201022,
        //  rpc: "https://pegorpc.com",
        //  codeUrl: 'https://scan.pego.network/api?module=contract&action=getsourcecode&address=',

        account: '',
        transfers: [],
        blockNumber: 0,
    }

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
                blockNumber = parseInt(latestBlockNum) - 28800 * 3;
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
                let creatPairEvents = await myWeb3.eth.getPastLogs({ fromBlock: start, toBlock: end, address: null, topics: ['0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9'] });
                let creatLen = creatPairEvents.length;
                for (let i = 0; i < creatLen; ++i) {
                    let creatEvent = creatPairEvents[i];
                    let transactionHash = creatEvent.transactionHash;
                    if (!txHash[transactionHash]) {
                        txHash[transactionHash] = creatEvent.address;
                    }
                }

                let transferEvents = await myWeb3.eth.getPastLogs({ fromBlock: start, toBlock: end, address: null, topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', '0x0000000000000000000000000000000000000000000000000000000000000000', null] });
                let transferLen = transferEvents.length;
                // console.log('transferEvents', transferLen, transferEvents);
                for (let i = 0; i < transferLen; ++i) {
                    let transferEvent = transferEvents[i];
                    let address = transferEvent.address;
                    let transactionHash = transferEvent.transactionHash;
                    if (!inTransfer[address]) {
                        if (txHash[transactionHash] && address != txHash[transactionHash]) {
                            transfers.push({
                                blockNumber: transferEvent.blockNumber,
                                txID: transactionHash,
                                token: address,
                                lp: txHash[transactionHash]
                            });
                            inTransfer[address] = true;
                            tokens.push(address);
                            console.log('address', address);
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
        }
    }

    async getSourceCode(tokens, i) {
        let len = tokens.length;
        let synTokens = [];
        for (let i = 0; i < len; ++i) {
            let code = await axios.get(this.state.codeUrl + tokens[i]);
            // console.log('code', code);
            console.log(i, tokens[i], code);
            var codeStr = JSON.stringify(code);
            if (codeStr.includes('_balances[airdropAddress] = airdropAmount;')) {
                console.log('.sync', tokens[i]);
                synTokens.push(tokens[i]);
            }
            await this.sleep(200);
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

export default withNavigation(ScanNewC);