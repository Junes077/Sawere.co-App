import Link from "next/link";
import { Scale } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-gold/15 text-gold">
          <Scale className="size-4.5" />
        </span>
        <div className="leading-tight">
          <p className="font-serif text-sm font-medium tracking-wide">Sawere &amp; Co.</p>
          <p className="text-[11px] text-sidebar-foreground/60">Legal Operating System</p>
        </div>
      </Link>
      <SidebarNav />
    </aside>
  );
}
