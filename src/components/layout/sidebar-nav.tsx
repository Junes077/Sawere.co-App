"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, SETTINGS_NAV_ITEM } from "@/config/nav";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n";

function NavLink({
  item,
  active,
  dict,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  dict: Dictionary;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{dict.nav[item.key]}</span>
      {item.comingSoon && (
        <Badge variant="gold" className="px-1.5 py-0 text-[10px]">
          {dict.nav.soon}
        </Badge>
      )}
    </Link>
  );
}

export function SidebarNav({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} dict={dict} />
        ))}
      </div>
      <div className="mt-4 border-t border-sidebar-border pt-4">
        <NavLink item={SETTINGS_NAV_ITEM} active={pathname.startsWith(SETTINGS_NAV_ITEM.href)} dict={dict} />
      </div>
    </nav>
  );
}
