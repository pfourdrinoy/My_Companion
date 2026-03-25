import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Send, ArrowLeft } from "lucide-react";

interface WordEntry {
  word: string;
}

interface AddVocabularyProps {
  onBack: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  enrolledLanguages: { language: string; label: string; flag: string }[];
}

const emptyWord = (): WordEntry => ({ word: "" });

const AddVocabulary: React.FC<AddVocabularyProps> = ({ onBack, authFetch, enrolledLanguages }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(enrolledLanguages[0]?.language ?? "");
  const [words, setWords] = useState<WordEntry[]>([emptyWord()]);

  useEffect(() => {
    if (!selectedLanguage && enrolledLanguages.length > 0) {
      setSelectedLanguage(enrolledLanguages[0].language);
    }
  }, [enrolledLanguages]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  const updateWord = (index: number, value: string) =>
    setWords(prev => prev.map((w, i) => (i === index ? { word: value } : w)));

  const addRow = () => setWords(prev => [...prev, emptyWord()]);

  const removeRow = (index: number) => {
    if (words.length === 1) return;
    setWords(prev => prev.filter((_, i) => i !== index));
  };

  const validWords = words.filter(w => w.word.trim());

  const handleSubmit = async () => {
    if (validWords.length === 0 || !selectedLanguage) return;

    setIsSubmitting(true);
    setResult(null);
    try {
      const payload = validWords.map(w => ({
        word: w.word.trim(),
        language: selectedLanguage,
      }));

      const response = await authFetch("http://localhost:8000/vocabulary/add", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to add vocabulary");

      const data = await response.json();
      setResult({ added: data.added.length, skipped: data.skipped.length });
      setWords([emptyWord()]);
    } catch (error) {
      console.error("Error adding vocabulary:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-8 px-6 pb-32 w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2.5 text-stone-300 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">Add Vocabulary</h2>
      </div>

      {/* Language selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Language</label>
        <div className="flex gap-2 flex-wrap">
          {enrolledLanguages.map(lang => (
            <button
              key={lang.language}
              onClick={() => setSelectedLanguage(lang.language)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all
                ${selectedLanguage === lang.language
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
            >
              <span className="text-base">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Success / skip message */}
      <AnimatePresence>
        {result !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-6 py-4 rounded-2xl font-semibold"
          >
            ✅ {result.added} word{result.added !== 1 ? "s" : ""} added
            {result.skipped > 0 && ` · ${result.skipped} skipped (already known)`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word list */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Words</label>
        {words.map((word, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={word.word}
              onChange={e => updateWord(index, e.target.value)}
              placeholder={`Word in ${enrolledLanguages.find(l => l.language === selectedLanguage)?.label ?? "…"}`}
              className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all font-semibold"
            />
            <button
              onClick={() => removeRow(index)}
              disabled={words.length === 1}
              className="p-2 text-stone-300 hover:text-rose-400 transition-colors disabled:opacity-20"
            >
              <Trash2 size={18} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-6 py-3 border border-stone-200 rounded-xl text-stone-600 font-semibold hover:bg-stone-50 transition-all"
        >
          <Plus size={18} />
          Add a row
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || validWords.length === 0 || !selectedLanguage}
          className="flex items-center gap-2 premium-button-primary px-8 py-3 text-base disabled:opacity-50"
        >
          <Send size={18} />
          {isSubmitting ? "Saving..." : `Save ${validWords.length} word${validWords.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </motion.div>
  );
};

export default AddVocabulary;