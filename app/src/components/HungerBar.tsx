import { motion } from "motion/react";

interface HungerBarProps {
  hunger: number;
}

export default function HungerBar({ hunger }: HungerBarProps) {
  const getColor = () => {
    if (hunger > 60) return "bg-emerald-500";
    if (hunger > 30) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between items-end mb-4">
        <span className="text-stone-900 text-sm font-bold uppercase tracking-wider">Companion Vitality</span>
        <span className="text-stone-400 text-sm font-semibold">{Math.round(hunger)}%</span>
      </div>
      <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${hunger}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          className={`h-full ${getColor()} transition-colors duration-500 rounded-full`}
        />
      </div>
    </div>
  );
}
