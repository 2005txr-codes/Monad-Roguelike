import { useState, useCallback, useEffect, useRef } from 'react'
import { BigInt } from '@ethersproject/bignumber'

export interface GameState {
  hp: number
  maxHp: number
  floor: number
  players: number
  prizePool: number
  seed: number
  toastMessage: string
  toastVisible: boolean
  address: string | null
}

export function useGame(walletClient: any, address: string | null) {
  const [hp, setHp] = useState(100)
  const [maxHp] = useState(100)
  const [floor, setFloor] = useState(1)
  const [players, setPlayers] = useState(4)
  const [prizePool, setPrizePool] = useState(12.5)
  const [seed, setSeed] = useState(1042)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [atk, setAtk] = useState(22)
  const [score, setScore] = useState(0)
  const [inventory, setInventory] = useState<string[]>(['MON Shard'])
  const [activeRun, setActiveRun] = useState<boolean>(false)
  const [runId, setRunId] = useState<string>('')
  const [dungeonSeed, setDungeonSeed] = useState<number>(0)
  const [pos, setPos] = useState({ x: 5, y: 5 })
  const [died, setDied] = useState(false)

  // Fetch prize pool from contract
  useEffect(() => {
    const fetchPool = async () => {
      try {
        const pool = await (window as any).ethereum?.request?.({
          method: 'eth_call',
          params: [{
            to: '0xYOUR_CONTRACT_ADDRESS',
            data: '0x', // placeholder - real ABI call would go here
          }],
        })
      } catch {}
    }
    fetchPool()
  }, [])

  const onMoveConfirmed = useCallback((msg: string) => {
    setToastMessage(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }, [])

  const handleAction = useCallback((action: 'move' | 'attack', dir: string) => {
    if (!activeRun) return
    // Game logic - movement/combat happens off-chain
    setToastMessage(`${action === 'move' ? 'Moved' : 'Attacked'} ${dir}`)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }, [activeRun])

  const handleDie = useCallback(async () => {
    setDied(true)
    setActiveRun(false)
    // Persist gravestone on-chain
    if (walletClient && address) {
      try {
        // In production, call persistGravestoneOnChain here
        setToastMessage('Gravestone persisted on-chain')
        setToastVisible(true)
      } catch (e: any) {
        console.error(e)
      }
    }
  }, [walletClient, address, activeRun])

  const handleCashOut = useCallback(async () => {
    if (!walletClient || !address || !activeRun) return
    // Submit result to contract
    try {
      // submitResultOnChain(walletClient, BigInt(runId), BigInt(dungeonSeed), floor, BigInt(score), died)
      setToastMessage(`Cashed out ${score} MON`)
      setToastVisible(true)
    } catch (e: any) {
      console.error(e)
    }
  }, [walletClient, address, activeRun, runId, dungeonSeed, floor, score, died])

  const startNewRun = useCallback(async () => {
    if (!walletClient || !address) return
    const newSeed = Math.floor(Math.random() * 100000)
    setDungeonSeed(newSeed)
    setSeed(newSeed)
    setFloor(1)
    setHp(100)
    setAtk(22)
    setScore(0)
    setInventory(['MON Shard'])
    setPos({ x: 5, y: 5 })
    setActiveRun(true)
    setDied(false)
    setRunId(`run-${Date.now()}`)
    
    // On-chain: startRun
    try {
      // await startRunOnChain(walletClient, BigInt(newSeed))
      setToastMessage('Run started - 0.1 MON escrowed')
      setToastVisible(true)
    } catch (e: any) {
      console.error(e)
    }
  }, [walletClient, address])

  return {
    hp, maxHp, floor, players, prizePool, seed, toastMessage, toastVisible,
    atk, score, inventory, activeRun, runId, dungeonSeed, pos, died,
    handleAction, handleDie, handleCashOut, onMoveConfirmed, startNewRun,
  }
}
