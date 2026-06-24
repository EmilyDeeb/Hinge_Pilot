const { useState, useRef, useEffect } = React;

const C = {
  bg: "#FBF9F5", ink: "#2B2723", inkSoft: "#6B645B", inkFaint: "#A39C90",
  clay: "#C77B54", clayDeep: "#A35E3B", sage: "#7A8B6F", cold: "#D8D2C6", line: "#E8E2D6",
};
const serif = "'Fraunces', Georgia, serif";
const sans = "'Inter', system-ui, sans-serif";
const fmt = (n) => (n == null ? "—" : n.toLocaleString("en-US"));
const prettyWord = (w) => (w === "[laughter]" ? "laughter 😄" : w);

// ---------- scroll reveal ----------
function Reveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el); return () => io.disconnect();
  }, []);
  return React.createElement("div", {
    ref,
    style: {
      opacity: shown ? 1 : 0,
      transform: shown ? "none" : "translateY(28px)",
      transition: `opacity .8s ease ${delay}s, transform .8s cubic-bezier(.22,1,.36,1) ${delay}s`,
      ...style,
    },
  }, children);
}

// ---------- info button ----------
function Info({ text }) {
  const [open, setOpen] = useState(false);
  return React.createElement("span", { style: { position: "relative", display: "inline-block", marginLeft: 8, verticalAlign: "middle" } },
    React.createElement("button", {
      onClick: () => setOpen(!open),
      "aria-label": "How this was calculated",
      style: {
        width: 20, height: 20, borderRadius: "50%", border: `1px solid ${C.inkFaint}`,
        background: open ? C.clay : "transparent", color: open ? "#fff" : C.inkFaint,
        cursor: "pointer", fontSize: 12, lineHeight: "18px", fontFamily: serif, padding: 0,
      },
    }, "i"),
    open && React.createElement("span", {
      style: {
        position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)",
        width: 260, background: C.ink, color: "#fff", padding: "12px 14px", borderRadius: 10,
        fontSize: 13, lineHeight: 1.5, fontFamily: sans, zIndex: 30, textAlign: "left",
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)", fontWeight: 400,
      },
    }, text)
  );
}

// ---------- section shell ----------
function Section({ kicker, children, bg, info }) {
  return React.createElement("section", {
    style: { position: "relative", zIndex: 1, padding: "12vh 1.5rem", background: bg || "transparent",
      borderTop: bg ? `1px solid ${C.line}` : "none", borderBottom: bg ? `1px solid ${C.line}` : "none" },
  },
    React.createElement("div", { style: { maxWidth: 760, margin: "0 auto" } },
      kicker && React.createElement(Reveal, null,
        React.createElement("p", { style: { fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase",
          color: C.inkFaint, marginBottom: "1.5rem", textAlign: "center" } },
          kicker, info && React.createElement(Info, { text: info }))
      ),
      children
    )
  );
}

// big bold headline + supporting stat
function Hero({ big, sub }) {
  return React.createElement(Reveal, { delay: 0.1 },
    React.createElement("h2", { style: { fontFamily: serif, fontWeight: 500, letterSpacing: "-0.02em",
      fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 1.05, textAlign: "center", marginBottom: "1.25rem" } }, big),
    sub && React.createElement("p", { style: { textAlign: "center", color: C.inkSoft, fontSize: "1.1rem",
      maxWidth: 540, margin: "0 auto" } }, sub)
  );
}

// ---------- bar chart (monthly) ----------
function MonthBars({ series, field, color, peakKey }) {
  const max = Math.max(...series.map((s) => s[field]), 1);
  return React.createElement(Reveal, { delay: 0.15, style: { marginTop: "3rem" } },
    React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 6,
      height: 200, padding: "0 4px" } },
      series.map((s, i) => {
        const h = Math.max(4, (s[field] / max) * 180);
        const isPeak = s.key === peakKey;
        return React.createElement("div", { key: s.key, style: { flex: 1, display: "flex",
          flexDirection: "column", alignItems: "center", gap: 6 } },
          React.createElement("div", { style: { fontSize: 12, color: isPeak ? C.clayDeep : C.inkFaint,
            fontWeight: isPeak ? 600 : 400, fontFamily: serif } }, s[field]),
          React.createElement(BarFill, { h, color: isPeak ? C.clayDeep : color, delay: i * 0.04 }),
          React.createElement("div", { style: { fontSize: 10, color: C.inkFaint, writingMode: "horizontal-tb",
            whiteSpace: "nowrap" } }, s.label.split(" ")[0])
        );
      })
    )
  );
}
function BarFill({ h, color, delay }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 100 + delay * 1000); return () => clearTimeout(t); }, []);
  return React.createElement("div", { style: { width: "100%", maxWidth: 40, height: grown ? h : 0,
    background: color, borderRadius: 4, transition: "height .7s cubic-bezier(.22,1,.36,1)" } });
}

