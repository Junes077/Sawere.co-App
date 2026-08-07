import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import type { User } from "@prisma/client";

export function Topbar({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <MobileSidebar />
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients, cases, documents…"
          className="pl-9"
          aria-label="Global search"
        />
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell />
        </Button>
        <ThemeToggle />
        <UserMenu
          fullName={user.fullName}
          email={user.email}
          avatarUrl={user.avatarUrl}
          title={user.title}
        />
      </div>
    </header>
  );
}
