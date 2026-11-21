import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { BlitzRoguelikeABI } from '@/contracts/abi'

export const MONAD_TESTNET = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { httpUrls: ['https://testnet-rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'Monad Testnet Explorer', url: 'https://testnet.monad.xyz' } },
} as const

export const publicClient = createPublicClient({
  chain: MONAD_TESTNET,
  transport: http('https://testnet-rpc.monad.xyz'),
})

export function makeWalletClient(account: `0x${string}`) {
  return createWalletClient({
    account,
    chain: MONAD_TESTNET,
    transport: http('https://testnet-rpc.monad.xyz'),
  })
}

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

export async function startRunOnChain(walletClient: any, seed: bigint) {
  return walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: BlitzRoguelikeABI,
    functionName: 'startRun',
    args: [seed],
    value: parseEther('0.1'),
  })
}

export async function submitResultOnChain(
  walletClient: any,
  runId: bigint,
  seed: bigint,
  floor: number,
  score: bigint,
  died: boolean
) {
  return walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: BlitzRoguelikeABI,
    functionName: 'submitResult',
    args: [runId, seed, floor, score, died],
  })
}

export async function persistGravestoneOnChain(
  walletClient: any,
  runId: bigint,
  seed: bigint,
  floor: number,
  posX: bigint,
  posY: bigint,
  finalScore: bigint,
  diedAt: bigint
) {
  return walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: BlitzRoguelikeABI,
    functionName: 'persistGravestone',
    args: [runId, seed, floor, posX, posY, finalScore, diedAt],
  })
}

export async function getPrizePool() {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: BlitzRoguelikeABI,
    functionName: 'prizePool',
  })
}
