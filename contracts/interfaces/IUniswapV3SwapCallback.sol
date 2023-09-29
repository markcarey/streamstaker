// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

interface IUniswapV3SwapCallback {
    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external;
}
