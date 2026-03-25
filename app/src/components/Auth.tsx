import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Lock, PawPrint } from "lucide-react";

interface AuthProps {
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string, nativeLanguage: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");

  const [availableLangs, setAvailableLangs] = useState<{ language: string, label: string, flag: string }[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/user/languages/available")
      .then(res => res.json())
      .then(data => setAvailableLangs(data))
      .catch(err => console.error("Erreur lors du chargement des langues", err));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      if (isLogin) {
        onLogin(username, password);
      } else {
        onRegister(username, password, nativeLanguage);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F9F9F7]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md premium-card p-12"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="bg-stone-900 p-5 rounded-2xl text-white mb-8 shadow-xl shadow-stone-900/20">
            <PawPrint size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">LinguaPup</h1>
          <p className="text-stone-500 font-medium text-lg mt-2">Your companion for language mastery</p>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-xl mb-10 border border-stone-200">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${isLogin ? "bg-white text-stone-900 shadow-sm" : "text-stone-400"
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${!isLogin ? "bg-white text-stone-900 shadow-sm" : "text-stone-400"
              }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="SamyCristina"
                className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-xl focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-xl focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">
                Langue native
              </label>
              <select
                required
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full px-4 py-4 bg-white border border-stone-200 rounded-xl focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
              >
                <option value="">Choisir une langue</option>
                {availableLangs.map((lang) => (
                  <option key={lang.language} value={lang.language}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full premium-button-primary py-4 text-lg"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;