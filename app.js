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
    { label: "likes in your orbit", n: f.likes, color: C.cold, pct: null },
    { label: "became mutual matches", n: f.matches, color: "#CDBBA6", pct: `${f.pctMatch}% of likes` },
    { label: "turned into real conversations", n: f.conversations, color: "#C79B74", pct: `${f.pctConvo}% of matches` },
    { label: "reached a number or a plan", n: f.reached, color: C.clay, pct: `${f.pctReached}% of matches` },
  ];
  const max = rows[0].n || 1;
  return React.createElement(Section, { kicker: "The funnel",
    info: "Likes = entries with no mutual match. Matches = mutual. Conversations = matches with at least one message from you. 'Reached a number or a plan' = your messages contain a phone number, a platform switch (WhatsApp/Insta/etc.), or meet-up language — contact attempted, not a confirmed date. Percentages are each stage relative to the one noted." },
    React.createElement(Hero, { big: `${fmt(f.likes)} likes. ${fmt(f.reached)} reached a plan.`,
      sub: "Watch where it narrows. The steep drop isn't where most people expect." }),
    React.createElement(Reveal, { delay: 0.2, style: { marginTop: "3.5rem", display: "flex", flexDirection: "column", gap: 18 } },
      rows.map((r, i) => {
        const w = Math.max(8, (r.n / max) * 100);
        return React.createElement("div", { key: i },
          r.pct && React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 2 } },
            React.createElement("span", { style: { fontSize: "0.72rem", color: C.clayDeep, letterSpacing: "0.04em",
              background: "rgba(199,123,84,0.08)", padding: "2px 10px", borderRadius: 100, marginRight: "0%" } }, "↓ " + r.pct)),
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "1rem" } },
            React.createElement("div", { style: { flex: "0 0 44%", textAlign: "right" } },
              React.createElement("div", { style: { fontFamily: serif, fontSize: "1.6rem", lineHeight: 1 } }, fmt(r.n)),
              React.createElement("div", { style: { fontSize: "0.82rem", color: C.inkSoft, marginTop: 3 } }, r.label)),
            React.createElement(FunnelBar, { w, color: r.color, delay: i * 0.12 })));
      })
    ),
    React.createElement(Reveal, { delay: 0.3, style: { marginTop: "2.5rem" } },
      React.createElement("p", { style: { textAlign: "center", color: C.inkSoft, fontSize: "1rem", maxWidth: 560, margin: "0 auto 1.25rem" } },
        `${f.noConvo} matches never became a conversation. You convert matches into conversations beautifully — ${f.conversations} of ${f.matches} (${f.pctConvo}%). The real attrition lives at the very top, and at the very end.`),
      React.createElement("div", { style: { maxWidth: 560, margin: "0 auto", padding: "1.25rem 1.5rem",
        background: C.bg, borderRadius: 12, border: `1px solid ${C.line}` } },
        React.createElement("p", { style: { fontSize: "0.95rem", color: C.ink, lineHeight: 1.6 } },
          React.createElement("span", { style: { fontFamily: serif, color: C.clayDeep } }, "For context: "),
          `across large dating-app studies, roughly 5–20% of matches turn into a date. Your matches reached a number or plan at ${f.pctReached}%. `,
          React.createElement("span", { style: { color: C.inkFaint, fontSize: "0.82rem" } },
            "(Benchmark from Tinder-reported and SwipeStats data; male-skewed, so a broad reference, not an exact peer rate.)")))
    )
  );
}
function FunnelBar({ w, color, delay }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 200 + delay * 1000); return () => clearTimeout(t); }, []);
  return React.createElement("div", { style: { flex: 1 } },
    React.createElement("div", { style: { height: 36, width: grown ? `${w}%` : 0, background: color,
      borderRadius: 6, transition: "width .9s cubic-bezier(.22,1,.36,1)" } }));
}

