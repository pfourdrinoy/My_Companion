import { motion } from "motion/react";
import { PackageOpen } from "lucide-react";

interface FoodInventoryProps {
  inventory: {
    kibble: number;
    meat: number;
  };
}

export default function FoodInventory({ inventory }: FoodInventoryProps) {
  const items = [
    { id: 'kibble', name: 'Kibble', icon: '🥣', count: inventory.kibble, desc: 'Earned from Vocabulary' },
    { id: 'meat', name: 'Steak', icon: '🍖', count: inventory.meat, desc: 'Earned from Grammar' },
  ];

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center gap-6 mb-12">
        <div className="bg-stone-900 p-5 rounded-2xl text-white shadow-lg shadow-stone-900/10">
          <PackageOpen size={28} />
        </div>
        <h2 className="text-4xl font-extrabold text-stone-900 tracking-tight">Pantry</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -4 }}
            className="premium-card p-8 flex items-center gap-8"
          >
            <div className="text-5xl bg-stone-50 w-24 h-24 flex items-center justify-center rounded-2xl border border-stone-100">
              {item.icon}
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-bold text-stone-900">{item.name}</h3>
                <span className="text-stone-400 font-bold">×{item.count}</span>
              </div>
              <p className="text-stone-500 font-medium mt-1">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {inventory.kibble === 0 && inventory.meat === 0 && (
        <div className="text-center py-24 bg-white/50 border border-dashed border-stone-200 rounded-[2rem] mt-12">
          <p className="text-stone-400 font-semibold text-lg">Your pantry is currently empty</p>
        </div>
      )}
    </div>
  );
}
