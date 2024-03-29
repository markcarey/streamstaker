// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/proxy/Clones.sol";

interface IStreamStaker {
    function initialize(address _owner) external;
}

contract StreamStakerFactory {
    address public immutable template;

    event StreamStakerCreated(address indexed owner, address clone);

    constructor(address _template) {
        template = _template;
    }

    function create() external returns (address clone) {
        clone = Clones.clone(template);
        IStreamStaker(clone).initialize(msg.sender);
        emit StreamStakerCreated(msg.sender, clone);
    }
}
