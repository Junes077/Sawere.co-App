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

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Marks modules that ship as architected extension points, not yet fully live. */
  comingSoon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Cases", href: "/cases", icon: Briefcase },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Meetings", href: "/meetings", icon: Video },
  { label: "Tasks", href: "/tasks", icon: ListChecks },
  { label: "Legal Research", href: "/legal-research", icon: BookOpenText, comingSoon: true },
  { label: "Contracts", href: "/contracts", icon: FileSignature },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
};
