// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BlitzRoguelike {
    uint256 public immutable ENTRY_FEE = 1e18;        // 1 MON
    uint256 public immutable MAX_PAYOUT_PER_RUN = 5e18; // 5 MON cap

    uint256 public prizePool;

    struct Run {
        uint256 seed;
        uint8 floor;
        uint256 score;
        bool active;
        bool extracted;
    }

    struct Gravestone {
        uint256 runId;
        address player;
        uint256 seed;
        uint8 floor;
        uint256 posX;
        uint256 posY;
        uint256 finalScore;
        uint256 diedAt;
        bool lootClaimed;
        bool ghostDefeated;
    }

    mapping(address => Run) public activeRuns;
    mapping(uint256 => mapping(uint256 => Gravestone[])) public gravestones;
    mapping(address => uint256) public bestScore;
    mapping(address => uint256) public totalPayout;

    uint256 public runCounter;

    event RunStarted(address indexed player, uint256 runId, uint256 seed);
    event RunResultSubmitted(address indexed player, uint256 runId, uint256 score, bool died);
    event GravestonePersisted(uint256 indexed runId, address indexed player, uint256 seed, uint8 floor);
    event PayoutSettled(address indexed player, uint256 amount, uint256 score);

    modifier activeRun(address player) {
        require(activeRuns[player].active, "No active run");
        _;
    }

    function startRun(uint256 seed) public payable returns (uint256) {
        require(msg.value == ENTRY_FEE, "Entry fee must be exactly 1 MON");
        require(!activeRuns[msg.sender].active, "Already has active run");

        prizePool += msg.value;
        runCounter++;

        activeRuns[msg.sender] = Run({
            seed: seed,
            floor: 1,
            score: 0,
            active: true,
            extracted: false
        });

        emit RunStarted(msg.sender, runCounter, seed);
        return runCounter;
    }

    function submitResult(
        uint256 runId,
        uint256 seed,
        uint8 floor,
        uint256 score,
        bool died
    ) public activeRun(msg.sender) {
        Run storage run = activeRuns[msg.sender];
        require(!run.extracted, "Run already extracted");
        require(run.seed == seed, "Seed mismatch");

        run.extracted = true;
        run.active = false;
        run.score = score;

        uint256 payout = calculatePayout(score);
        if (payout > 0) {
            require(prizePool >= payout, "Insufficient prize pool");
            prizePool -= payout;
            payable(msg.sender).transfer(payout);
        }

        if (score > bestScore[msg.sender]) {
            bestScore[msg.sender] = score;
        }
        totalPayout[msg.sender] += payout;

        emit RunResultSubmitted(msg.sender, runId, score, died);
        emit PayoutSettled(msg.sender, payout, score);
    }

    function persistGravestone(
        uint256 runId,
        uint256 seed,
        uint8 floor,
        uint256 posX,
        uint256 posY,
        uint256 finalScore,
        uint256 diedAt
    ) public activeRun(msg.sender) {
        gravestones[seed][floor].push(Gravestone({
            runId: runId,
            player: msg.sender,
            seed: seed,
            floor: floor,
            posX: posX,
            posY: posY,
            finalScore: finalScore,
            diedAt: diedAt,
            lootClaimed: false,
            ghostDefeated: false
        }));

        emit GravestonePersisted(runId, msg.sender, seed, floor);
    }

    function calculatePayout(uint256 score) public view returns (uint256) {
        if (score == 0 || prizePool == 0) return 0;
        uint256 raw = (score * 1e18) / 250; // score / 250 MON
        uint256 capped = raw > MAX_PAYOUT_PER_RUN ? MAX_PAYOUT_PER_RUN : raw;
        return capped > prizePool ? prizePool : capped;
    }

    receive() external payable {}
    fallback() external payable {}
}