// ---------- the funnel ----------
function Funnel({ f }) {
  const rows = [
    { label: "likes in your orbit", n: f.likes, color: C.cold, note: "people who liked you, or you them" },
    { label: "became mutual matches", n: f.matches, color: "#CDBBA6" },
    { label: "turned into real conversations", n: f.conversations, color: "#C79B74" },
    { label: "reached a number or a plan", n: f.reached, color: C.clay },
  ];
  const max = rows[0].n || 1;
  return React.createElement(Section, { kicker: "The funnel",
    info: "Likes = entries with no mutual match (someone liked you, or you them, with no match). Matches = mutual. Conversations = matches with at least one message from you. 'Reached a number or a plan' = your messages contain a phone number, a platform switch (WhatsApp/Insta/etc.), or meet-up language. It does not claim a date happened — only that contact was attempted." },
    React.createElement(Hero, { big: `${fmt(f.likes)} likes. ${fmt(f.reached)} reached a plan.`,
      sub: "Watch where it narrows. The steep drop isn't where most people expect." }),
    React.createElement(Reveal, { delay: 0.2, style: { marginTop: "3.5rem", display: "flex", flexDirection: "column", gap: 12 } },
      rows.map((r, i) => {
        const w = Math.max(8, (r.n / max) * 100);
        return React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: "1rem" } },
          React.createElement("div", { style: { flex: "0 0 44%", textAlign: "right" } },
            React.createElement("div", { style: { fontFamily: serif, fontSize: "1.6rem", lineHeight: 1 } }, fmt(r.n)),
            React.createElement("div", { style: { fontSize: "0.82rem", color: C.inkSoft, marginTop: 3 } }, r.label)),
          React.createElement(FunnelBar, { w, color: r.color, delay: i * 0.12 })
        );
      })
    ),
    React.createElement(Reveal, { delay: 0.3, style: { marginTop: "2.5rem" } },
      React.createElement("p", { style: { textAlign: "center", color: C.inkSoft, fontSize: "1rem", maxWidth: 540, margin: "0 auto" } },
        `You convert matches into conversations beautifully — ${f.conversations} of ${f.matches}. The real attrition lives at the very top, and at the very end.`))
  );
}
function FunnelBar({ w, color, delay }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 200 + delay * 1000); return () => clearTimeout(t); }, []);
  return React.createElement("div", { style: { flex: 1 } },
    React.createElement("div", { style: { height: 36, width: grown ? `${w}%` : 0, background: color,
      borderRadius: 6, transition: "width .9s cubic-bezier(.22,1,.36,1)" } }));
}

// ---------- months sections ----------
function MatchesMonth({ series, peak }) {
  const avg = Math.round(series.reduce((a, b) => a + b.matches, 0) / series.length);
  return React.createElement(Section, { kicker: "Matches by month", bg: "#fff",
    info: "Each match counted in the month it was made (from the match timestamp). Mutual matches only." },
    React.createElement(Hero, { big: `${peak.label} was your peak — ${peak.matches} matches.`,
      sub: `You averaged about ${avg} matches a month across ${series.length} months.` }),
    React.createElement(MonthBars, { series, field: "matches", color: "#CDBBA6", peakKey: peak.key })
  );
}
function ReachedMonth({ series }) {
  const peak = series.reduce((a, b) => (b.reached > a.reached ? b : a), series[0]);
  const total = series.reduce((a, b) => a + b.reached, 0);
  return React.createElement(Section, { kicker: "Plans reached by month",
    info: "Counts conversations each month where your messages reached a number, a platform switch, or meet-up language. A signal of momentum, not a confirmed date." },
    React.createElement(Hero, { big: `${total} conversations reached a plan.`,
      sub: `${peak.label} led the way with ${peak.reached}. Notice the busiest match months aren't always the ones that converted.` }),
    React.createElement(MonthBars, { series, field: "reached", color: C.clay, peakKey: peak.key })
  );
}
function Flow({ series, peak }) {
  return React.createElement(Section, { kicker: "When it flowed", bg: "#fff",
    info: "Flow = average messages per conversation in that month (your messages only). It rewards depth, not volume — a few rich threads beat many dead ones. Months with fewer than 2 conversations are skipped." },
    React.createElement(Hero, { big: `Your conversations ran deepest in ${peak.label}.`,
      sub: `That month averaged ${peak.depth} messages per conversation from you — your most engaged stretch.` }),
    React.createElement(MonthBars, { series: series.filter((s) => s.convos >= 1), field: "depth", color: C.sage, peakKey: peak.key })
  );
}

