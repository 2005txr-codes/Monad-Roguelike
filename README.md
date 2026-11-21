# Monad Blitz Roguelike

2D multiplayer roguelike for Monad Blitz@Guangzhou hackathon.

## Architecture
- **Off-chain:** Real-time movement, combat, enemy AI, dungeon generation (TypeScript + HTML5 Canvas)
- **On-chain:** Entry fee escrow, payouts, tombstones, leaderboard (Solidity + Foundry)

## Deploy contracts
```bash
forge install OpenZeppelin/openzeppelin-contracts
forge script script/Deploy.s.sol --rpc-url $MONAD_RPC --private-key $PRIVATE_KEY --broadcast
```

## Run frontend
```bash
cd web
npm install
npm run dev
```

## Submission
Demo link: your Vercel URL
GitHub: public repo
