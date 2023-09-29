// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777Upgradeable.sol";
import { IERC1820RegistryUpgradeable } from "@openzeppelin/contracts-upgradeable/introspection/IERC1820RegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "./interfaces/IUniswapV3Factory.sol";
import "./interfaces/IUniswapV3Pool.sol";
import "./interfaces/IUniswapV3SwapCallback.sol";

interface ISuperToken {
    function balanceOf(address account) external view returns(uint256 balance);
    function downgrade(uint256 amount) external;
}

contract StreamStaker is IERC777RecipientUpgradeable, Initializable, IUniswapV3SwapCallback {
    using SafeMath for uint256;
    IERC1820RegistryUpgradeable private constant ERC1820 =
        IERC1820RegistryUpgradeable(
            0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24
        );
    address public owner;
    ISuperToken private constant USDCx = ISuperToken(0xD04383398dD2426297da660F9CCA3d439AF9ce1b);
    IERC20 private constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC20 private constant cbETH = IERC20(0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22);
    IERC20 private constant WETH = IERC20(0x4200000000000000000000000000000000000006);
    IUniswapV3Pool private constant WETHtoUSDCPool = IUniswapV3Pool(0xd0b53D9277642d899DF5C87A3966A349A798F224);
    IUniswapV3Pool private constant cbETHtoWETHPool = IUniswapV3Pool(0x10648BA41B8565907Cfa1496765fA4D95390aa0d);

    event Staked(uint256 amountIn, uint256 amountOut);

    function initialize(address _owner) public initializer {
        owner = _owner;
        ERC1820.setInterfaceImplementer(address(this), keccak256("ERC777TokensRecipient"), address(this));
    }

    function stake() external {
        USDCx.downgrade(USDCx.balanceOf(address(this)));
        if (msg.sender != owner) {
            USDC.transfer(0xF4448f0cCf51d727fb73493Efa7Ee298EEd26635, USDC.balanceOf(address(this)).mul(5).div(1000)); // 0.5% fee
        }
        uint256 amountIn = USDC.balanceOf(address(this));
        uint256 cbETHBefore = cbETH.balanceOf(owner);
        bytes memory data = abi.encode(address(USDC), amountIn, address(WETH));
        WETHtoUSDCPool.swap(address(this), false, int256(amountIn), 1461446703485210103287273052203988822378723970341, data);
        data = abi.encode(address(WETH), WETH.balanceOf(address(this)), address(cbETH));
        cbETHtoWETHPool.swap(owner, false, int256(WETH.balanceOf(address(this))), 1461446703485210103287273052203988822378723970341, data);
        uint256 amountOut = cbETH.balanceOf(owner) - cbETHBefore;
        emit Staked(amountIn, amountOut);
    }

    // @notice Function is called by the Uniswap V3 pair's `swap` function
     function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata _data) external override {
        require(msg.sender == address(WETHtoUSDCPool) || msg.sender == address(cbETHtoWETHPool), "only uniswap v3 pair can call this function");
        (address _from, uint _amount, address _to) = abi.decode(_data, (address, uint, address));
        uint256 amountToRepay = uint256( amount0Delta > 0 ? amount0Delta: amount1Delta );
        IERC20(_from).transfer(msg.sender, amountToRepay);
     }

    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external override {}

}