// ---------- words / phrases / openers ----------
function Words({ text }) {
  const top = text.topWords.slice(0, 20);
  const max = top.length ? top[0].n : 1;
  return React.createElement(Section, { kicker: "Words you reach for",
    info: "Frequency of meaningful words across all your messages, after removing filler words (the, and, you…). Laughter spellings (haha, lol, lmao…) are collapsed into one. This measures what you say often — not the meaning or theme, which a simple counter can't reliably judge." },
    React.createElement(Hero, { big: top.length ? `You said "${prettyWord(top[0].word)}" ${fmt(top[0].n)} times.` : "Not enough text yet.",
      sub: "The words that show up most across everything you wrote." }),
    React.createElement(Reveal, { delay: 0.15, style: { marginTop: "3rem", display: "flex", flexWrap: "wrap",
      gap: 10, justifyContent: "center", alignItems: "center" } },
      top.map((w, i) => {
        const scale = 0.85 + (w.n / max) * 1.6;
        return React.createElement("span", { key: i, style: { fontFamily: serif,
          fontSize: `${scale}rem`, color: i < 3 ? C.clayDeep : C.inkSoft, lineHeight: 1.1 } },
          prettyWord(w.word));
      })
    )
  );
}
function Phrases({ text }) {
  const top = text.topPhrases.slice(0, 10);
  if (!top.length) return null;
  return React.createElement(Section, { kicker: "Phrases you repeat", bg: "#fff",
    info: "Two- and three-word phrases that appear 3+ times across your messages. These are your verbal habits — the stock lines you fall back on." },
    React.createElement(Hero, { big: `"${top[0].phrase}" — ${fmt(top[0].n)} times.`,
      sub: "Your recurring turns of phrase, ranked." }),
    React.createElement(Reveal, { delay: 0.15, style: { marginTop: "2.5rem", display: "flex", flexDirection: "column", gap: 8, maxWidth: 460, margin: "2.5rem auto 0" } },
      top.map((p, i) => React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between",
        alignItems: "baseline", padding: "10px 0", borderBottom: `1px solid ${C.line}` } },
        React.createElement("span", { style: { fontFamily: serif, fontSize: "1.1rem", color: C.ink } }, `"${p.phrase}"`),
        React.createElement("span", { style: { fontFamily: serif, color: C.clay, fontSize: "1.1rem" } }, `×${p.n}`)))
    )
  );
}
function Openers({ text }) {
  const top = text.topOpeners;
  const reuses = top.filter((o) => o.n > 1);
  const rarelyReuses = reuses.length === 0;
  return React.createElement(Section, { kicker: "How you open",
    info: "Your first message in each conversation, lightly normalized (lowercased, punctuation stripped) so near-identical openers group together. Shows your go-to opening moves — or whether you start fresh every time." },
    rarelyReuses
      ? React.createElement(Hero, { big: "You almost never reuse an opener.",
          sub: "Nearly every conversation started with something different — you write to the person, not from a script." })
      : React.createElement(React.Fragment, null,
          React.createElement(Hero, { big: `Your go-to opener: "${top[0].text}"`,
            sub: `You opened with it ${top[0].n} times.` }),
          React.createElement(Reveal, { delay: 0.15, style: { marginTop: "2.5rem", display: "flex", flexDirection: "column",
            gap: 8, maxWidth: 520, margin: "2.5rem auto 0" } },
            reuses.slice(0, 6).map((o, i) => React.createElement("div", { key: i, style: { display: "flex",
              justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: `1px solid ${C.line}` } },
              React.createElement("span", { style: { color: C.ink } }, `"${o.text}"`),
              React.createElement("span", { style: { fontFamily: serif, color: C.clay, whiteSpace: "nowrap" } }, `×${o.n}`))))
        )
  );
}

