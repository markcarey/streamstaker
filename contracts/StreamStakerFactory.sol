// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/proxy/Clones.sol";

interface IStreamStaker {
    function initialize(address _owner) external;
}

contract StreamStakerFactory {
    address public immutable template;

    constructor(address _template) {
        template = _template;
    }

    function create() external returns (address clone) {
        clone = Clones.clone(template);
    }
}
