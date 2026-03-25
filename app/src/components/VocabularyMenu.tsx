import React from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

interface VocabularyMenuProps {
  onSelect: (mode: 'card' | 'letter' | 'write') => void;
  onBack: () => void;
}

const VocabularyMenu: React.FC<VocabularyMenuProps> = ({ onSelect, onBack }) => {
  const exercises = [
    {
      mode: 'card' as const,
      emoji: "🃏",
      title: "Flashcard",
      description: "Flip the card to reveal the translation and learn a new word",
    },
    {
      mode: 'letter' as const,
      emoji: "🔡",
      title: "Spelling",
      description: "Write the word letter by letter to verify you master its gender and spelling",
    },
    {
      mode: 'write' as const,
      emoji: "✏️",
      title: "Free writing",
      description: "Type the full translation from memory without any hints",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-8 px-6 w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2.5 text-stone-300 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">Vocabulary</h2>
          <p className="text-stone-400 font-medium">Choose an exercise type</p>
        </div>
      </div>

      {/* Liste des exercices */}
      <div className="flex flex-col gap-4">
        {exercises.map((ex, index) => (
          <motion.button
            key={ex.mode}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => onSelect(ex.mode)}
            className="premium-card p-8 flex items-center gap-6 group hover:shadow-xl hover:shadow-stone-900/5 transition-all text-left"
          >
            <div className="bg-stone-50 p-4 rounded-2xl group-hover:bg-stone-100 transition-colors text-3xl">
              {ex.emoji}
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900">{ex.title}</h3>
              <p className="text-stone-400 text-sm font-medium mt-1">{ex.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default VocabularyMenu;