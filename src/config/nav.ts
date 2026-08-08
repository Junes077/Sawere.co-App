import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Calendar,
  Video,
  ListChecks,
  FileSignature,
  Receipt,
  Sparkles,
  Settings,
  BookOpenText,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export interface NavItem {
  /** Key into dict.nav for the translated label. */
  key: keyof Dictionary["nav"];
  href: string;
  icon: LucideIcon;
  /** Marks modules that ship as architected extension points, not yet fully live. */
  comingSoon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "clients", href: "/clients", icon: Users },
  { key: "cases", href: "/cases", icon: Briefcase },
  { key: "documents", href: "/documents", icon: FileText },
  { key: "calendar", href: "/calendar", icon: Calendar },
  { key: "meetings", href: "/meetings", icon: Video },
  { key: "tasks", href: "/tasks", icon: ListChecks },
  { key: "legalResearch", href: "/legal-research", icon: BookOpenText, comingSoon: true },
  { key: "contracts", href: "/contracts", icon: FileSignature },
  { key: "invoices", href: "/invoices", icon: Receipt },
  { key: "aiAssistant", href: "/ai-assistant", icon: Sparkles },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  key: "settings",
  href: "/settings",
  icon: Settings,
};
