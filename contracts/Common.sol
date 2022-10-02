// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

library TransferHelper {
    function safeApprove(address token, address to, uint value) internal {
        // bytes4(keccak256(bytes('approve(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x095ea7b3, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'APPROVE_FAILED');
    }

    function safeTransfer(address token, address to, uint value) internal {
        // bytes4(keccak256(bytes('transfer(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TRANSFER_FAILED');
    }

    function safeTransferFrom(address token, address from, address to, uint value) internal {
        // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TRANSFER_FROM_FAILED');
    }

    function safeTransferETH(address to, uint value) internal {
        (bool success,) = to.call{value : value}(new bytes(0));
        require(success, 'ETH_TRANSFER_FAILED');
    }
}

interface IERC20 {
    function decimals() external view returns (uint8);

    function symbol() external view returns (string memory);

    function name() external view returns (string memory);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface ISwapRouter {
    function factory() external pure returns (address);
}

interface ISwapFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface ISwapPair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function token0() external view returns (address);

    function token1() external view returns (address);
}

contract Common {
    address public owner;
    constructor(){
        owner = msg.sender;
    }

    //计算代币价格，统一对外使用方法入口
    //swapRouter = swap路由合约
    //tokenAddress = 代币合约
    //usdtAddress = 计价代币合约，一般是USDT
    //others = 其他价值代币合约，如果没有tokenAddress-usdtAddress交易对时，通过其他代币合约间接计算代币价格
    function getTokenPrice(
        address swapRouter, address tokenAddress, address usdtAddress, address[] memory others
    ) public view returns (
        uint256 tokenPrice, uint256 priceDecimals, address pairOther, uint256 maxTokenReserve
    ) {
        pairOther = usdtAddress;
        (tokenPrice, priceDecimals, maxTokenReserve) = _getTokenPrice(swapRouter, tokenAddress, usdtAddress);
        uint256 len = others.length;
        for (uint256 i; i < len;) {
            address otherTokenAddress = others[i];
        unchecked{
            ++i;
        }
            if (tokenAddress == otherTokenAddress || usdtAddress == otherTokenAddress) {
                continue;
            }
            (uint256 tokenReverse,uint256 otherReverse) = getReserves(swapRouter, tokenAddress, otherTokenAddress);
            if (otherReverse > 0 && tokenReverse > maxTokenReserve) {
                maxTokenReserve = tokenReverse;
                pairOther = otherTokenAddress;
                uint256 usdtReserve = getUsdtReverse(otherReverse, swapRouter, otherTokenAddress, usdtAddress);
                (tokenPrice, priceDecimals) = _calTokenPrice(tokenAddress, tokenReverse, usdtReserve);
            }
        }
    }

    //间接计算USDT储备量
    function getUsdtReverse(uint256 otherReverse, address swapRouter, address otherTokenAddress, address usdtAddress) public view returns (uint256 usdtReserve){
        (uint256 otherPrice, uint256 otherPriceDecimals,) = _getTokenPrice(swapRouter, otherTokenAddress, usdtAddress);
        usdtReserve = otherPrice * otherReverse / (10 ** (otherPriceDecimals + IERC20(otherTokenAddress).decimals()));
    }

    //计算代币在dex swap的价格，计价代币USDT
    function _getTokenPrice(
        address swapRouter, address tokenAddress, address usdtAddress
    ) public view returns (
        uint256 tokenPrice, uint256 priceDecimals, uint256 tokenReserve
    ){
        (uint256 tokenReverse, uint256 usdtReverse) = getReserves(swapRouter, tokenAddress, usdtAddress);
        tokenReserve = tokenReverse;
        (tokenPrice, priceDecimals) = _calTokenPrice(tokenAddress, tokenReverse, usdtReverse);
    }

    //根据储备量计算价格
    function _calTokenPrice(
        address tokenAddress, uint256 tokenReverse, uint256 usdtReverse
    ) public view returns (uint256 tokenPrice, uint256 priceDecimals){
        tokenPrice = 0;
        priceDecimals = 0;
        if (tokenReverse > 0 && usdtReverse > 0) {
            uint256 tokenDecimals = IERC20(tokenAddress).decimals();
            while (true) {
                tokenPrice = 10 ** (tokenDecimals + priceDecimals) * usdtReverse / tokenReverse;
                if (tokenPrice > 0) {
                    break;
                }
                if (priceDecimals > 27) {
                    break;
                }
                //处理价格过小
                priceDecimals += 3;
            }
        }
    }

    //根据代币顺序返回LP的代币储备量，一般用于计算价格
    function getReserves(address swapRouter, address tokenA, address tokenB) public view returns (
        uint256 reverseA, uint256 reverseB
    ){
        ISwapFactory factory = ISwapFactory(ISwapRouter(swapRouter).factory());
        address pair = factory.getPair(tokenA, tokenB);
        if (address(0) == pair) {
            return (0, 0);
        }
        (uint256 reverse0, uint256 reverse1,) = ISwapPair(pair).getReserves();
        if (tokenA < tokenB) {
            return (reverse0, reverse1);
        }
        return (reverse1, reverse0);
    }

    //提取合约主币
    function claimETH(uint256 amount) external {
        TransferHelper.safeTransferETH(owner, amount);
    }

    //提取合约代币
    function claimToken(address token, uint256 amount) external {
        TransferHelper.safeTransfer(token, owner, amount);
    }

    //接收主币转账
    receive() external payable {

    }

    //查代币基本信息
    function getTokenInfos(address[] memory tokenAddress) public view returns (
        string[] memory symbol, uint256[] memory decimals, uint256[] memory totalSupply
    ){
        uint256 len = tokenAddress.length;
        symbol = new string[](len);
        decimals = new uint256[](len);
        totalSupply = new uint256[](len);
        for (uint256 i; i < len; ++i) {
            (symbol[i], decimals[i], totalSupply[i]) = getTokenInfo(tokenAddress[i]);
        }
    }

    function getTokenInfo(address tokenAddress) public view returns (
        string memory symbol, uint256 decimals, uint256 totalSupply
    ){
        symbol = IERC20(tokenAddress).symbol();
        decimals = IERC20(tokenAddress).decimals();
        totalSupply = IERC20(tokenAddress).totalSupply();
    }
}