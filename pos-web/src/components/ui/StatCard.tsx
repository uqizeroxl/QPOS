import type { LucideIcon } from "lucide-react";
import Card from "./Card";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: "blue" | "red" | "green" | "amber";
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: StatCardProps) {
  const toneStyles = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">{value}</h2>
        </div>

        <div className={`rounded-lg p-3 ring-1 ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">{description}</p>
    </Card>
  );
}
