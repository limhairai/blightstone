import type { LucideIcon } from "lucide-react";

export interface NavChildItem {
  name: string;
  path: string;
  icon?: LucideIcon; // Optional icon for child items
}

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  isNew?: boolean; // Optional new badge
  children?: NavChildItem[]; // Optional children for expandable sections
} 