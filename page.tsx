import { useEffect, useRef, useState, useCallback } from 'react'
import GameCanvas from '@/components/GameCanvas'
import HUD from '@/components/HUD'
import Toast from '@/components/Toast'
import { useGame } from '@/hooks/useGame'
import { connectWallet } from '@/hooks/useWallet'

export default function Page() {
  const { walletClient, address, isConnected, connect, error } = useWallet()
  const game = useGame(walletClient, address)

  return (
    <div className="w-full h-screen bg-[#0f172a] text-slate-100 flex flex-col overflow-hidden">
      <HUD 
        hp={game.hp} 
        maxHp={game.maxHp} 
        floor={game.floor} 
        players={game.players} 
        prizePool={game.prizePool} 
      />
      
      <div className="flex-1 relative bg-[#1e293b] border-b border-slate-700 overflow-hidden">
        <GameCanvas 
          game={game}
          onAction={game.handleAction}
          onDie={game.handleDie}
          onCashOut={game.handleCashOut}
          onMoveConfirmed={game.onMoveConfirmed}
        />
        
        <Toast message={game.toastMessage} visible={game.toastVisible} />
      </div>

      <div className="h-12 bg-[#0f172a] border-t border-slate-700 flex items-center justify-between px-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>Entry 0.1 MON · testnet</span>
          <span>Daily seed · run {game.seed}</span>
        </div>
        <div className="flex items-center gap-4">
          {isConnected ? (
            <>
              <span className="text-green-400">● Connected</span>
              <span className="truncate max-w-xs">{address}</span>
            </>
          ) : (
            <button 
              onClick={connect}
              className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-slate-200 transition"
            >
              Connect Wallet
            </button>
          )}
          {error && <span className="text-red-400 text-xs">{error}</span>}
        </div>
      </div>
    </div>
  )
}
