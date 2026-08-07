import { Scale } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-navy px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--gold-soft) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="mb-8 flex flex-col items-center gap-3 text-cream">
          <span className="flex size-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <Scale className="size-6" />
          </span>
          <div className="text-center">
            <p className="font-serif text-xl tracking-wide">Sawere &amp; Company Advocates</p>
            <p className="text-xs text-cream/60">AI-powered Legal Operating System</p>
          </div>
        </div>
        <div className="w-full rounded-2xl border border-white/10 bg-card p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
