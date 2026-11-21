---
"@azx/ribo-cli": minor
---

The corpus loader refuses a case whose transcript or text input repeats one of the manifest's
few-shot examples. The prompt shows the model that example's answer, so such a case grades copying,
not extraction, and inflates every aggregate it enters (the defect doc 18's correction records). A
repeat is found by shared 8-word phrases, not equality: the refusal fires when at least half of the
input's phrases appear in one example, so an example later extended, trimmed or reformatted still
counts. The refusal is a `CorpusError` (exit 2) naming the case, the input file, the example's index
and the share. Document inputs are not compared: their text exists only after transcription.
