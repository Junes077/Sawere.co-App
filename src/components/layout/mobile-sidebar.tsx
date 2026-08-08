"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { Dictionary } from "@/lib/i18n";

export function MobileSidebar({
  firmName,
  logoUrl,
  dict,
}: {
  firmName: string;
  logoUrl: string | null;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
        <Menu />
      </Button>
      <SheetContent
        side="left"
        className="w-72 max-w-[80vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gold/15 text-gold">
              {logoUrl ? (
                <Image src={logoUrl} alt={firmName} width={32} height={32} className="size-full object-cover" unoptimized />
              ) : (
                <Scale className="size-4.5" />
              )}
            </span>
            <SheetTitle className="truncate text-sidebar-foreground">{firmName}</SheetTitle>
          </Link>
        </SheetHeader>
        <div onClick={() => setOpen(false)}>
          <SidebarNav dict={dict} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
