import type { LucideIcon } from "lucide-react";
import {
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
  ShieldCheck,
  MapPin,
  Calendar,
  Briefcase,
  BarChart3,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  globe: Globe,
  smartphone: Smartphone,
  users: Users,
  building: Building,
  graduationcap: GraduationCap,
  creditcard: CreditCard,
  shield: Shield,
  shieldcheck: ShieldCheck,
  more: MoreHorizontal,
  morehorizontal: MoreHorizontal,
  default: Circle,
  circle: Circle,
  star: Star,
  shoppingbag: ShoppingBag,
  trendingup: TrendingUp,
  user: User,
  ticket: Ticket,
  target: Target,
  mappin: MapPin,
  map: MapPin,
  calendar: Calendar,
  briefcase: Briefcase,
  chart: BarChart3,
};

// Also allow mapping by friendly category names
const NAME_MAP: Record<string, LucideIcon> = {
  facilities: ShieldCheck,
  "class & instruction": GraduationCap,
  classes: GraduationCap,
  payments: CreditCard,
  billing: CreditCard,
  marketing: Target,
  operations: Briefcase,
  sales: ShoppingBag,
  analytics: BarChart3,
  default: Circle,
};

export function getCategoryIcon(iconNameOrCategory?: string | null): LucideIcon {
  const raw = String(iconNameOrCategory ?? '').trim().toLowerCase();
  if (!raw) return Circle;

  if (ICON_MAP[raw]) return ICON_MAP[raw];
  if (NAME_MAP[raw]) return NAME_MAP[raw];

  // Try to strip non-alphanumeric and match
  const key = raw.replace(/[^a-z0-9]/g, '');
  return ICON_MAP[key] ?? Circle;
}
