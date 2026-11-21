'use client'

import { useState, useEffect, useCallback } from 'react'
import { createWalletClient, custom, parseEther } from 'viem'
import { MONAD_TESTNET, makeWalletClient, startRunOnChain, submitResultOnChain, persistGravestoneOnChain, getPrizePool } from '@/lib/viem'
import { BlitzRoguelikeABI } from '@/contracts/abi'

export function useWallet() {
  const [walletClient, setWalletClient] = useState<any>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        setError('Please install MetaMask or a Web3 wallet')
        return
      }
      
      const provider = (window as any).ethereum
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      if (accounts.length === 0) throw new Error('No accounts')
      
      const addr = accounts[0] as `0x${string}`
      const client = createWalletClient({
        account: addr,
        chain: MONAD_TESTNET,
        transport: custom(provider),
      })
      
      // Try to switch to Monad testnet
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${MONAD_TESTNET.id.toString(16)}` }],
        })
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${MONAD_TESTNET.id.toString(16)}`,
                chainName: 'Monad Testnet',
                nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
                rpcUrls: ['https://testnet-rpc.monad.xyz'],
                blockExplorerUrls: ['https://testnet.monad.xyz'],
              }],
            })
          } catch (addError) {
            console.error('Failed to add network', addError)
          }
        }
      }

      setWalletClient(client)
      setAddress(addr)
      setIsConnected(true)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Connection failed')
    }
  }

  return { walletClient, address, isConnected, connect, error }
}
