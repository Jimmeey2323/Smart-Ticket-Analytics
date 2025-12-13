import type { LucideIcon } from "lucide-react";
import {
  Building,
  Circle,
  CreditCard,
  Globe,
  GraduationCap,
  MoreHorizontal,
  Shield,
  ShoppingBag,
  Smartphone,
  Star,
  Target,
  Ticket,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Globe,
  Smartphone,
  Users,
  Building,
  GraduationCap,
  CreditCard,
  Shield,
  MoreHorizontal,
  Circle,
  Star,
  ShoppingBag,
  TrendingUp,
  User,
  Ticket,
  Target,
};

export function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Circle;
  return ICON_MAP[iconName] ?? Circle;
}