// ---------- explainer (how to get data) ----------
function Explainer({ onContinue }) {
  const steps = [
    ["Request it in Hinge", "Open Hinge → tap your photo icon → Account Settings → Download My Data. Pick your country, confirm your email, hit Submit."],
    ["Wait a day or two", "It usually arrives within 24–48 hours (Hinge says up to 30 days in busy periods). You'll get an email when it's ready."],
    ["Grab it within 48 hours", "The download link expires 48 hours after it's ready. If you miss the window, just request again."],
    ["Unzip and find matches.json", "The download is a .zip. Open it, and look for the file named matches.json — that's the only file you need here."],
    ["Drop it below", "Upload matches.json. It's read entirely in your browser. Nothing is uploaded, nothing is stored."],
  ];
  return React.createElement("section", { style: { minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: "8vh 1.5rem", position: "relative", zIndex: 1 } },
    React.createElement("p", { style: { fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase",
      color: C.inkFaint, marginBottom: "1.5rem" } }, "A private mirror"),
    React.createElement("h1", { style: { fontFamily: serif, fontWeight: 500, fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
      lineHeight: 1.05, letterSpacing: "-0.02em", textAlign: "center", maxWidth: 720, marginBottom: "1.25rem" } },
      "See the shape of your dating life."),
    React.createElement("p", { style: { fontSize: "1.1rem", color: C.inkSoft, maxWidth: 540, textAlign: "center", marginBottom: "3rem" } },
      "Your Hinge export, read privately in your browser, turned into the patterns you can't see from inside it."),
    React.createElement("div", { style: { maxWidth: 560, width: "100%", display: "flex", flexDirection: "column", gap: 4 } },
      steps.map((s, i) => React.createElement("div", { key: i, style: { display: "flex", gap: 16, padding: "16px 0",
        borderBottom: i < steps.length - 1 ? `1px solid ${C.line}` : "none" } },
        React.createElement("div", { style: { flex: "0 0 32px", height: 32, borderRadius: "50%", background: C.clay,
          color: "#fff", fontFamily: serif, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 } }, i + 1),
        React.createElement("div", null,
          React.createElement("div", { style: { fontFamily: serif, fontSize: "1.15rem", marginBottom: 2 } }, s[0]),
          React.createElement("div", { style: { color: C.inkSoft, fontSize: "0.95rem" } }, s[1]))))
    ),
    React.createElement("button", { onClick: onContinue, style: { marginTop: "3rem", background: C.ink, color: "#fff",
      border: "none", padding: "16px 36px", borderRadius: 100, fontSize: "1rem", fontFamily: sans, cursor: "pointer",
      letterSpacing: "0.01em" } }, "I have my file — let's go"),
    React.createElement("div", { style: { marginTop: "2rem", display: "flex", gap: 10, color: C.inkFaint,
      fontSize: "0.85rem", maxWidth: 480, alignItems: "flex-start" } },
      React.createElement("span", { style: { fontSize: "1.1rem" } }, "⊘"),
      React.createElement("span", { style: { textAlign: "left" } },
        "Everything runs in your browser. Your file is never uploaded or saved — open your network tab and check. Close the tab and it's gone."))
  );
}

