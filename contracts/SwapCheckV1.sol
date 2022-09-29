// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

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

interface ISwapFactory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function feeTo() external view returns (address);

    function feeToSetter() external view returns (address);

    function getPair(address tokenA, address tokenB) external view returns (address pair);

    function allPairs(uint) external view returns (address pair);

    function allPairsLength() external view returns (uint);

    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setFeeTo(address) external;

    function setFeeToSetter(address) external;
}

interface ISwapPair {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external pure returns (uint8);

    function totalSupply() external view returns (uint);

    function balanceOf(address owner) external view returns (uint);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);

    function transfer(address to, uint value) external returns (bool);

    function transferFrom(address from, address to, uint value) external returns (bool);

    function DOMAIN_SEPARATOR() external view returns (bytes32);

    function PERMIT_TYPEHASH() external pure returns (bytes32);

    function nonces(address owner) external view returns (uint);

    function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external;

    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    function MINIMUM_LIQUIDITY() external pure returns (uint);

    function factory() external view returns (address);

    function token0() external view returns (address);

    function token1() external view returns (address);

    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function price0CumulativeLast() external view returns (uint);

    function price1CumulativeLast() external view returns (uint);

    function kLast() external view returns (uint);

    function mint(address to) external returns (uint liquidity);

    function burn(address to) external returns (uint amount0, uint amount1);

    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;

    function skim(address to) external;

    function sync() external;

    function initialize(address, address) external;
}

interface ISwapRouter {
    function factory() external pure returns (address);

    function WETH() external pure returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);

    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);

    function removeLiquidityETHWithPermit(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
    external
    payable
    returns (uint[] memory amounts);

    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
    external
    returns (uint[] memory amounts);

    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
    external
    returns (uint[] memory amounts);

    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
    external
    payable
    returns (uint[] memory amounts);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);

    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);

    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountETH);

    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountETH);

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}

contract SwapCheckV1 {
    uint256 public constant MAX = ~uint256(0);

    address public owner;
    constructor(){
        owner = msg.sender;
    }

    //检测主币购买代币，再卖出情况
    function checkETHSwap(
        address router,
        address tokenAddress,
        address[] calldata others
    ) external payable returns (address pairOther, uint256 calBuyAmount, uint256 realBuyAmount, uint256 calSellAmount, uint256 realSellAmount){
        pairOther = findPairOther(router, tokenAddress, others);
        if (pairOther != address(0)) {
            uint256 amountIn = msg.value;
            (calBuyAmount, realBuyAmount) = _checkEthBuyToken(router, amountIn, tokenAddress, pairOther);
            if (realBuyAmount > 0) {
                (calSellAmount, realSellAmount) = _checkSellForEth(router, realBuyAmount, tokenAddress, pairOther);
            }
        }
    }

    //检测代币兑换为主币情况
    function checkSwapForEth(
        address router,
        uint256 amountIn,
        address tokenAddress,
        address[] calldata others
    ) external returns (address pairOther, uint256 calSellAmount, uint256 realSellAmount){
        pairOther = findPairOther(router, tokenAddress, others);
        if (pairOther != address(0)) {
            uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
            //先将代币从调用者地址转到当前合约
            tokenAddress.call(abi.encodeWithSelector(0x23b872dd, msg.sender, address(this), amountIn));
            balance = IERC20(tokenAddress).balanceOf(address(this)) - balance;
            (calSellAmount, realSellAmount) = _checkSellForEth(router, balance, tokenAddress, pairOther);
        }
    }

    //检测主币买币情况，pairOther=LP中的另外一个币
    function _checkEthBuyToken(
        address router,
        uint amountIn,
        address tokenAddress,
        address pairOther
    ) public returns (uint256 calBuyAmount, uint256 realBuyAmount){
        ISwapRouter swapRouter = ISwapRouter(router);
        address WETH = swapRouter.WETH();
        address[] memory path;
        if (pairOther == WETH) {
            path = new address[](2);
            path[0] = WETH;
            path[1] = tokenAddress;
        } else {
            path = new address[](3);
            path[0] = WETH;
            path[1] = pairOther;
            path[2] = tokenAddress;
        }
        uint[] memory amounts = swapRouter.getAmountsOut(amountIn, path);
        calBuyAmount = amounts[amounts.length - 1];

        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        try swapRouter.swapExactETHForTokensSupportingFeeOnTransferTokens{value : amountIn}(
            0, path, address(this), block.timestamp
        ){} catch{}
        realBuyAmount = IERC20(tokenAddress).balanceOf(address(this)) - balance;
    }

    function _checkSellForEth(
        address router,
        uint amountIn,
        address tokenAddress,
        address pairOther
    ) public returns (uint256 calSellAmount, uint256 realSellAmount){
        //授权代币
        tokenAddress.call(abi.encodeWithSelector(0x095ea7b3, router, MAX));
        ISwapRouter swapRouter = ISwapRouter(router);
        address WETH = swapRouter.WETH();
        address[] memory path;
        if (pairOther == WETH) {
            path = new address[](2);
            path[0] = tokenAddress;
            path[1] = WETH;
        } else {
            path = new address[](3);
            path[0] = tokenAddress;
            path[1] = pairOther;
            path[2] = WETH;
        }
        uint[] memory amounts = swapRouter.getAmountsOut(amountIn, path);
        calSellAmount = amounts[amounts.length - 1];

        uint256 balance = address(this).balance;
        try swapRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn, 0, path, address(this), block.timestamp
        ){} catch{}
        realSellAmount = address(this).balance - balance;
    }

    //获取和代币组交易对的另一个代币
    function findPairOther(
        address router,
        address tokenAddress,
        address[] calldata others
    ) public view returns (address pairOther){
        ISwapRouter swapRouter = ISwapRouter(router);
        ISwapFactory swapFactory = ISwapFactory(swapRouter.factory());
        address WETH = swapRouter.WETH();
        address pair = swapFactory.getPair(tokenAddress, WETH);
        uint256 max;
        if (address(0) != pair) {
            uint256 pairBalance = IERC20(tokenAddress).balanceOf(pair);
            if (pairBalance > max) {
                pairOther = WETH;
                max = pairBalance;
            }
        }
        uint256 len = others.length;
        for (uint256 i; i < len;) {
            address otherTokenAddress = others[i];
        unchecked{
            ++i;
        }
            if (tokenAddress == otherTokenAddress || WETH == otherTokenAddress) {
                continue;
            }
            pair = swapFactory.getPair(tokenAddress, otherTokenAddress);
            if (address(0) != pair) {
                uint256 pairBalance = IERC20(tokenAddress).balanceOf(pair);
                if (pairBalance > max) {
                    pairOther = otherTokenAddress;
                    max = pairBalance;
                }
            }
        }
    }

    function claimETH(uint256 amount) external {
        owner.call{value : amount}(new bytes(0));
    }

    function claimToken(address token, uint256 amount) external {
        token.call(abi.encodeWithSelector(0xa9059cbb, owner, amount));
    }

    receive() external payable {}
}