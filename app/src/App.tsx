import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Utensils, BookOpen, LayoutDashboard, Trophy, LogOut, ChevronDown } from "lucide-react";
import Dog from "./components/Dog";
import HungerBar from "./components/HungerBar";
import ExerciseCard from "./components/ExerciseCard";
import GrammarExercise from "./components/GrammarExercise";
import FoodInventory from "./components/FoodInventory";
import Auth from "./components/Auth";
import AddVocabulary from "./components/AddVocabulary";
import VocabularyList from "./components/VocabularyList";
import LetterByLetter from "./components/LetterByLetter";
import VocabularyMenu from "./components/VocabularyMenu";

type Screen = "dashboard" | "exercise" | "pantry" | "success" | "addWord" | "vocabularyList" | "vocabularyMenu";
type VocabMode = 'card' | 'letter' | 'write';
type SessionType = 'vocabulary' | 'grammar' | 'conjugation';

export type Language = { language: string; label: string; flag: string };

export type WordFromBackend = {
  id: number;
  word: string;
  translation: string;
  pos: string | null;
  gender: string | null;
  word_determiner: string | null;
  translation_determiner: string | null;
  mastery_score: number;
  correct_count: number;
  wrong_count: number;
};

const BASE_URL = "http://localhost:8000";

export default function App() {
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [hunger, setHunger] = useState(85);
  const [streak, setStreak] = useState(7);
  const [inventory, setInventory] = useState({ kibble: 3, meat: 1 });
  const [isEating, setIsEating] = useState(false);
  const [vocabMode, setVocabMode] = useState<VocabMode>('card');
  const [enrolledLanguages, setEnrolledLanguages] = useState<Language[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<Language | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Exercise State
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionExercises, setSessionExercises] = useState<WordFromBackend[]>([]);
  const [sessionType, setSessionType] = useState<SessionType>('vocabulary');
  const [correctCount, setCorrectCount] = useState(0);

  // --- Effects ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchLanguages = async () => {
      try {
        const res = await authFetch(`${BASE_URL}/user/languages`);
        if (res.ok) {
          const langs: Language[] = await res.json();
          setEnrolledLanguages(langs);
          if (langs.length > 0) setActiveLanguage(langs[0]);
        }
      } catch (e) {
        console.error("Failed to fetch languages", e);
      }
    };
    fetchLanguages();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      setHunger(prev => Math.max(0, prev - 0.5));
    }, 5000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    if (!langDropdownOpen) return;
    const handler = () => setLangDropdownOpen(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [langDropdownOpen]);

  // --- Handlers ---

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password })
      });
      if (!response.ok) throw new Error("Login failed");
      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

