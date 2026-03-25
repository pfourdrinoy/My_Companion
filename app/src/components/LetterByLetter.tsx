import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { WordFromBackend } from "../App";

interface LetterByLetterProps {
  exercise: WordFromBackend;
  onResult: (correct: boolean) => void;
}

// m/f/n → der/die/das
const getGermanArticle = (gender: string | null): string => {
  if (gender === "m") return "der";
  if (gender === "f") return "die";
  if (gender === "n") return "das";
  return "";
};

// m/f/n → le/la/le
const getFrenchArticle = (gender: string | null): string => {
  if (gender === "m") return "le";
  if (gender === "f") return "la";
  if (gender === "n") return "le";
  return "";
};

// Capitalise la première lettre (les noms allemands prennent une majuscule)
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const LetterByLetter: React.FC<LetterByLetterProps> = ({ exercise, onResult }) => {
  const article = getGermanArticle(exercise.gender);
  const frArticle = getFrenchArticle(exercise.gender);
  const isNoun = exercise.pos === "noun" && article !== "";

  // Aléatoire : sens de traduction
  const [toGerman] = useState(() => Math.random() > 0.5);

  // Ce qu'on affiche à l'utilisateur
  const displayedWord = toGerman
    ? (isNoun ? `${frArticle} ${exercise.translation}` : exercise.translation)
    : `${article} ${capitalize(exercise.word)}`;

  // Ce que l'utilisateur doit écrire
  const buildExpected = (): string => {
    if (toGerman && isNoun) return `${article} ${capitalize(exercise.word)}`;
    if (toGerman) return exercise.word;
    return exercise.translation;
  };

  const expected = buildExpected();
  const tokens = expected.split("");

  // Index des cases éditables (tout sauf les espaces)
  const editableIndexes = tokens
    .map((t, i) => t !== " " ? i : null)
    .filter((i): i is number => i !== null);

  const [values, setValues] = useState<string[]>(tokens.map(t => t === " " ? " " : ""));
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[editableIndexes[0]]?.focus();
  }, []);

  const focusNext = (currentEditablePos: number) => {
    const next = editableIndexes[currentEditablePos + 1];
    if (next !== undefined) refs.current[next]?.focus();
  };

  const focusPrev = (currentEditablePos: number) => {
    const prev = editableIndexes[currentEditablePos - 1];
    if (prev !== undefined) refs.current[prev]?.focus();
  };

  const handleChange = (tokenIndex: number, value: string) => {
    if (submitted) return;
    const char = value.slice(-1);
    const newValues = [...values];
    newValues[tokenIndex] = char;
    setValues(newValues);

    if (char) {
      const editablePos = editableIndexes.indexOf(tokenIndex);
      const isLast = editablePos === editableIndexes.length - 1;
      if (isLast) {
        const allFilled = editableIndexes.every(i => newValues[i] !== "");
        if (allFilled) submit(newValues);
      } else {
        focusNext(editablePos);
      }
    }
  };

  const handleKeyDown = (tokenIndex: number, e: React.KeyboardEvent) => {
    if (submitted) return;
    if (e.key === "Backspace") {
      if (values[tokenIndex] !== "") {
        const newValues = [...values];
        newValues[tokenIndex] = "";
        setValues(newValues);
      } else {
        const editablePos = editableIndexes.indexOf(tokenIndex);
        focusPrev(editablePos);
        const prevIndex = editableIndexes[editablePos - 1];
        if (prevIndex !== undefined) {
          const newValues = [...values];
          newValues[prevIndex] = "";
          setValues(newValues);
        }
      }
    }
  };

  const submit = (currentValues: string[]) => {
    const userAnswer = currentValues.join("");
    const isCorrect = userAnswer === expected;
    setCorrect(isCorrect);
    setSubmitted(true);
  };

  const getBoxStyle = (tokenIndex: number): string => {
    if (!submitted) {
      return values[tokenIndex]
        ? "border-stone-900 bg-white text-stone-900"
        : "border-stone-200 bg-white text-stone-400";
    }
    return values[tokenIndex] === tokens[tokenIndex]
      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
      : "border-rose-400 bg-rose-50 text-rose-700";
  };

  return (
    <div className="w-full max-w-xl premium-card p-12 flex flex-col gap-10">

      {/* Consigne */}
      <div className="text-center flex flex-col gap-2">
        <span className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em]">
          {toGerman ? "Translate to German" : "Translate to French"}
        </span>
        <h3 className="text-4xl font-extrabold text-stone-900 tracking-tight">
          {displayedWord}
        </h3>
        {exercise.pos && (
          <span className="text-stone-300 text-xs font-bold uppercase tracking-widest">
            {exercise.pos}
          </span>
        )}
        {isNoun ? (
          <p className="text-amber-600 text-sm font-bold mt-1">
            ⚠️ Déduire le déterminant · Respecter la majuscule
          </p>
        ) : (
          <p className="text-stone-400 text-sm font-medium mt-1">
            ⚠️ Respecter la casse
          </p>
        )}
      </div>

      {/* Cases */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        {tokens.map((token, i) => {
          if (token === " ") {
            return (
              <div
                key={i}
                className="w-10 h-14 rounded-xl bg-stone-100 border-2 border-stone-200"
              />
            );
          }
          return (
            <motion.input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text"
              value={values[i]}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={submitted}
              maxLength={2}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`w-10 h-14 text-center text-lg font-extrabold border-2 rounded-xl transition-all focus:outline-none focus:scale-105 ${getBoxStyle(i)}`}
            />
          );
        })}
      </div>

      {/* Bouton soumettre */}
      {!submitted && (
        <button
          onClick={() => submit(values)}
          disabled={editableIndexes.some(i => values[i] === "")}
          className="w-full premium-button-primary py-4 text-lg disabled:opacity-30"
        >
          Verify
        </button>
      )}

      {/* Résultat */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-2xl flex items-center justify-between border ${
              correct ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
            }`}
          >
            <div className="flex items-center gap-4">
              {correct
                ? <CheckCircle2 size={28} className="text-emerald-600" />
                : <XCircle size={28} className="text-rose-600" />
              }
              <div>
                <p className="font-bold text-lg text-stone-900">
                  {correct ? "Perfect!" : "Not quite..."}
                </p>
                {!correct && (
                  <p className="text-stone-600 font-medium">
                    Réponse : <span className="font-bold">{expected}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onResult(correct)}
              className="bg-white p-3 rounded-xl shadow-sm border border-stone-100 hover:bg-stone-50 transition-all"
            >
              <ArrowRight size={22} className="text-stone-900" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LetterByLetter;