import React, { Component } from 'react'
import { withNavigation } from '../../hocs'
import "../Token/Token.css"
import WalletState, { CHAIN_ID, ZERO_ADDRESS, CHAIN_ERROR_TIP, CHAIN_SYMBOL, MAX_INT } from '../../state/WalletState';
import toast from '../../components/toast/toast'

import copy from 'copy-to-clipboard';
import IconQQ from "../../images/IconQQ.png"

import Header from '../Header';

class More extends Component {
    state = {
        chainId: 0,
        account: "",
        lang: "EN",
    }
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        this.handleAccountsChanged();
        WalletState.onStateChanged(this.handleAccountsChanged);
    }

    componentWillUnmount() {
        WalletState.removeListener(this.handleAccountsChanged);
        if (this.refreshInfoIntervel) {
            clearInterval(this.refreshInfoIntervel);
        }
    }

    handleAccountsChanged = () => {
        console.log(WalletState.wallet.lang);
        const wallet = WalletState.wallet;
        let page = this;
        page.setState({
            chainId: wallet.chainId,
            account: wallet.account,
            lang: WalletState.wallet.lang,
            local: page.getLocal()
        });
    }

    getLocal() {
        let local = {};
        return local;
    }

    copyQQ() {
        if (copy('103682866')) {
            toast.show("QQ群号已复制");
        } else {
            toast.show("复制失败");
        }
    }

    connectWallet() {
        WalletState.connetWallet();
    }

    routerTo(path, e) {
        this.setState({ show: false })
        this.props.navigate(path);
    }

    render() {
        return (
            <div className="Token">
                <Header></Header>
                <div className='LabelContainer mt20'>
                    <div>1。创建钱包</div>
                    <div className='Label'>1.1 输入数量创建钱包</div>
                    <div className='Label'>1.2 导出地址，看清楚是地址</div>
                    <div className='Label'>1.3 导出钱包，看清楚是钱包，包括地址和私钥</div>
                </div>
                <div className='LabelContainer mt10'>
                    <div>2。批量转账</div>
                    <div className='Label'>2.1 导入地址，只要地址</div>
                    <div className='Label'>2.2 填写转账数量，先主链币，用来做手续费的，例如ETHW</div>
                    <div className='Label'>2.3 批量转账ETHW</div>
                    <div className='Label'>2.4 填写转账代币地址，例如USDT</div>
                    <div className='Label'>2.5 批量转账代币</div>
                    <div className='Label'>2.6 如果批量转账代币失败，请使用V2批量转账代币</div>
                </div>
                <div className='LabelContainer mt10'>
                    <div>3。抢币购买</div>
                    <div className='Label'>3.1 输入购买支付ETHW数量</div>
                    <div className='Label'>3.2 输入要购买的代币合约，并点确定按钮</div>
                    <div className='Label'>3.3 输入交易滑点</div>
                    <div className='Label'>3.4 检测交易滑点，如果看到滑点比较高，请谨慎操作</div>
                    <div className='Label'>3.5 导入钱包，注意是钱包，包括地址和私钥</div>
                    <div className='Label'>3.6 自动检测并购买</div>
                    <div className='Label'>3.7 点击自动检测购买中...，会停止自动检测</div>
                    <div className='Label'>3.8 如果需要手动购买，批量购买就行，手动购买需要先检测交易滑点</div>
                </div>

                <div className="button ModuleTop" onClick={this.routerTo.bind(this,'/collect')}>归集钱包</div>

                <div className="button ModuleTop" onClick={this.routerTo.bind(this,'/multiTransfer')}>多钱包一对一转账</div>

                <div className="button ModuleTop" onClick={this.routerTo.bind(this,'/copyTx')}>克隆交易</div>
                
                <div className='QQ'>
                    <div className='Text'>联系我们</div>
                    <img src={IconQQ}></img>
                    <div className='Text mb40' onClick={this.copyQQ.bind(this)}>Q群：103682866</div>
                </div>

                <a className="button ModuleTop mb30" href='https://github.com/denghaoming/ETHW' target='_blank'>前端Github开源仓库</a>
            </div>
        );
    }
}

export default withNavigation(More);