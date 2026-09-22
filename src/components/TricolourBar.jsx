/** A thin saffron–white–green bar — the brand signal, reused from Graphics Studio. */
export default function TricolourBar({ className = '' }) {
  return (
    <div className={`flex h-1.5 w-full ${className}`} aria-hidden="true">
      <div className="flex-1 bg-[#f26a1b]" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[#2f9e44]" />
    </div>
  )
}
