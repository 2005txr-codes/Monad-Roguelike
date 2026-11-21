import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { monadTestnet } from 'viem/chains';
import { BlitzRoguelikeABI } from './abi';
import { type Gravestone } from './types';

export class Web3ChainAdapter implements ChainAdapter {
  private walletClient: any;
  private contractAddress: `0x${string}`;

  constructor(walletClient: any, contractAddress: `0x${string}`) {
    this.walletClient = walletClient;
    this.contractAddress = contractAddress;
  }

  async onRunStarted(address: string, seed: number, feeMon: number) {
    await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: BlitzRoguelikeABI,
      functionName: 'startRun',
      args: [BigInt(seed)],
      value: parseEther('1.0'),
    });
  }

  async onGravestonePersisted(g: Gravestone) {
    await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: BlitzRoguelikeABI,
      functionName: 'persistGravestone',
      args: [
        BigInt(Date.now()),
        BigInt(g.seed),
        g.floor,
        BigInt(g.pos.x),
        BigInt(g.pos.y),
        BigInt(g.finalScore),
        BigInt(g.diedAt),
      ],
    });
  }

  async onPayoutSettled(address: string, amountMon: number, score: number) {
    console.log(`Payout ${amountMon} MON to ${address} for score ${score}`);
  }
}
