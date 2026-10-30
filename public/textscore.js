// Shared by the Worker (Whisper, Google) and the browser (Web Speech).
// Transcript-based engines can't hear individual sounds, so this scores how
// closely the recognised word matches the target. Near misses cap at 85.
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z' ]/g, "").trim();

export function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// alts: [{transcript, confidence?}] best first. Returns {accuracy, heard}.
export function scoreText(target, alts) {
  const t = norm(target);
  let best = { accuracy: 0, heard: (alts[0] && alts[0].transcript || "").trim() };
  alts.forEach((a, rank) => {
    for (const w of norm(a.transcript).split(/\s+/).filter(Boolean)) {
      const sim = 1 - lev(w, t) / Math.max(w.length, t.length, 1);
      const conf = typeof a.confidence === "number" ? a.confidence : 1;
      let acc = 100 * sim * (0.6 + 0.4 * conf) * (rank ? 0.9 : 1);
      if (sim < 1) acc = Math.min(acc, 85);
      if (acc > best.accuracy) best = { accuracy: Math.round(acc), heard: a.transcript.trim() };
    }
  });
  return best;
}