// ---------- section 2: matches with plans-overlay toggle ----------
function MonthOverlay({ series, mode, peakKey }) {
  const maxM = Math.max(...series.map((s) => s.matches), 1);
  return React.createElement(Reveal, { delay: 0.15, style: { marginTop: "3rem" } },
    React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 6, height: 220, padding: "0 4px" } },
      series.map((s) => {
        const hM = Math.max(4, (s.matches / maxM) * 180);
        const hR = Math.max(2, (s.reached / maxM) * 180);
        const isPeak = s.key === peakKey;
        const showPlan = mode === "plans";
        return React.createElement("div", { key: s.key, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 } },
          React.createElement("div", { style: { fontSize: 12, fontFamily: serif, color: showPlan ? C.clayDeep : (isPeak ? C.clayDeep : C.inkFaint), fontWeight: isPeak ? 600 : 400 } },
            showPlan ? `${s.conversion}%` : s.matches),
          React.createElement("div", { style: { position: "relative", width: "100%", maxWidth: 40, height: 180, display: "flex", alignItems: "flex-end" } },
            React.createElement(GrowH, { h: hM, color: showPlan ? "rgba(205,187,166,0.4)" : (isPeak ? C.clayDeep : "#CDBBA6"), abs: false }),
            showPlan && React.createElement("div", { style: { position: "absolute", bottom: 0, width: "100%" } },
              React.createElement(GrowH, { h: hR, color: C.clay, abs: false }))),
          React.createElement("div", { style: { fontSize: 10, color: C.inkFaint } }, s.label.split(" ")[0]));
      })
    )
  );
}
function GrowH({ h, color }) {
  const [g, setG] = useState(false);
  useEffect(() => { const t = setTimeout(() => setG(true), 120); return () => clearTimeout(t); }, []);
  return React.createElement("div", { style: { width: "100%", maxWidth: 40, height: g ? h : 0, background: color, borderRadius: 4, transition: "height .7s cubic-bezier(.22,1,.36,1)" } });
}
function MatchesMonth({ series, peak }) {
  const [mode, setMode] = useState("matches");
  const total = series.reduce((a, b) => a + b.matches, 0);
  const avg = Math.round(total / series.length);
  const totalReached = series.reduce((a, b) => a + b.reached, 0);
  const overallConv = total ? Math.round(totalReached / total * 100) : 0;
  return React.createElement(Section, { kicker: "Matches by month", bg: "#fff",
    info: "Bars show matches per month (from the match timestamp). Toggle to 'Plans' to overlay, in clay, the matches that reached a number or plan that month — the label switches to the month's conversion rate. Matches fade to background so you can see the proportion that converted." },
    React.createElement(Hero, { big: `${fmt(total)} matches across ${series.length} months.`,
      sub: mode === "matches"
        ? `${peak.label} was your peak — ${peak.matches} matches. You averaged about ${avg} a month.`
        : `Overall, ${overallConv}% of matches reached a plan. The clay shows how much of each month converted.` }),
    React.createElement(Reveal, { delay: 0.05, style: { display: "flex", justifyContent: "center", marginTop: "2rem" } },
      React.createElement("div", { style: { display: "inline-flex", background: C.bg, borderRadius: 100, padding: 4, border: `1px solid ${C.line}` } },
        [["matches", "All matches"], ["plans", "Reached a plan"]].map((opt) =>
          React.createElement("button", { key: opt[0], onClick: () => setMode(opt[0]),
            style: { border: "none", cursor: "pointer", padding: "8px 18px", borderRadius: 100, fontSize: "0.85rem", fontFamily: sans,
              background: mode === opt[0] ? C.ink : "transparent", color: mode === opt[0] ? "#fff" : C.inkSoft, transition: "all .2s" } }, opt[1])))),
    React.createElement(MonthOverlay, { series, mode, peakKey: peak.key })
  );
}

