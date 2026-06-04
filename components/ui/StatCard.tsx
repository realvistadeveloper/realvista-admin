// components/ui/StatCard.tsx
import { clsx } from "clsx";
import { LucideIcon } from "lucide-react";

type Color = "default" | "green" | "red" | "blue" | "amber" | "purple";

const colorMap: Record<Color, { bg: string; icon: string; value: string }> = {
  default: { bg: "bg-zinc-50", icon: "text-zinc-400", value: "text-zinc-900" },
  green: { bg: "bg-green-50", icon: "text-green-500", value: "text-green-700" },
  red: { bg: "bg-red-50", icon: "text-red-500", value: "text-red-700" },
  blue: { bg: "bg-blue-50", icon: "text-blue-500", value: "text-blue-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-500", value: "text-amber-700" },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-500",
    value: "text-purple-700",
  },
};

interface StatCardProps {
  label: string;
  value: number | null | undefined;
  icon: LucideIcon;
  color?: Color;
  placeholder?: string; // shown instead of "—" when value is null/undefined
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "default",
  placeholder,
}: StatCardProps) {
  const c = colorMap[color];

  const displayValue =
    value != null ? value.toLocaleString() : (placeholder ?? "—");

  const isPlaceholder = value == null && placeholder != null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-3">
      <div
        className={clsx(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          c.bg,
        )}
      >
        <Icon className={clsx("w-4 h-4", c.icon)} />
      </div>
      <div>
        <p
          className={clsx(
            "font-bold tabular-nums",
            isPlaceholder
              ? "text-sm text-zinc-400 italic"
              : clsx("text-2xl", c.value),
          )}
        >
          {displayValue}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
