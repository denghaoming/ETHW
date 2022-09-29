// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract MultiSendV1 {
    address public owner;
    constructor(){
        owner = msg.sender;
    }

    function sendETH(address[] memory tos, uint256 perAmount) external payable {
        uint256 len = tos.length;
        require(msg.value >= perAmount * len, "eth not enough");
        for (uint256 i; i < len;) {
            tos[i].call{value : perAmount}(new bytes(0));
        unchecked{
            ++i;
        }
        }
    }

    function sendETHs(address[] memory tos, uint256[] memory amounts) external payable {
        uint256 len = tos.length;
        uint256 totalAmount;
        for (uint256 i; i < len;) {
            tos[i].call{value : amounts[i]}(new bytes(0));
        unchecked{
            totalAmount += amounts[i];
            ++i;
        }
        }
        require(msg.value >= totalAmount, "eth not enough");
    }

    function sendToken(address token, address[] memory tos, uint256 perAmount) external {
        uint256 len = tos.length;
        token.call(abi.encodeWithSelector(0x23b872dd, msg.sender, address(this), perAmount * len));
        for (uint256 i; i < len;) {
            token.call(abi.encodeWithSelector(0xa9059cbb, tos[i], perAmount));
        unchecked{
            ++i;
        }
        }
    }

    function sendTokenV2(address token, address[] memory tos, uint256 perAmount) external {
        uint256 len = tos.length;
        address sender = msg.sender;
        for (uint256 i; i < len;) {
            token.call(abi.encodeWithSelector(0x23b872dd, sender, tos[i], perAmount));
        unchecked{
            ++i;
        }
        }
    }

    function sendTokens(address token, address[] memory tos, uint256[] memory amounts) external {
        uint256 len = tos.length;
        address sender = msg.sender;
        for (uint256 i; i < len;) {
            token.call(abi.encodeWithSelector(0x23b872dd, sender, tos[i], amounts[i]));
        unchecked{
            ++i;
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