// ---------- section 3: time on Hinge (+ deepest convo toggle) ----------
function StatCard({ big, label, sub }) {
  return React.createElement("div", { style: { background: C.bg, borderRadius: 14, padding: "1.5rem 1.25rem", textAlign: "center", flex: 1, minWidth: 140 } },
    React.createElement("div", { style: { fontFamily: serif, fontSize: "2.2rem", color: C.clayDeep, lineHeight: 1 } }, big),
    React.createElement("div", { style: { fontSize: "0.85rem", color: C.ink, marginTop: 8, fontWeight: 500 } }, label),
    sub && React.createElement("div", { style: { fontSize: "0.78rem", color: C.inkFaint, marginTop: 2 } }, sub));
}
function TimeOnHinge({ activity, deepest }) {
  const [mode, setMode] = useState("time");
  const [perMsg, setPerMsg] = useState("");
  const estMin = perMsg && !isNaN(perMsg) ? Math.round(parseFloat(perMsg) * activity.totalMessages) : null;
  const estHrs = estMin != null ? Math.round(estMin / 60 * 10) / 10 : null;

  const timeView = React.createElement(React.Fragment, null,
    React.createElement(Hero, { big: `${fmt(activity.totalMessages)} messages, across ${activity.activeDays} days.`,
      sub: `That's about ${activity.msgsPerActiveDay} messages on each day you were active.` }),
    React.createElement(Reveal, { delay: 0.12, style: { marginTop: "3rem", display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" } },
      React.createElement(StatCard, { big: fmt(activity.activeDays), label: "active days", sub: "days you sent a message" }),
      React.createElement(StatCard, { big: activity.msgsPerActiveDay, label: "messages / active day" }),
      React.createElement(StatCard, { big: `${activity.sessionHours}h`, label: "est. active texting", sub: `${activity.sessionCount} sessions` })),
    React.createElement(Reveal, { delay: 0.2, style: { marginTop: "2.5rem", maxWidth: 460, margin: "2.5rem auto 0", textAlign: "center" } },
      React.createElement("p", { style: { fontSize: "0.95rem", color: C.inkSoft, marginBottom: 12 } },
        "Want a rough total your way? Type how many minutes you reckon you spend per message:"),
      React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "wrap" } },
        React.createElement("input", { type: "number", min: "0", step: "0.5", value: perMsg, placeholder: "5",
          onChange: (e) => setPerMsg(e.target.value),
          style: { width: 90, padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`, fontFamily: sans, fontSize: "1rem", textAlign: "center" } }),
        React.createElement("span", { style: { color: C.inkSoft } }, "min × " + fmt(activity.totalMessages) + " messages")),
      estHrs != null && React.createElement("div", { style: { marginTop: "1.5rem" } },
        React.createElement("div", { style: { fontFamily: serif, fontSize: "2.4rem", color: C.clayDeep } }, `≈ ${fmt(estHrs)} hours`),
        React.createElement("div", { style: { fontSize: "0.8rem", color: C.inkFaint } }, "your estimate × your real message count")))
  );

  const deepView = deepest ? React.createElement(React.Fragment, null,
    React.createElement(Hero, { big: `Your deepest thread ran ${fmt(deepest.messages)} messages.`,
      sub: `It stretched over ${deepest.spanDays} days${deepest.exchangeDate ? ", and reached a plan along the way" : ""}.` }),
    React.createElement(Reveal, { delay: 0.12, style: { marginTop: "2.5rem", maxWidth: 420, margin: "2.5rem auto 0" } },
      React.createElement("div", { style: { background: C.bg, borderRadius: 14, padding: "1.75rem", textAlign: "left" } },
        [["Match #", deepest.id], ["Matched on", deepest.matchDate || "—"], ["Your messages", fmt(deepest.messages)],
         ["Words written", fmt(deepest.words)], ["Spanned", `${deepest.spanDays} days`],
         ["Reached a plan", deepest.exchangeDate || "no"]].map((row, i) =>
          React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", padding: "9px 0",
            borderBottom: i < 5 ? `1px solid ${C.line}` : "none" } },
            React.createElement("span", { style: { color: C.inkSoft, fontSize: "0.9rem" } }, row[0]),
            React.createElement("span", { style: { fontFamily: serif, color: C.ink } }, row[1]))))) ) : null;

  return React.createElement(Section, { kicker: "Time on Hinge",
    info: "Active days = distinct days you sent at least one message. Estimated active texting time groups your messages into sessions (gaps under 30 min count as one sitting) and sums them — a measured proxy, not exact, since the export has no real duration data. The minutes-per-message box is your own assumption, multiplied by your real message count; it's your estimate, not a sourced figure. The deepest-thread view shows your single longest conversation." },
    React.createElement(Reveal, { delay: 0.05, style: { display: "flex", justifyContent: "center", marginBottom: "2.5rem" } },
      React.createElement("div", { style: { display: "inline-flex", background: C.bg, borderRadius: 100, padding: 4, border: `1px solid ${C.line}` } },
        [["time", "Time spent"], ["deepest", "Deepest thread"]].map((opt) =>
          React.createElement("button", { key: opt[0], onClick: () => setMode(opt[0]),
            style: { border: "none", cursor: "pointer", padding: "8px 18px", borderRadius: 100, fontSize: "0.85rem", fontFamily: sans,
              background: mode === opt[0] ? C.ink : "transparent", color: mode === opt[0] ? "#fff" : C.inkSoft, transition: "all .2s" } }, opt[1])))),
    mode === "time" ? timeView : deepView
  );
}

// ---------- section 4: peak time heatmap ----------
function Heatmap({ activity }) {
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const max = activity.peakVal || 1;
  function fmtHour(h) { const ap = h < 12 ? "am" : "pm"; const hh = h % 12 === 0 ? 12 : h % 12; return `${hh}${ap}`; }
  return React.createElement(Section, { kicker: "When you text", bg: "#fff",
    info: "Every message you sent, bucketed by weekday and hour. Darker = more messages. Times are in UTC, so they line up with London in winter and run an hour behind in summer. This is when you were most active — not necessarily when you were most successful." },
    React.createElement(Hero, { big: `${dowFull[activity.peakDow]} at ${fmtHour(activity.peakHour)} is your hour.`,
      sub: `Your single busiest window. Overall you lean toward ${dowFull[activity.peakDowOnly]}s and the ${fmtHour(activity.peakHourOnly)} hour.` }),
    React.createElement(Reveal, { delay: 0.15, style: { marginTop: "3rem", overflowX: "auto" } },
      React.createElement("div", { style: { minWidth: 560, margin: "0 auto", maxWidth: 680 } },
        React.createElement("div", { style: { display: "flex", gap: 2, marginBottom: 4, paddingLeft: 38 } },
          [0, 3, 6, 9, 12, 15, 18, 21].map((h) => React.createElement("div", { key: h,
            style: { flex: "1 0 0", fontSize: 9, color: C.inkFaint, textAlign: "left" } }, fmtHour(h)))),
        dows.map((d, dw) => React.createElement("div", { key: dw, style: { display: "flex", alignItems: "center", gap: 3, marginBottom: 3 } },
          React.createElement("div", { style: { flex: "0 0 34px", fontSize: 11, color: C.inkSoft } }, d),
          React.createElement("div", { style: { display: "flex", gap: 2, flex: 1 } },
            activity.heat[dw].map((v, h) => {
              const intensity = v / max;
              return React.createElement("div", { key: h, title: `${d} ${fmtHour(h)}: ${v}`,
                style: { flex: "1 0 0", aspectRatio: "1", borderRadius: 2,
                  background: v === 0 ? "rgba(0,0,0,0.03)" : `rgba(199,123,84,${0.15 + intensity * 0.85})` } });
            }))))
      )
    )
  );
}

// ---------- when it flowed (kept, simplified) ----------
function Flow({ series, peak }) {
  return React.createElement(Section, { kicker: "When it flowed",
    info: "Flow = average messages per conversation that month (your messages only). Rewards depth over volume — a few rich threads beat many dead ones." },
    React.createElement(Hero, { big: `Your conversations ran deepest in ${peak.label}.`,
      sub: `That month averaged ${peak.depth} messages per conversation — your most engaged stretch.` }),
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

// ---------- section 10: what clicked vs what didn't ----------
function CompareBar({ label, clickedVal, fizzledVal, clickedLabel, fizzledLabel }) {
  const max = Math.max(clickedVal, fizzledVal, 1);
  return React.createElement("div", { style: { marginBottom: "2rem" } },
    React.createElement("div", { style: { fontSize: "0.85rem", color: C.inkSoft, marginBottom: 10, textAlign: "center" } }, label),
    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
      [["Clicked", clickedVal, clickedLabel, C.sage], ["Fizzled", fizzledVal, fizzledLabel, C.cold]].map((row, i) =>
        React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 12 } },
          React.createElement("div", { style: { flex: "0 0 64px", fontSize: "0.8rem", color: C.inkSoft, textAlign: "right" } }, row[0]),
          React.createElement(GrowBar, { w: (row[1] / max) * 100, color: row[3], delay: i * 0.15 }),
          React.createElement("div", { style: { flex: "0 0 80px", fontFamily: serif, fontSize: "1.1rem", color: row[3] === C.sage ? C.clayDeep : C.inkSoft } }, row[2])))
    )
  );
}
function GrowBar({ w, color, delay }) {
  const [g, setG] = useState(false);
  useEffect(() => { const t = setTimeout(() => setG(true), 150 + delay * 1000); return () => clearTimeout(t); }, []);
  return React.createElement("div", { style: { flex: 1, height: 28, background: "rgba(0,0,0,0.03)", borderRadius: 5, overflow: "hidden" } },
    React.createElement("div", { style: { height: "100%", width: g ? `${Math.max(4, w)}%` : 0, background: color, borderRadius: 5, transition: "width .9s cubic-bezier(.22,1,.36,1)" } }));
}

function Contrast({ c }) {
  if (!c || c.clicked.n < 2) {
    return React.createElement(Section, { kicker: "What clicked vs what didn't", bg: "#fff" },
      React.createElement(Hero, { big: "Not enough confirmed dates to compare yet.",
        sub: "This section compares the threads you marked as dates against ones that fizzled — it needs a handful of confirmed dates." }));
  }
  const fizzled = c.fizzledMiddle;
  if (fizzled.n < 2) {
    return React.createElement(Section, { kicker: "What clicked vs what didn't", bg: "#fff" },
      React.createElement(Hero, { big: "Not enough fizzled conversations to compare.", sub: "Need a few threads that talked but went nowhere." }));
  }

  return React.createElement(Section, { kicker: "What clicked vs what didn't", bg: "#fff",
    info: `"Clicked" = ${c.clicked.n} threads you logged as a date (we_met = Yes). "Fizzled" = all ${fizzled.n} threads that ran 4+ messages, talked, but never exchanged contact and ended in an unmatch — the fair comparison, since both groups genuinely got going (from a pool of ${c.talkedPoolSize} talked-but-went-nowhere threads). This is contrast, not cause: n is small, and a difference is something to notice, not proof of why.` },
    React.createElement(Hero, { big: `Your dates ran ${c.clicked.medLen} messages. The fizzles ran ${fizzled.medLen}.`,
      sub: `Across your confirmed dates, you reached a plan in a median of ${c.medDaysToPlan} days. The contrast below is yours to read — none of it is a verdict.` }),
    React.createElement(Reveal, { delay: 0.1, style: { maxWidth: 520, margin: "3rem auto 0" } },
      React.createElement(CompareBar, { label: "Median messages per thread",
        clickedVal: c.clicked.medLen, fizzledVal: fizzled.medLen,
        clickedLabel: `${c.clicked.medLen} msgs`, fizzledLabel: `${fizzled.medLen} msgs` })
    ),
    fizzled.distinctWords.length > 0 && React.createElement(Reveal, { delay: 0.15, style: { marginTop: "1.5rem" } },
      React.createElement("p", { style: { textAlign: "center", color: C.inkSoft, fontSize: "0.92rem", marginBottom: "1.25rem" } },
        "Words that showed up more in the threads that clicked — what theme do you see?"),
      React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", alignItems: "center" } },
        fizzled.distinctWords.map((w, i) => {
          const scale = 0.9 + (w.n / fizzled.distinctWords[0].n) * 1.3;
          return React.createElement("span", { key: i, style: { fontFamily: serif, fontSize: `${scale}rem`,
            color: i < 3 ? C.clayDeep : C.inkSoft } }, prettyWord(w.word));
        }))
    ),
    c.examples.length > 0 && React.createElement(Reveal, { delay: 0.2, style: { marginTop: "3rem" } },
      React.createElement("p", { style: { textAlign: "center", color: C.inkSoft, fontSize: "0.92rem", marginBottom: "1.25rem" } },
        "A few of those threads — real people, shown by shape and dates only:"),
      React.createElement("div", { style: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" } },
        c.examples.map((ex, i) => React.createElement("div", { key: i, style: { background: C.bg, borderRadius: 12,
          padding: "1.25rem 1.5rem", minWidth: 170, textAlign: "center" } },
          React.createElement("div", { style: { fontSize: "0.72rem", color: C.inkFaint, marginBottom: 6 } }, `Match #${ex.id}`),
          React.createElement("div", { style: { fontFamily: serif, fontSize: "1.8rem", color: C.clayDeep } }, fmt(ex.messages)),
          React.createElement("div", { style: { fontSize: "0.78rem", color: C.inkSoft, marginBottom: 8 } }, "messages"),
          React.createElement("div", { style: { fontSize: "0.8rem", color: C.inkSoft } }, `matched ${ex.matchDate || "—"}`),
          ex.exchangeDate && React.createElement("div", { style: { fontSize: "0.8rem", color: C.inkSoft } }, `plan ${ex.exchangeDate}`),
          ex.daysToPlan != null && React.createElement("div", { style: { fontSize: "0.78rem", color: C.inkFaint, marginTop: 4 } },
            `${ex.daysToPlan} ${ex.daysToPlan === 1 ? "day" : "days"} to plan`))))
    )
  );
}

