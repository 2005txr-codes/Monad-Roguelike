// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "script/utils.s.sol"; // or your Foundry setup
import "../contracts/BlitzRoguelike.sol";

contract DeployScript is Script {
    function run() public {
        vm.broadcast();

        BlitzRoguelike contract = new BlitzRoguelike{value: 0}();
        contract.startRun(0x0000000000000000000000000000000000000000);

        console.log("Deployed BlitzRoguelike at:", address(contract));
    }
}
