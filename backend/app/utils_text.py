import re

STOP = set("""
a an the and or but if then of to in on at for from with without into onto is are was were be been being
i you he she it we they this that these those as by about
""".split())

def extract_vocab(text: str, top_k: int = 30):
    words = re.findall(r"[A-Za-z']+", (text or "").lower())
    freq = {}
    for w in words:
        if len(w) < 3:
            continue
        if w in STOP:
            continue
        freq[w] = freq.get(w, 0) + 1
    ranked = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_k]
    return [w for w, _ in ranked]

def make_sample_sentences(words):
    out = []
    for w in (words or [])[:10]:
        out.append(f"I will practice the word '{w}' every day.")
        out.append(f"Can you use '{w}' in a sentence?")
    return out