// ---------- section 11: closing — hope & awareness ----------
function Closing() {
  return React.createElement("section", { style: { position: "relative", zIndex: 1, padding: "16vh 1.5rem 18vh" } },
    React.createElement("div", { style: { maxWidth: 620, margin: "0 auto", textAlign: "center" } },
      React.createElement(Reveal, null,
        React.createElement("p", { style: { fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase",
          color: C.inkFaint, marginBottom: "2rem" } }, "One last thing")),
      React.createElement(Reveal, { delay: 0.1 },
        React.createElement("h2", { style: { fontFamily: serif, fontWeight: 500, fontSize: "clamp(1.9rem, 5vw, 3rem)",
          lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "2rem" } },
          "None of this is a verdict on you.")),
      React.createElement(Reveal, { delay: 0.2 },
        React.createElement("p", { style: { fontSize: "1.15rem", color: C.inkSoft, lineHeight: 1.7, marginBottom: "1.5rem" } },
          "The algorithm was never yours to control. Who you saw, who saw you, what surfaced and when — that was decided elsewhere. You can't optimize your way out of a system you don't run.")),
      React.createElement(Reveal, { delay: 0.3 },
        React.createElement("p", { style: { fontSize: "1.15rem", color: C.ink, lineHeight: 1.7, fontFamily: serif } },
          "But the pattern is yours to see. Where it clicked, where it didn't, and the shape of how you show up — that's the part you get to hold. A mirror, not a scoreboard.")),
      React.createElement(Reveal, { delay: 0.4, style: { marginTop: "3rem" } },
        React.createElement("div", { style: { width: 40, height: 2, background: C.clay, margin: "0 auto" } }))
    )
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
    React.createElement(TimeOnHinge, { activity: data.activity, deepest: data.threads.deepest }),
    React.createElement(Heatmap, { activity: data.activity }),
    React.createElement(Flow, { series: data.series, peak: data.peakFlow }),
    React.createElement(Words, { text: data.text }),
    React.createElement(Contrast, { c: data.contrast }),
    React.createElement(Closing),
    React.createElement("footer", { style: { position: "relative", zIndex: 1, textAlign: "center",
      padding: "8vh 1.5rem 6vh", color: C.inkFaint, fontSize: "0.82rem" } },
      "Read entirely in your browser. Nothing was uploaded or stored.")
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
