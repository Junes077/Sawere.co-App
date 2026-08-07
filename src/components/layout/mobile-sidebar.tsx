"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function MobileSidebar() {
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
            <span className="flex size-8 items-center justify-center rounded-md bg-gold/15 text-gold">
              <Scale className="size-4.5" />
            </span>
            <SheetTitle className="text-sidebar-foreground">Sawere &amp; Co.</SheetTitle>
          </Link>
        </SheetHeader>
        <div onClick={() => setOpen(false)}>
          <SidebarNav />
        </div>
      </SheetContent>
    </Sheet>
  );
}
