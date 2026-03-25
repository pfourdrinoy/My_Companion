import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Search, Trash2, AlertTriangle, Plus } from "lucide-react";
import { WordFromBackend } from "../App";

interface VocabularyListProps {
  onAddWord: () => void;
  onBack: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  enrolledLanguages: { language: string; label: string; flag: string }[];
}

const VocabularyList: React.FC<VocabularyListProps> = ({ onAddWord, onBack, authFetch, enrolledLanguages }) => {
  const [words, setWords] = useState<WordFromBackend[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [wordToDelete, setWordToDelete] = useState<WordFromBackend | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchWords = async () => {
      setIsLoading(true);
      try {
        const url = selectedLanguage === "all"
          ? "http://localhost:8000/vocabulary/all"
          : `http://localhost:8000/vocabulary/all?language=${selectedLanguage}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error("Failed to load vocabulary");
        setWords(await response.json());
      } catch (error) {
        console.error("Error loading vocabulary:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWords();
  }, [selectedLanguage]);

  const filtered = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!wordToDelete) return;
    setIsDeleting(true);
    try {
      const response = await authFetch(
        `http://localhost:8000/vocabulary/delete?word_id=${wordToDelete.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete");
      setWords(prev => prev.filter(w => w.id !== wordToDelete.id));
      setWordToDelete(null);
    } catch (error) {
      console.error("Error deleting word:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const masteryColor = (score: number) => {
    if (score >= 0.8) return "bg-emerald-100 text-emerald-700";
    if (score >= 0.5) return "bg-amber-100 text-amber-700";
    return "bg-rose-100 text-rose-700";
  };

  const masteryLabel = (score: number) => {
    if (score >= 0.8) return "Mastered";
    if (score >= 0.5) return "Learning";
    return "To review";
  };

  const langMeta = (language: string) =>
    enrolledLanguages.find(l => l.language === language);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col gap-6 px-6 pb-32 w-full max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 text-stone-300 hover:text-stone-900 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">My Vocabulary</h2>
            <p className="text-stone-400 font-medium">{words.length} word{words.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={onAddWord}
            className="ml-auto flex items-center gap-2 bg-stone-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-stone-700 active:scale-95 transition-all"
          >
            <Plus size={15} />
            Add Word
          </button>
        </div>

        {/* Language filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedLanguage("all")}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all
              ${selectedLanguage === "all"
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
          >
            All
          </button>
          {enrolledLanguages.map(lang => (
            <button
              key={lang.language}
              onClick={() => setSelectedLanguage(lang.language)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all
                ${selectedLanguage === lang.language
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
            >
              <span>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search a word..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-2xl focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all font-medium"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center text-stone-400 font-medium py-20">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-stone-400 font-medium py-20">No words found.</div>
        ) : (
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr>
                {["Language", "Word", "Correct", "Wrong", "Mastery", ""].map((h, i) => (
                  <th key={i} className="text-left text-xs font-bold uppercase tracking-widest text-stone-400 pb-1 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((word, index) => {
                  const meta = langMeta(word.language);
                  return (
                    <motion.tr
                      key={word.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.03 }}
                      className="premium-card"
                    >
                      <td className="pl-6 pr-4 py-4 rounded-l-2xl">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-500">
                          <span>{meta?.flag ?? "🏳️"}</span>
                          <span>{meta?.label ?? word.language}</span>
                        </span>
                      </td>
                      <td className="pr-4 py-4 font-bold text-stone-900 first-letter:capitalize">{word.word}</td>
                      <td className="pr-4 py-4 text-emerald-600 font-semibold text-sm">{word.correct_count}</td>
                      <td className="pr-4 py-4 text-rose-400 font-semibold text-sm">{word.wrong_count}</td>
                      <td className="pr-4 py-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${masteryColor(word.mastery_score)}`}>
                          {masteryLabel(word.mastery_score)}
                        </span>
                      </td>
                      <td className="py-4 pr-4 rounded-r-2xl">
                        <button
                          onClick={() => setWordToDelete(word)}
                          className="p-2 text-stone-300 hover:text-rose-500 transition-colors flex justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Delete modal */}
      <AnimatePresence>
        {wordToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6"
            onClick={() => setWordToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl flex flex-col gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="bg-rose-50 p-3 rounded-2xl">
                  <AlertTriangle size={28} className="text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-stone-900">Delete word?</h3>
                  <p className="text-stone-400 font-medium text-sm">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-stone-50 rounded-2xl px-6 py-4 flex items-center gap-3 border border-stone-100">
                <span className="text-lg">{langMeta(wordToDelete.language)?.flag ?? "🏳️"}</span>
                <span className="font-bold text-stone-900">{wordToDelete.word}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setWordToDelete(null)}
                  className="flex-1 py-4 border border-stone-200 rounded-2xl font-bold text-stone-600 hover:bg-stone-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VocabularyList;