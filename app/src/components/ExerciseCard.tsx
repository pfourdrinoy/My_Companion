import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";
import { WordFromBackend } from "../App";

interface ExerciseCardProps {
  exercise: WordFromBackend;
  onResult: (correct: boolean) => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onResult, authFetch }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFlip = async () => {
    if (isFlipped) { setIsFlipped(false); return; }

    setIsFlipped(true);

    if (translation !== null) return;

    setIsLoading(true);
    try {
      const res = await authFetch(
        `http://localhost:8000/ai/translate/word?word=${encodeURIComponent(exercise.word)}&language_learnt=${encodeURIComponent(exercise.language)}`
      );
      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();
      setTranslation(typeof data === "string" ? data : data.translation ?? "—");
    } catch {
      setTranslation("—");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div
        className="relative w-full aspect-[3/4] cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden premium-card flex flex-col p-10">
            <span className="self-start text-stone-400 text-xs font-bold uppercase tracking-[0.2em] bg-stone-100 px-3 py-1 rounded-full">
              Target Word
            </span>

            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <h3 className="text-6xl font-extrabold text-stone-900 tracking-tight first-letter:capitalize leading-tight">
                {exercise.word}
              </h3>
              <span className="text-stone-400 text-xs font-bold uppercase tracking-widest border border-stone-200 px-3 py-1 rounded-full">
                {exercise.language}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-stone-300 text-sm font-medium">
              <RotateCcw size={14} />
              <span>Tap to reveal</span>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 backface-hidden bg-stone-900 rounded-[2rem] flex flex-col p-10 shadow-2xl"
            style={{ transform: "rotateY(180deg)" }}
          >
            <span className="self-start text-stone-500 text-xs font-bold uppercase tracking-[0.2em] bg-stone-800 px-3 py-1 rounded-full">
              Translation
            </span>

            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              {isLoading ? (
                <Loader2 size={32} className="text-stone-400 animate-spin" />
              ) : (
                <h3 className="text-6xl font-extrabold text-white tracking-tight first-letter:capitalize leading-tight">
                  {translation}
                </h3>
              )}
            </div>

            <div className="flex justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Buttons */}
      <AnimatePresence>
        {isFlipped && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3 w-full"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onResult(false); }}
              className="flex-1 premium-button-secondary py-4 flex items-center justify-center gap-2 text-stone-500 rounded-2xl"
            >
              <X size={18} />
              <span className="text-sm font-semibold">Review Again</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onResult(true); }}
              className="flex-1 premium-button-success py-4 flex items-center justify-center gap-2 rounded-2xl"
            >
              <Check size={18} />
              <span className="text-sm font-semibold">Mastered</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExerciseCard;