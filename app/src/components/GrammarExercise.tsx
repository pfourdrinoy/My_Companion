import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { WordFromBackend } from "../App";

interface GrammarExerciseProps {
  exercise: WordFromBackend;
  onResult: (correct: boolean) => void;
}

const GrammarExercise: React.FC<GrammarExerciseProps> = ({ exercise, onResult }) => {
  const [showWord] = useState(() => Math.random() > 0.5);
  const [input, setInput] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const displayed = showWord ? exercise.word : exercise.translation;

  // Si on demande le mot allemand (nom), la réponse inclut le déterminant
  const buildExpected = (): string => {
    const target = showWord ? exercise.translation : exercise.word;
    if (!showWord && exercise.pos === "noun" && exercise.gender) {
      return `${exercise.gender} ${target}`;
    }
    return target;
  };

  const expected = buildExpected();
  const needsDeterminer = !showWord && exercise.pos === "noun" && exercise.gender;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted) return;
    // Vérification avec casse exacte
    const correct = input.trim() === expected.trim();
    setIsCorrect(correct);
    setIsSubmitted(true);
  };

  return (
    <div className="w-full max-w-xl premium-card p-12">
      <div className="mb-8">
        {/* Label */}
        <span className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em] block mb-4">
          {showWord ? "Translate to French" : "Translate to German"}
        </span>

        {/* Mot affiché */}
        <h3 className="text-3xl font-bold text-stone-900 leading-snug tracking-tight">
          {displayed}
        </h3>
        {exercise.pos && (
          <span className="text-stone-300 text-xs font-bold uppercase tracking-widest mt-2 block">
            {exercise.pos}
          </span>
        )}

        {/* Avertissements */}
        {needsDeterminer ? (
          <p className="mt-4 text-amber-600 text-sm font-bold">
            ⚠️ Inclure le déterminant (der/die/das) · Attention à la majuscule
          </p>
        ) : (
          <p className="mt-4 text-stone-400 text-sm font-medium">
            ⚠️ Attention à la casse (majuscules/minuscules)
          </p>
        )}

        {/* Exemple de format attendu */}
        {needsDeterminer && (
          <p className="mt-1 text-stone-300 text-sm font-medium italic">
            Format attendu : der/die/das + Mot
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isSubmitted}
          placeholder={needsDeterminer ? "ex: der Hund" : "Votre réponse..."}
          className="w-full px-8 py-5 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all text-2xl font-semibold"
          autoFocus
        />

        {!isSubmitted ? (
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full premium-button-primary py-5 text-lg disabled:opacity-30"
          >
            Verify
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-2xl flex items-center justify-between border ${
              isCorrect
                ? "bg-emerald-50 border-emerald-100 text-emerald-900"
                : "bg-rose-50 border-rose-100 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-6">
              {isCorrect
                ? <CheckCircle2 size={32} className="text-emerald-600" />
                : <XCircle size={32} className="text-rose-600" />
              }
              <div>
                <p className="font-bold text-xl">{isCorrect ? "Excellent!" : "Incorrect"}</p>
                {!isCorrect && (
                  <p className="text-stone-600 font-medium">
                    Réponse : <span className="font-bold">{expected}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onResult(isCorrect)}
              className="bg-white p-3 rounded-xl shadow-sm border border-stone-100 hover:bg-stone-50 transition-all"
            >
              <ArrowRight size={24} className="text-stone-900" />
            </button>
          </motion.div>
        )}
      </form>
    </div>
  );
};

export default GrammarExercise;