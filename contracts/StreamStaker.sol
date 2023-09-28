// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;
pragma abicoder v2;

import {
    ISuperToken
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777Upgradeable.sol";
import { IERC1820RegistryUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/IERC1820RegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';

contract StreamStaker is IERC777RecipientUpgradeable, ReentrancyGuardUpgradeable {
    IERC1820RegistryUpgradeable private constant ERC1820 =
        IERC1820RegistryUpgradeable(
            0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24
        );
    address public owner;
    ISuperToken private USDbCx = ISuperToken(0x4dB26C973FaE52f43Bd96A8776C2bf1b0DC29556);
    IERC20 private USDbC = IERC20(0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA);
    IERC20 private cbETH = IERC20(0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22);
    IERC20 private WETH = IERC20(0x4200000000000000000000000000000000000006);
    ISwapRouter swapRouter = ISwapRouter(0x2626664c2603336E57B271c5C0b26F421741e481);

    event Staked(uint256 amount);

    function initialize(address _owner) public initializer {
        owner = _owner;
        __ReentrancyGuard_init();
        ERC1820.setInterfaceImplementer(
            address(this),
            keccak256("ERC777TokensRecipient"),
            address(this)
        );
        USDbC.approve(address(swapRouter), 2**256 - 1);
    }

    function stake() external nonReentrant {
        USDbCx.downgrade(USDbCx.balanceOf(address(this)));
        // TODO: deduct fee?
        ISwapRouter.ExactInputParams memory params =
            ISwapRouter.ExactInputParams({
                path: abi.encodePacked(USDbC, uint24(500), WETH, uint24(500), cbETH),
                recipient: owner,
                deadline: block.timestamp,
                amountIn: USDbC.balanceOf(address(this)),
                amountOutMinimum: 0
            });
        uint256 amountOut = swapRouter.exactInput(params);
        emit Staked(amountOut);
    }

    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external override {

    }

}