export default function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null
  
  return (
    <div className="absolute bottom-20 left-4 bg-emerald-900/90 border border-emerald-500/50 text-emerald-100 px-4 py-2 rounded text-sm font-mono shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      {message}
    </div>
  )
}