const handleRegister = async (username: string, password: string, nativeLanguage: string) => {
  try {
    const response = await fetch(`${BASE_URL}/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username, 
        password, 
        native: nativeLanguage
      })
    });
    if (!response.ok) throw new Error("Registration failed");
    await handleLogin(username, password);
  } catch (error) {
    console.error("Register error:", error);
  }
};

  const authFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setScreen("dashboard");
    setEnrolledLanguages([]);
    setActiveLanguage(null);
  };

  const startSession = async (type: SessionType) => {
    const langName = activeLanguage?.language;
    if (!langName) {
      console.error("Aucune langue active sélectionnée");
      return;
    }

    try {
      let words: WordFromBackend[] = [];

      if (type === 'vocabulary') {
        const extractScalar = (data: unknown): string => {
          if (Array.isArray(data)) return String(data[0] ?? "");
          return String(data ?? "");
        };

        const results = await Promise.allSettled(
          Array.from({ length: 5 }).map(() =>
            authFetch(`${BASE_URL}/ai/get/new_word?language_learnt=${langName}`, { method: "POST" })
              .then(r => r.json())
              .then(async (rawWord: unknown) => {
                const newWord = extractScalar(rawWord);
                const base: WordFromBackend = {
                  id: Math.random(),
                  word: newWord,
                  translation: "",
                  pos: null,
                  gender: null,
                  word_determiner: null,
                  translation_determiner: null,
                  mastery_score: 0,
                  correct_count: 0,
                  wrong_count: 0,
                };

                const [translationRes, posRes, wordDetRes] = await Promise.allSettled([
                  authFetch(`${BASE_URL}/ai/translate/word?word=${encodeURIComponent(newWord)}&language_learnt=${langName}`, { method: "POST" }).then(r => r.json()),
                  authFetch(`${BASE_URL}/ai/get/word_pos?word=${encodeURIComponent(newWord)}&language_learnt=${langName}`, { method: "POST" }).then(r => r.json()),
                  authFetch(`${BASE_URL}/ai/get/word_determiner?word=${encodeURIComponent(newWord)}&language_learnt=${langName}`, { method: "POST" }).then(r => r.json()),
                ]);

                const translation = translationRes.status === "fulfilled" ? extractScalar(translationRes.value) : "";
                const pos = posRes.status === "fulfilled" ? posRes.value as string : null;
                const word_determiner = wordDetRes.status === "fulfilled" ? wordDetRes.value as string | null : null;

                let translation_determiner: string | null = null;
                if (translation) {
                  const transDetRes = await authFetch(
                    `${BASE_URL}/ai/get/word_determiner?word=${encodeURIComponent(translation)}&language_learnt=english`,
                    { method: "POST" }
                  ).then(r => r.json()).catch(() => null);
                  translation_determiner = transDetRes as string | null;
                }

                return { ...base, translation, pos, word_determiner, translation_determiner };
              })
          )
        );

        words = results
          .filter((r): r is PromiseFulfilledResult<WordFromBackend> => r.status === "fulfilled")
          .map(r => r.value);

      } else {
        const response = await authFetch(`${BASE_URL}/exercises/${type}?limit=5`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des exercices");
        words = await response.json();
      }

      const finalWords = [...words].sort(() => 0.5 - Math.random());
      setSessionExercises(finalWords);
      setSessionType(type);
      setCurrentExerciseIndex(0);
      setCorrectCount(0);
      setScreen("exercise");
    } catch (error) {
      console.error("Erreur startSession:", error);
    }
  };

  const startVocabularySession = async (mode: VocabMode) => {
    setVocabMode(mode);
    await startSession('vocabulary');
  };

  const handleExerciseResult = (correct: boolean) => {
    if (correct) setCorrectCount(prev => prev + 1);

    if (currentExerciseIndex < sessionExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      const rewardCount = Math.ceil((correctCount + (correct ? 1 : 0)) / 2);
      if (sessionType === 'vocabulary') {
        setInventory(prev => ({ ...prev, kibble: prev.kibble + rewardCount }));
      } else {
        setInventory(prev => ({ ...prev, meat: prev.meat + rewardCount }));
      }
      setScreen("success");
    }
  };

  const feedDog = () => {
    if (inventory.kibble > 0 || inventory.meat > 0) {
      setIsEating(true);
      setHunger(prev => Math.min(100, prev + 15));
      if (inventory.meat > 0) {
        setInventory(prev => ({ ...prev, meat: prev.meat - 1 }));
      } else {
        setInventory(prev => ({ ...prev, kibble: prev.kibble - 1 }));
      }
      setTimeout(() => setIsEating(false), 2000);
    }
  };

  // --- Render Helpers ---
  const renderHeader = () => (
    <header className="flex justify-between items-center p-8 max-w-6xl mx-auto w-full">
      {/* Gauche : streak + logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 bg-white px-5 py-2.5 rounded-2xl border border-stone-100 shadow-sm">
          <Flame className="text-orange-500" size={20} fill="currentColor" />
          <span className="font-bold text-lg text-stone-900">{streak}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2.5 text-stone-300 hover:text-stone-900 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Droite : sélecteur langue + inventaire + livre */}
      <div className="flex items-center gap-3">

        {/* Sélecteur de langue active */}
        {enrolledLanguages.length > 0 && (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLangDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-stone-100 shadow-sm hover:border-stone-300 transition-all font-semibold text-stone-700"
            >
              <span className="text-lg">{activeLanguage?.flag ?? "🏳️"}</span>
              <span className="text-sm">{activeLanguage?.label ?? "Select"}</span>
              <ChevronDown size={14} className={`text-stone-400 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 bg-white border border-stone-100 rounded-2xl shadow-xl z-50 min-w-[160px] overflow-hidden"
                >
                  {enrolledLanguages.map(lang => (
                    <button
                      key={lang.language}
                      onClick={() => { setActiveLanguage(lang); setLangDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors
                        ${activeLanguage?.language === lang.language
                          ? "bg-stone-900 text-white"
                          : "text-stone-700 hover:bg-stone-50"}`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      {lang.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-stone-100 shadow-sm">
          <span className="text-lg">🥣</span>
          <span className="font-bold text-stone-900">{inventory.kibble}</span>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-stone-100 shadow-sm">
          <span className="text-lg">🍖</span>
          <span className="font-bold text-stone-900">{inventory.meat}</span>
        </div>

        <button
          onClick={() => setScreen("vocabularyList")}
          title="My Vocabulary"
          className={`p-2.5 rounded-xl border transition-all ${
            screen === "vocabularyList"
              ? "bg-stone-900 text-white border-stone-900 shadow-md"
              : "bg-white text-stone-400 border-stone-100 shadow-sm hover:text-stone-900 hover:border-stone-200"
          }`}
        >
          <BookOpen size={20} />
        </button>
      </div>
    </header>
  );

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const renderDashboard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-12 px-6 pb-32 w-full max-w-4xl mx-auto"
    >
      <div className="relative mt-4 flex flex-col items-center">
        <div className="scale-110 sm:scale-125">
          <Dog hunger={hunger} isEating={isEating} />
        </div>
        {isEating && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-0 right-0 bg-white p-3 rounded-full shadow-xl border border-stone-100"
          >
            <span className="text-2xl">✨</span>
          </motion.div>
        )}
      </div>

      <div className="w-full max-w-md">
        <HungerBar hunger={hunger} />
      </div>

      {enrolledLanguages.length === 0 && (
        <div className="w-full max-w-md bg-amber-50 border border-amber-100 text-amber-800 px-6 py-4 rounded-2xl font-semibold text-sm text-center">
          ⚠️ No language enrolled yet. Add one via <code className="font-mono">POST /user/languages/&#123;language&#125;</code>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <button
          onClick={() => setScreen("vocabularyMenu")}
          disabled={!activeLanguage}
          className="premium-card p-8 flex flex-col items-center gap-6 group hover:shadow-xl hover:shadow-stone-900/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="bg-stone-50 p-4 rounded-2xl group-hover:bg-stone-100 transition-colors">
            <BookOpen size={28} className="text-stone-900" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-stone-900">Vocabulary</h3>
            <p className="text-stone-400 text-sm font-medium mt-1">Earn kibble for your friend</p>
          </div>
        </button>

        <button
          onClick={() => startSession('grammar')}
          disabled={!activeLanguage}
          className="premium-card p-8 flex flex-col items-center gap-6 group hover:shadow-xl hover:shadow-stone-900/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="bg-stone-50 p-4 rounded-2xl group-hover:bg-stone-100 transition-colors">
            <Utensils size={28} className="text-stone-900" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-stone-900">Grammar</h3>
            <p className="text-stone-400 text-sm font-medium mt-1">Earn premium treats</p>
          </div>
        </button>

        <button
          onClick={() => startSession('conjugation')}
          disabled={!activeLanguage}
          className="premium-card p-8 flex flex-col items-center gap-6 group hover:shadow-xl hover:shadow-stone-900/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="bg-stone-50 p-4 rounded-2xl group-hover:bg-stone-100 transition-colors">
            <span className="text-2xl">🔤</span>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-stone-900">Conjugation</h3>
            <p className="text-stone-400 text-sm font-medium mt-1">Master verb forms</p>
          </div>
        </button>

        <button
          onClick={feedDog}
          disabled={(inventory.kibble === 0 && inventory.meat === 0) || isEating}
          className="sm:col-span-2 premium-button-success py-5 text-lg flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="font-bold tracking-tight">{isEating ? "Enjoying meal..." : "Feed Your Companion"}</span>
          <span className="text-xl">🥣</span>
        </button>
      </div>
    </motion.div>
  );

  const renderExercise = () => {
    const current = sessionExercises[currentExerciseIndex];
    const progress = ((currentExerciseIndex + 1) / sessionExercises.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-8 px-6 w-full max-w-2xl mx-auto"
      >
        <div className="w-full flex items-center gap-6">
          <div className="h-2 flex-1 bg-stone-200 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-stone-900 rounded-full"
            />
          </div>
          <span className="text-stone-400 font-bold text-sm">
            {currentExerciseIndex + 1} of {sessionExercises.length}
          </span>
        </div>

        {sessionType === 'vocabulary' && vocabMode === 'card' && (
          <ExerciseCard key={current.id} exercise={current} onResult={handleExerciseResult} authFetch={authFetch} />
        )}
        {sessionType === 'vocabulary' && vocabMode === 'letter' && (
          <LetterByLetter key={current.id} exercise={current} onResult={handleExerciseResult} />
        )}
        {sessionType === 'vocabulary' && vocabMode === 'write' && (
          <GrammarExercise key={current.id} exercise={current} onResult={handleExerciseResult} />
        )}
        {sessionType === 'grammar' && (
          <GrammarExercise key={current.id} exercise={current} onResult={handleExerciseResult} />
        )}
        {sessionType === 'conjugation' && (
          <LetterByLetter key={current.id} exercise={current} onResult={handleExerciseResult} />
        )}

        <button
          onClick={() => setScreen("dashboard")}
          className="text-stone-400 hover:text-stone-600 font-medium transition-colors"
        >
          Quit Session
        </button>
      </motion.div>
    );
  };

  const renderSuccess = () => (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center gap-12 px-6 py-12 text-center"
    >
      <div className="bg-emerald-50 p-10 rounded-[2.5rem] border border-emerald-100 text-emerald-600 shadow-xl shadow-emerald-600/5">
        <Trophy size={72} />
      </div>
      <div>
        <h2 className="text-5xl font-extrabold text-stone-900 tracking-tight mb-4">Session Complete</h2>
        <p className="text-stone-500 text-xl font-medium">You've earned rewards for your companion.</p>
      </div>

      <div className="flex gap-6">
        <div className="premium-card p-10 flex flex-col items-center min-w-[180px]">
          <span className="text-7xl mb-6">{sessionType === 'vocabulary' ? '🥣' : '🍖'}</span>
          <span className="font-bold text-2xl text-stone-900">+{Math.ceil(correctCount / 2)} Rewards</span>
        </div>
      </div>

      <button
        onClick={() => setScreen("dashboard")}
        className="premium-button-primary px-16 py-5 text-lg"
      >
        Return to Dashboard
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {screen !== "exercise" && renderHeader()}

      <main className="flex-1 flex flex-col items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {screen === "dashboard" && renderDashboard()}
          {screen === "exercise" && renderExercise()}
          {screen === "pantry" && (
            <div className="px-6 w-full flex flex-col items-center">
              <FoodInventory inventory={inventory} />
              <button
                onClick={() => setScreen("dashboard")}
                className="mt-8 text-stone-400 hover:text-stone-600 font-medium"
              >
                Back
              </button>
            </div>
          )}
          {screen === "success" && renderSuccess()}

          {screen === "vocabularyList" && (
            <VocabularyList
              onBack={() => setScreen("dashboard")}
              onAddWord={() => setScreen("addWord")}
              authFetch={authFetch}
              enrolledLanguages={enrolledLanguages}
            />
          )}

          {screen === "addWord" && (
            <AddVocabulary
              onBack={() => setScreen("vocabularyList")}
              authFetch={authFetch}
              enrolledLanguages={enrolledLanguages}
            />
          )}

          {screen === "vocabularyMenu" && (
            <VocabularyMenu
              onSelect={(mode) => startVocabularySession(mode)}
              onBack={() => setScreen("dashboard")}
            />
          )}
        </AnimatePresence>
      </main>

      {screen !== "exercise" && (
        <nav className="fixed bottom-0 left-0 right-0 glass-nav px-8 py-6 flex justify-around items-center z-50">
          <button
            onClick={() => setScreen("dashboard")}
            className={`flex flex-col items-center gap-2 transition-all ${screen === "dashboard" ? "text-stone-900" : "text-stone-300 hover:text-stone-500"}`}
          >
            <LayoutDashboard size={24} className={screen === "dashboard" ? "fill-stone-900/10" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
          </button>
          <button
            onClick={() => setScreen("pantry")}
            className={`flex flex-col items-center gap-2 transition-all ${screen === "pantry" ? "text-stone-900" : "text-stone-300 hover:text-stone-500"}`}
          >
            <Utensils size={24} className={screen === "pantry" ? "fill-stone-900/10" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Pantry</span>
          </button>
        </nav>
      )}
    </div>
  );
}