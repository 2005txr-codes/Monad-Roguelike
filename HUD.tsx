export default function HUD({ hp, maxHp, floor, players, prizePool }: { hp: number; maxHp: number; floor: number; players: number; prizePool: number }) {
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  
  return (
    <div className="h-14 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">HP</span>
          <div className="w-32 h-3 bg-slate-800 rounded overflow-hidden border border-slate-600">
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${hpPct}%` }}
            ></div>
          </div>
          <span className="text-xs text-slate-300">{hp}/{maxHp}</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded border border-slate-700">
          <span className="text-xs text-slate-400">Floor</span>
          <span className="text-sm font-mono text-emerald-400">{floor}</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded border border-slate-700">
          <span className="text-xs text-slate-400">Players</span>
          <span className="text-sm font-mono text-emerald-400">{players}</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded border border-slate-700">
          <span className="text-xs text-slate-400">Prize pool</span>
          <span className="text-sm font-mono text-amber-400">{prizePool} MON</span>
        </div>
      </div>
      
      <div className="text-xs text-slate-400">
        Monad Blitz@Guangzhou • Hackathon Demo
      </div>
    </div>
  )
}
