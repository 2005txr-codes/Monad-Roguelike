import { useEffect, useRef, useCallback } from 'react'

export default function GameCanvas({
  game,
  onAction,
  onDie,
  onCashOut,
  onMoveConfirmed,
}: {
  game: any
  onAction: (action: string, dir: string) => void
  onDie: () => void
  onCashOut: () => void
  onMoveConfirmed: (msg: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const CELL = 40
    const COLS = 14
    const ROWS = 10
    canvas.width = COLS * CELL
    canvas.height = ROWS * CELL

    // Clear
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL, 0)
      ctx.lineTo(x * CELL, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * CELL)
      ctx.lineTo(canvas.width, y * CELL)
      ctx.stroke()
    }

    // Draw entities: You (blue square)
    ctx.fillStyle = '#22d3ee'
    ctx.fillRect(2 * CELL + 4, 5 * CELL + 4, CELL - 8, CELL - 8)
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px monospace'
    ctx.fillText('You', 2 * CELL + 6, 5 * CELL + 22)

    // Player 2 (green square)
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(5 * CELL + 4, 2 * CELL + 4, CELL - 8, CELL - 8)
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px monospace'
    ctx.fillText('Player 2', 5 * CELL + 6, 2 * CELL + 22)

    // Enemy slime (red square)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(6 * CELL + 4, 5 * CELL + 4, CELL - 8, CELL - 8)
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px monospace'
    ctx.fillText('Slime', 6 * CELL + 6, 5 * CELL + 22)

    // Chest (orange square)
    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(12 * CELL + 4, 2 * CELL + 4, CELL - 8, CELL - 8)

    // Gravestone + ghost (purple ghost, grey gravestone)
    const gx = 7 * CELL + 4
    const gy = 6 * CELL + 4
    
    // Gravestone
    ctx.fillStyle = '#9ca3af'
    ctx.fillRect(gx + 8, gy + 16, CELL - 24, CELL - 20)
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px monospace'
    ctx.fillText('+', gx + CELL/2 - 4, gy + CELL - 6)

    // Ghost above gravestone
    ctx.fillStyle = '#a855f7'
    ctx.beginPath()
    ctx.arc(gx + CELL/2, gy + 4, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px monospace'
    ctx.fillText('Ghost', gx + CELL/2 - 14, gy - 6)

    // Stairs / Next floor
    ctx.fillStyle = '#475569'
    ctx.fillRect(13 * CELL + 4, 8 * CELL + 4, CELL - 8, CELL - 8)
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px monospace'
    ctx.fillText('>', 13 * CELL + 14, 8 * CELL + 22)

    // Labels for ghost
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px monospace'
    ctx.fillText('Ghost of 0x4f2a, loot inside', gx - 20, gy + CELL + 14)
  }, [])

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-[#1e293b]">
      <canvas ref={canvasRef} className="border border-slate-600 rounded bg-[#0f172a] shadow-2xl" />
    </div>
  )
}
