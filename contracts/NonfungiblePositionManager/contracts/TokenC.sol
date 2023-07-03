// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenC is ERC20 {
    constructor() ERC20("TokenC", "TC") {
        _mint(msg.sender, 10000 * 10 ** decimals());
    }
}