async def _ollama(prompt: str) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=120.0,
        )
    r.raise_for_status()
    return r.json()["response"].strip()


async def _ollama_retry(prompt: str, validator, max_retries: int = MAX_RETRIES) -> str:
    last_error = None
    for _ in range(max_retries):
        try:
            return validator(await _ollama(prompt))
        except ValueError as e:
            last_error = e
        except httpx.HTTPStatusError as e:
            raise HTTPException(502, f"Ollama HTTP error: {e}")
        except httpx.RequestError as e:
            raise HTTPException(502, f"Ollama connection error: {e}")
    raise HTTPException(502, f"Ollama failed after {max_retries} attempts. Last error: {last_error}")

# ---------------------------------------------------------------------------
# Validators
# ---------------------------------------------------------------------------

def _max(n: int):
    def v(raw: str) -> str:
        if not raw:        raise ValueError("Empty response")
        if len(raw) > n:   raise ValueError("Response too long")
        return raw
    return v


def _single_word(raw: str) -> str:
    w = raw.lower().strip()
    if len(w.split()) > 1:
        raise ValueError("More than one word")
    return w


def _valid_pos(raw: str) -> str:
    pos = raw.strip().lower()
    if pos not in VALID_POS:
        raise ValueError(f"Unknown POS: {raw!r}")
    return pos


def _not_known(known: list[str]):
    def v(raw: str) -> str:
        w = _single_word(raw)
        if w in known:
            raise ValueError(f"Word already known: {w!r}")
        return w
    return v
