// analysis.js — all computation, browser-only. Nothing leaves the page.

const PHONE_RE = /\+?\d[\d\s\-]{7,}\d/;
const SWITCH_RE = /whatsapp|instagram|\binsta\b|\bsnap\b|\btelegram\b|my number|your number|exchange numbers|move (this )?(to|off)|@\w+/i;
const PLAN_RE = /\b(coffee|drink|dinner|lunch|brunch|date|meet up|grab a|are you free|this weekend|tomorrow|tonight|let'?s (do|grab|meet|get))\b/i;

const STOPWORDS = new Set(("a an and the to of in on for is are am was were be been being do does did doing have has had having i you we he she it they them me my your our their so but or if then than that this these those at by with as not no yes ok okay oh ah hey hi hello yeah yep nah lol u ur im ive id ill its dont cant wont thats whats lets gonna wanna kinda sorta about up out down over under here there what when where who how why which whom can will would could should may might must shall into onto from get got go going went come came make made like just really very too also more most some any all one two now well good bad thing things stuff way got know going get said say says told tell also even still much many lot bit").split(/\s+/));

// Collapse laughter and common varispellings into single tokens
function normalizeToken(w) {
  if (/^(ha){2,}h?$|^(hah)+a?$|^l+o+l+$|^l+m+a+o+$|^h+a+h+a+/.test(w)) return "[laughter]";
  if (/^(so+|ye+a+h*|ya+|yess+|nooo+|omg+)$/.test(w)) return null; // filler exclamations
  return w;
}

function sortedMessages(t) {
  return (t.chats || [])
    .filter((c) => c && c.body)
    .slice()
    .sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));
}
function isRealMatch(t) { return Object.prototype.hasOwnProperty.call(t, "match"); }
function matchTimestamp(t) {
  const m = (t.match || [])[0];
  return m && m.timestamp ? m.timestamp : null;
}
function monthKey(ts) { return ts ? ts.slice(0, 7) : null; } // YYYY-MM
function reachedPlan(text) { return PHONE_RE.test(text) || SWITCH_RE.test(text) || PLAN_RE.test(text); }

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z']+/g) || [])
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .map(normalizeToken)
    .filter((w) => w && (w === "[laughter]" || (w.length > 2 && !STOPWORDS.has(w))));
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function analyze(raw) {
  if (!Array.isArray(raw)) throw new Error("That file doesn't look like a Hinge matches export.");

  const likes = raw.filter((t) => !isRealMatch(t)).length;
  const matches = raw.filter(isRealMatch);
  const convos = matches.filter((m) => sortedMessages(m).length > 0);

  // ---- funnel (honest: reached a number or plan, not "dates") ----
  let reached = 0;
  for (const m of matches) {
    const text = sortedMessages(m).map((x) => x.body).join(" ");
    if (reachedPlan(text)) reached++;
  }

  // ---- per-month series ----
  const matchesByMonth = {};   // month -> count of matches
  const reachedByMonth = {};   // month -> count reached plan
  const msgsByMonth = {};      // month -> total your messages
  const convosByMonth = {};    // month -> count of conversations started

  for (const m of matches) {
    const mk = monthKey(matchTimestamp(m));
    if (!mk) continue;
    matchesByMonth[mk] = (matchesByMonth[mk] || 0) + 1;
    const msgs = sortedMessages(m);
    const text = msgs.map((x) => x.body).join(" ");
    if (reachedPlan(text)) reachedByMonth[mk] = (reachedByMonth[mk] || 0) + 1;
    if (msgs.length) {
      convosByMonth[mk] = (convosByMonth[mk] || 0) + 1;
      msgsByMonth[mk] = (msgsByMonth[mk] || 0) + msgs.length;
    }
  }

  const allMonths = Object.keys(matchesByMonth).sort();
  const series = allMonths.map((mk) => ({
    key: mk,
    label: monthLabel(mk),
    matches: matchesByMonth[mk] || 0,
    reached: reachedByMonth[mk] || 0,
    convos: convosByMonth[mk] || 0,
    msgs: msgsByMonth[mk] || 0,
    depth: convosByMonth[mk] ? Math.round((msgsByMonth[mk] / convosByMonth[mk]) * 10) / 10 : 0,
  }));

  const peakMatches = series.reduce((a, b) => (b.matches > a.matches ? b : a), series[0] || {});
  const peakFlow = series.filter((s) => s.convos >= 2).reduce(
    (a, b) => (b.depth > (a ? a.depth : -1) ? b : a), null
  ) || peakMatches;

  // ---- words, phrases, openers (your messages only) ----
  const wordCounts = {};
  const phraseCounts = {};
  const openers = {};
  let totalWords = 0;

  for (const m of convos) {
    const msgs = sortedMessages(m);
    // opener = first message, normalized
    const first = (msgs[0].body || "").trim();
    if (first) {
      const norm = first.toLowerCase().replace(/[^a-z0-9\s']/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
      if (norm) openers[norm] = (openers[norm] || 0) + 1;
    }
    for (const msg of msgs) {
      const toks = tokenize(msg.body);
      totalWords += toks.length;
      for (const w of toks) wordCounts[w] = (wordCounts[w] || 0) + 1;
      // 2- and 3-grams from raw lowercased words (incl. stopwords for natural phrases)
      const rawToks = (msg.body.toLowerCase().match(/[a-z']+/g) || []);
      for (let n = 2; n <= 3; n++) {
        for (let i = 0; i + n <= rawToks.length; i++) {
          const gram = rawToks.slice(i, i + n).join(" ");
          // skip grams that are entirely stopwords-ish noise
          if (gram.length < 6) continue;
          phraseCounts[gram] = (phraseCounts[gram] || 0) + 1;
        }
      }
    }
  }

  const topWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 30)
    .map(([word, n]) => ({ word, n }));

  const topPhrases = Object.entries(phraseCounts)
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([phrase, n]) => ({ phrase, n }));

  const topOpeners = Object.entries(openers)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([text, n]) => ({ text, n }));

  // ---- conversation depth stats ----
  const lens = convos.map((m) => sortedMessages(m).length).sort((a, b) => a - b);
  const median = lens.length ? lens[Math.floor(lens.length / 2)] : 0;

  return {
    funnel: {
      likes,
      matches: matches.length,
      conversations: convos.length,
      reached,
    },
    series,
    peakMatches,
    peakFlow,
    conversation: {
      count: convos.length,
      median,
      longest: lens.length ? lens[lens.length - 1] : 0,
      totalMessages: lens.reduce((a, b) => a + b, 0),
      totalWords,
    },
    text: { topWords, topPhrases, topOpeners },
    contrast: computeContrast(matches),
    monthsCovered: allMonths.length,
  };
}

// ---- section 10: clicked vs fizzled ----
function gapsMinutes(msgs) {
  const ts = msgs.map((x) => new Date(x.timestamp)).filter((d) => !isNaN(d)).sort((a, b) => a - b);
  const g = [];
  for (let i = 1; i < ts.length; i++) g.push((ts[i] - ts[i - 1]) / 60000);
  return g;
}
function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function fmtGap(min) {
  if (min == null) return "—";
  if (min < 90) return `${Math.round(min)} min`;
  if (min < 60 * 36) return `${Math.round(min / 60)} hr`;
  return `${Math.round(min / 1440)} days`;
}
function computeContrast(matches) {
  const clicked = matches.filter((m) => (m.we_met || []).some((w) => w.did_meet_subject === "Yes"));
  const talked = matches.filter((m) => {
    const ms = sortedMessages(m);
    const txt = ms.map((z) => z.body).join(" ");
    return ms.length >= 2 && !reachedPlan(txt) && !(m.we_met || []).some((w) => w.did_meet_subject === "Yes")
      && Object.prototype.hasOwnProperty.call(m, "block");
  });
  const bottom10 = [...talked].sort((a, b) => sortedMessages(a).length - sortedMessages(b).length).slice(0, 10);
  const realFizzles = talked.filter((m) => sortedMessages(m).length >= 4);

  function groupStats(group) {
    const lens = group.map((m) => sortedMessages(m).length);
    const allGaps = group.flatMap((m) => gapsMinutes(sortedMessages(m)));
    const wc = {};
    for (const m of group) for (const w of tokenize(sortedMessages(m).map((x) => x.body).join(" "))) wc[w] = (wc[w] || 0) + 1;
    return { n: group.length, medLen: median(lens), medGap: median(allGaps), words: wc };
  }
  const A = groupStats(clicked);

  function buildFizzled(group, clickedWords) {
    const G = groupStats(group);
    const distinct = Object.entries(clickedWords)
      .filter(([w, c]) => c >= 4 && (clickedWords[w] || 0) > (G.words[w] || 0))
      .sort((a, b) => b[1] - a[1]).slice(0, 12).map(([word, n]) => ({ word, n }));
    return {
      n: G.n, medLen: G.medLen, medGap: G.medGap, medGapLabel: fmtGap(G.medGap),
      distinctWords: distinct,
    };
  }

  // days from match -> first plan/number, for clicked group
  const daysToPlan = [];
  for (const m of clicked) {
    const ms = sortedMessages(m);
    const matchTs = (m.match || [])[0] && (m.match || [])[0].timestamp;
    let planTs = null;
    for (const x of ms) if (reachedPlan(x.body)) { planTs = x.timestamp; break; }
    if (planTs && matchTs) {
      const d = (new Date(planTs) - new Date(matchTs)) / 86400000;
      if (d >= 0) daysToPlan.push(Math.round(d * 10) / 10);
    }
  }

  // anonymized example shapes (clicked), sorted by length desc, top 3
  const examples = clicked.map((m) => {
    const ms = sortedMessages(m);
    const matchTs = (m.match || [])[0] && (m.match || [])[0].timestamp;
    let planTs = null;
    for (const x of ms) if (reachedPlan(x.body)) { planTs = x.timestamp; break; }
    const dtp = (planTs && matchTs) ? Math.round((new Date(planTs) - new Date(matchTs)) / 86400000 * 10) / 10 : null;
    return {
      messages: ms.length,
      words: ms.reduce((a, z) => a + (z.body.split(/\s+/).length), 0),
      gap: median(gapsMinutes(ms)),
      daysToPlan: dtp,
    };
  }).sort((a, b) => b.messages - a.messages).slice(0, 3);

  return {
    clicked: { n: A.n, medLen: A.medLen, medGap: A.medGap, medGapLabel: fmtGap(A.medGap) },
    fizzledStrict: buildFizzled(bottom10, A.words),
    fizzledMiddle: buildFizzled(realFizzles, A.words),
    medDaysToPlan: median(daysToPlan),
    examples,
    talkedPoolSize: talked.length,
  };
}

if (typeof window !== "undefined") window.__analyze = analyze;
if (typeof module !== "undefined") module.exports = { analyze };
