// SPDX-License-Identifier: MIT

pragma solidity =0.7.6;
pragma abicoder v2;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777Upgradeable.sol";
import { IERC1820RegistryUpgradeable } from "@openzeppelin/contracts-upgradeable/introspection/IERC1820RegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
//import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import "./interfaces/IUniswapV3Factory.sol";
import "./interfaces/IUniswapV3Pool.sol";
//import "./interfaces/IUniswapV3SwapCallback.sol";

interface ISuperToken {
    function balanceOf(address account) external view returns(uint256 balance);
    function downgrade(uint256 amount) external;
}

contract StreamStaker is IERC777RecipientUpgradeable, Initializable, IUniswapV3SwapCallback {
    IERC1820RegistryUpgradeable private constant ERC1820 =
        IERC1820RegistryUpgradeable(
            0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24
        );
    address public owner;
    ISuperToken private constant USDCx = ISuperToken(0xD04383398dD2426297da660F9CCA3d439AF9ce1b);
    IERC20 private constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC20 private constant cbETH = IERC20(0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22);
    IERC20 private constant WETH = IERC20(0x4200000000000000000000000000000000000006);
    ISwapRouter private constant swapRouter = ISwapRouter(0x2626664c2603336E57B271c5C0b26F421741e481);
    IUniswapV3Pool private constant WETHtoUSDCPool = IUniswapV3Pool(0xd0b53D9277642d899DF5C87A3966A349A798F224);
    IUniswapV3Pool private constant cbETHtoWETHPool = IUniswapV3Pool(0x10648BA41B8565907Cfa1496765fA4D95390aa0d);

    event Staked(uint256 amountIn, uint256 amountOut);

    function initialize(address _owner) public initializer {
        owner = _owner;
        //__ReentrancyGuard_init();
        ERC1820.setInterfaceImplementer(
            address(this),
            keccak256("ERC777TokensRecipient"),
            address(this)
        );
        USDC.approve(address(swapRouter), 2**256 - 1);
    }

    function stake() external {
        USDCx.downgrade(USDCx.balanceOf(address(this)));
        // TODO: deduct fee?
        uint256 amountIn = USDC.balanceOf(address(this));
        console.log("amountIn", amountIn);
        uint256 allowance = USDC.allowance(address(this), address(swapRouter));
        console.log("allowance", allowance);
        ISwapRouter.ExactInputParams memory params =
            ISwapRouter.ExactInputParams({
                path: abi.encodePacked(address(USDC), uint24(500), address(WETH), uint24(500), address(cbETH)),
                recipient: owner,
                deadline: block.timestamp + 300,
                amountIn: amountIn,
                amountOutMinimum: 0
            });
        console.logBytes(params.path);
        uint256 amountOut = swapRouter.exactInput(params);
        emit Staked(amountIn, amountOut);
    }

    function swap() external {
        USDCx.downgrade(USDCx.balanceOf(address(this)));
        // TODO: deduct fee?
        uint256 amountIn = USDC.balanceOf(address(this));
        console.log("amountIn", amountIn);
        uint256 allowance = USDC.allowance(address(this), address(swapRouter));
        console.log("allowance", allowance);

        IUniswapV3Factory uniswapV3Factory = IUniswapV3Factory(0x33128a8fC17869897dcE68Ed026d694621f6FDfD); // uni v3 Base mainnet
        address pairAddress = uniswapV3Factory.getPool(address(WETH), address(cbETH), 500);
        require(pairAddress != address(0), "Requested pair is not available.");
        console.log("pairAddress", pairAddress);
        address token0 = IUniswapV3Pool(pairAddress).token0();
        address token1 = IUniswapV3Pool(pairAddress).token1();
        console.log("token0, token1", token0, token1);
        //bool zeroForOne = address(WETH) == token0 ? false : true;
        bool zeroForOne = false;
        bytes memory data = abi.encode(
            address(USDC),
            amountIn,
            address(WETH)
        );
        //uint160 minSQRT = 4295128740;
        //uint160 maxSQRT = 1461446703485210103287273052203988822378723970341;
        uint160 sqrtPriceLimitX96 = zeroForOne ? 4295128740 : 1461446703485210103287273052203988822378723970341;
        console.log('ready to v3swap:', zeroForOne);
        console.logInt(int256(amountIn));
        console.logInt(sqrtPriceLimitX96);
        IUniswapV3Pool(WETHtoUSDCPool).swap(address(this), false, int256(amountIn), sqrtPriceLimitX96, data);
        data = abi.encode(
            address(WETH),
            WETH.balanceOf(address(this)),
            address(cbETH)
        );
        IUniswapV3Pool(cbETHtoWETHPool).swap(owner, false, int256(WETH.balanceOf(address(this))), sqrtPriceLimitX96, data);
        emit Staked(amountIn, 0); // TODO: edit out
    }

    // @notice Function is called by the Uniswap V3 pair's `swap` function
     function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata _data) external override {
        console.log("start uniswapV3SwapCallback");
        // TODO: SECURITY check msg.sender is the uniswap v3 pair
        require(msg.sender == address(WETHtoUSDCPool) || msg.sender == address(cbETHtoWETHPool), "only uniswap v3 pair can call this function");
        console.logInt(amount0Delta);
        console.logInt(amount1Delta);
        // TODO: need to change this if supporting other tokens
        (
            address _from,
            uint _amount,
            address _to
        ) = abi.decode(_data, (address, uint, address));
        console.log("decoded", _from, _amount, _to);
        uint256 amountToRepay = uint256( amount0Delta > 0 ? amount0Delta: amount1Delta );
        console.log("amountToRepay", amountToRepay);
        IERC20(_from).transfer(msg.sender, amountToRepay);
        //USDC.transfer(msg.sender, uint256(amount1Delta));
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