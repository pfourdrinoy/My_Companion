OLLAMA_URL   = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = "zongwei/gemma3-translator:4b"
MAX_RETRIES  = 3

VOWELS = set("aeiouâêîôûàèùéëïü")

LANG_CODES = {"french": "fr", "spanish": "es", "german": "de", "english": "en"}

SPACY_MODELS = {"french": "fr_core_news_sm", "spanish": "es_core_news_sm", "german": "de_core_news_sm"}
SPACY_GENDER_MAP = {"Masc": "Masculine", "Fem": "Feminine", "Neut": "Neuter"}
SPACY_POS_MAP = {
    "NOUN": "noun", "VERB": "verb", "ADJ": "adjective", "ADV": "adverb",
    "PRON": "pronoun", "ADP": "preposition", "CCONJ": "conjunction",
    "SCONJ": "conjunction", "INTJ": "interjection",
}

DETERMINERS = {
    "french":  {"Masculine": "le",  "Feminine": "la"},
    "spanish": {"Masculine": "el",  "Feminine": "la"},
    "german":  {"Masculine": "der", "Feminine": "die", "Neuter": "das"},
}

VALID_POS = {"noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", "interjection"}