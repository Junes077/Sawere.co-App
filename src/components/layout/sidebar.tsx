import Link from "next/link";
import Image from "next/image";
import { Scale } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { Dictionary } from "@/lib/i18n";

export function Sidebar({
  firmName,
  logoUrl,
  dict,
}: {
  firmName: string;
  logoUrl: string | null;
  dict: Dictionary;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gold/15 text-gold">
          {logoUrl ? (
            <Image src={logoUrl} alt={firmName} width={32} height={32} className="size-full object-cover" unoptimized />
          ) : (
            <Scale className="size-4.5" />
          )}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-serif text-sm font-medium tracking-wide">{firmName}</p>
          <p className="text-[11px] text-sidebar-foreground/60">Legal Operating System</p>
        </div>
      </Link>
      <SidebarNav dict={dict} />
    </aside>
  );
}