// ---------- upload ----------
function Upload({ onData, onBack }) {
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);
  function handleFile(file) {
    setErr("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try { onData(window.__analyze(JSON.parse(e.target.result))); }
      catch (ex) { setErr("Couldn't read that file. It should be matches.json from your Hinge export."); }
    };
    reader.onerror = () => setErr("Couldn't open that file. Try again.");
    reader.readAsText(file);
  }
  return React.createElement("section", { style: { minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: "8vh 1.5rem", textAlign: "center", position: "relative", zIndex: 1 } },
    React.createElement("h1", { style: { fontFamily: serif, fontWeight: 500, fontSize: "clamp(2rem,5vw,3.2rem)",
      letterSpacing: "-0.02em", marginBottom: "2.5rem", maxWidth: 600 } }, "Drop your matches.json"),
    React.createElement("div", {
      role: "button", tabIndex: 0,
      onClick: () => inputRef.current && inputRef.current.click(),
      onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && inputRef.current.click(),
      onDragOver: (e) => { e.preventDefault(); setDrag(true); },
      onDragLeave: () => setDrag(false),
      onDrop: (e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); },
      style: { width: "min(440px,90vw)", padding: "2.5rem 2rem", border: `1.5px dashed ${drag ? C.clay : C.line}`,
        borderRadius: 18, background: drag ? "rgba(199,123,84,0.05)" : "#fff", cursor: "pointer", transition: "all .2s" },
    },
      React.createElement("div", { style: { fontFamily: serif, fontSize: "1.2rem", marginBottom: 6 } }, "Click or drag your file here"),
      React.createElement("div", { style: { color: C.inkFaint, fontSize: "0.9rem" } }, "matches.json"),
      React.createElement("input", { ref: inputRef, type: "file", accept: ".json,application/json",
        style: { display: "none" }, onChange: (e) => e.target.files[0] && handleFile(e.target.files[0]) })
    ),
    err && React.createElement("p", { style: { color: C.clayDeep, marginTop: "1rem", fontSize: "0.9rem" } }, err),
    React.createElement("button", { onClick: () => onData(window.__analyze(window.SAMPLE_MATCHES)),
      style: { marginTop: "1.75rem", background: "none", border: "none", cursor: "pointer", color: C.inkSoft,
        textDecoration: "underline", textUnderlineOffset: 4, fontSize: "0.92rem" } }, "or explore with sample data"),
    React.createElement("button", { onClick: onBack, style: { marginTop: "1rem", background: "none", border: "none",
      cursor: "pointer", color: C.inkFaint, fontSize: "0.85rem" } }, "← back to instructions")
  );
}

// ---------- spine ----------
function Spine() {
  return React.createElement("div", { "aria-hidden": "true", style: { position: "absolute", left: "50%",
    top: 0, bottom: 0, transform: "translateX(-50%)", width: 60, pointerEvents: "none", zIndex: 0 } },
    React.createElement("svg", { width: "60", height: "100%", preserveAspectRatio: "none", viewBox: "0 0 60 1000",
      style: { position: "absolute", inset: 0, height: "100%" } },
      React.createElement("defs", null,
        React.createElement("linearGradient", { id: "taper", x1: "0", y1: "0", x2: "0", y2: "1" },
          React.createElement("stop", { offset: "0%", stopColor: C.clay, stopOpacity: "0.8" }),
          React.createElement("stop", { offset: "100%", stopColor: C.clay, stopOpacity: "0.35" }))),
      React.createElement("path", { d: "M30,0 L30,1000", stroke: "url(#taper)", strokeWidth: "1.5", fill: "none" }))
  );
}

// ---------- app ----------
function App() {
  const [stage, setStage] = useState("explain"); // explain | upload | results
  const [data, setData] = useState(null);

  if (stage === "explain") return React.createElement(Explainer, { onContinue: () => setStage("upload") });
  if (stage === "upload") return React.createElement(Upload, {
    onData: (d) => { setData(d); setStage("results"); window.scrollTo(0, 0); },
    onBack: () => setStage("explain"),
  });

  return React.createElement("div", { style: { position: "relative" } },
    React.createElement(Spine),
    React.createElement("header", { style: { position: "relative", zIndex: 1, textAlign: "center", padding: "8vh 1.5rem 2vh" } },
      React.createElement("p", { style: { fontFamily: serif, fontStyle: "italic", fontSize: "1.5rem", color: C.clayDeep } }, "Your mirror"),
      React.createElement("button", { onClick: () => { setData(null); setStage("explain"); },
        style: { marginTop: 8, background: "none", border: "none", color: C.inkFaint, cursor: "pointer",
          fontSize: "0.85rem", textDecoration: "underline", textUnderlineOffset: 3 } }, "start over with another file")),
    React.createElement(Funnel, { f: data.funnel }),
    React.createElement(MatchesMonth, { series: data.series, peak: data.peakMatches }),
    React.createElement(ReachedMonth, { series: data.series }),
    React.createElement(Flow, { series: data.series, peak: data.peakFlow }),
    React.createElement(Words, { text: data.text }),
    React.createElement(Phrases, { text: data.text }),
    React.createElement(Openers, { text: data.text }),
    React.createElement("footer", { style: { position: "relative", zIndex: 1, textAlign: "center",
      padding: "8vh 1.5rem 6vh", color: C.inkFaint, fontSize: "0.82rem" } },
      "Read entirely in your browser. Nothing was uploaded or stored.")
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
