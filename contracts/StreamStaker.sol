// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {
    ISuperToken
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777Upgradeable.sol";
import { IERC1820RegistryUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/IERC1820RegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract StreamStaker is IERC777RecipientUpgradeable, ReentrancyGuardUpgradeable {
    IERC1820RegistryUpgradeable private constant ERC1820 =
        IERC1820RegistryUpgradeable(
            0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24
        );

    ISuperToken private _superToken;
    ERC20 private _lsdToken;

    function initialize(address owner, address superToken, address lsdToken) public initializer {
        __ReentrancyGuard_init();
        _superToken = ISuperToken(superToken);
        _lsdToken = ERC20(lsdToken);
        ERC1820.setInterfaceImplementer(
            address(this),
            keccak256("ERC777TokensRecipient"),
            address(this)
        );
    }

    function stake() external nonReentrant {
        _superToken.downgrade(_superToken.balanceOf(address(this)));
        //_superToken.getUnderlyingToken()

    }

    function onTokenReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external override returns (bytes memory) {
        return "";
    }

    function getSuperToken() public view returns (ISuperToken) {
        return _superToken;
    }
}