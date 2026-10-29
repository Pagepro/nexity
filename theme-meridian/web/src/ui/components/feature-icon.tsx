import {
  Activity,
  AudioWaveform,
  Bell,
  Blocks,
  ChartLine,
  CircleCheck,
  Crosshair,
  Database,
  Globe,
  Headset,
  KeyRound,
  LayoutDashboard,
  Lock,
  PiggyBank,
  type LucideIcon,
  type LucideProps,
  MessageSquare,
  Plug,
  Scale,
  ScrollText,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  UserCog,
  UserMinus,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { stegaClean } from "next-sanity";

import type { FeatureIconValue } from "@/consts/feature-icons";

const FEATURE_ICON_MAP = {
  target: Target,
  "chart-line": ChartLine,
  "audio-waveform": AudioWaveform,
  activity: Activity,
  "layout-dashboard": LayoutDashboard,
  blocks: Blocks,
  plug: Plug,
  sparkles: Sparkles,
  zap: Zap,
  users: Users,
  "message-square": MessageSquare,
  bell: Bell,
  database: Database,
  workflow: Workflow,
  "shield-check": ShieldCheck,
  lock: Lock,
  "key-round": KeyRound,
  globe: Globe,
  timer: Timer,
  "user-minus": UserMinus,
  crosshair: Crosshair,
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
  "circle-check": CircleCheck,
  server: Server,
  headset: Headset,
  scale: Scale,
  "scroll-text": ScrollText,
  "user-cog": UserCog,
} satisfies Record<FeatureIconValue, LucideIcon>;

interface FeatureIconProps extends LucideProps {
  icon: string | null | undefined;
}

export const FeatureIcon = ({ icon, ...props }: FeatureIconProps) => {
  const IconComponent = icon
    ? FEATURE_ICON_MAP[stegaClean(icon) as FeatureIconValue]
    : undefined;

  return IconComponent ? <IconComponent aria-hidden {...props} /> : null;
};
