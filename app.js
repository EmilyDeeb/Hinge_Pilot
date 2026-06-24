const {
  useState,
  useRef,
  useEffect
} = React;

// ---------- small helpers ----------
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, {
      threshold: 0.25
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}
const fmt = n => n.toLocaleString("en-US");

// ---------- the connecting spine ----------
// A single clay line down the page that thins as the population shrinks.
function Spine({
  stages,
  active
}) {
  // stages: array of {y, width} fractions — but we render a simple tapering line.
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: "50%",
      top: 0,
      bottom: 0,
      transform: "translateX(-50%)",
      width: 60,
      pointerEvents: "none",
      zIndex: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "60",
    height: "100%",
    preserveAspectRatio: "none",
    viewBox: "0 0 60 1000",
    style: {
      position: "absolute",
      inset: 0,
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "taper",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#C77B54",
    stopOpacity: "0.9"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#C77B54",
    stopOpacity: "0.5"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M30,0 C30,250 30,250 30,500 C30,750 30,750 30,1000",
    stroke: "url(#taper)",
    strokeWidth: "2",
    fill: "none"
  })));
}

// ---------- upload / trust ----------
function Upload({
  onData
}) {
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);
  function handleFile(file) {
    setErr("");
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const raw = JSON.parse(e.target.result);
        const result = window.__analyze(raw);
        onData(result);
      } catch (ex) {
        setErr("Couldn't read that file. It should be the matches.json from your Hinge export.");
      }
    };
    reader.onerror = () => setErr("Couldn't open that file. Try again.");
    reader.readAsText(file);
  }
  return /*#__PURE__*/React.createElement("section", {
    style: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "2rem 1.5rem",
      position: "relative",
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--sans)",
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--ink-faint)",
      marginBottom: "1.5rem"
    }
  }, "A private mirror"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--serif)",
      fontWeight: 400,
      fontSize: "clamp(2.6rem, 7vw, 5rem)",
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      maxWidth: 760,
      marginBottom: "1.5rem"
    }
  }, "See the shape of your ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: "italic",
      color: "var(--clay-deep)"
    }
  }, "dating life"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "1.05rem",
      color: "var(--ink-soft)",
      maxWidth: 520,
      marginBottom: "2.5rem"
    }
  }, "Drop in your Hinge data export and watch the numbers narrow — from every like, down to the people who actually became something."), /*#__PURE__*/React.createElement("div", {
    role: "button",
    tabIndex: 0,
    onClick: () => inputRef.current && inputRef.current.click(),
    onKeyDown: e => (e.key === "Enter" || e.key === " ") && inputRef.current.click(),
    onDragOver: e => {
      e.preventDefault();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDrop: e => {
      e.preventDefault();
      setDrag(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    style: {
      width: "min(440px, 90vw)",
      padding: "2.25rem 2rem",
      border: `1.5px dashed ${drag ? "var(--clay)" : "var(--line)"}`,
      borderRadius: 18,
      background: drag ? "rgba(199,123,84,0.05)" : "#fff",
      cursor: "pointer",
      transition: "all .2s ease",
      outline: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--serif)",
      fontSize: "1.15rem",
      marginBottom: 6
    }
  }, "Drop your ", /*#__PURE__*/React.createElement("code", {
    style: {
      fontFamily: "var(--sans)",
      background: "rgba(199,123,84,0.1)",
      padding: "1px 7px",
      borderRadius: 6,
      color: "var(--clay-deep)",
      fontSize: "0.95rem"
    }
  }, "matches.json")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--ink-faint)",
      fontSize: "0.9rem"
    }
  }, "or click to choose a file"), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "file",
    accept: ".json,application/json",
    style: {
      display: "none"
    },
    onChange: e => e.target.files[0] && handleFile(e.target.files[0])
  })), err && /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--clay-deep)",
      marginTop: "1rem",
      fontSize: "0.9rem",
      maxWidth: 440
    }
  }, err), /*#__PURE__*/React.createElement("button", {
    onClick: () => onData(window.__analyze(window.SAMPLE_MATCHES)),
    style: {
      marginTop: "1.75rem",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--ink-soft)",
      textDecoration: "underline",
      textUnderlineOffset: 4,
      fontFamily: "var(--sans)",
      fontSize: "0.92rem"
    }
  }, "or explore with sample data"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "3rem",
      display: "flex",
      alignItems: "center",
      gap: 10,
      color: "var(--ink-faint)",
      fontSize: "0.85rem",
      maxWidth: 480
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "1.1rem"
    }
  }, "⊘"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "left"
    }
  }, "Nothing leaves this page. Your file is read in your browser and never sent anywhere — open your network tab and check. Close the tab and it's gone.")));
}

// ---------- the funnel hero ----------
function Funnel({
  f
}) {
  const [ref, shown] = useReveal();
  const rows = [{
    label: "likes in your orbit",
    n: f.likes,
    color: "var(--cold)",
    note: "people who liked you, or you them"
  }, {
    label: "became matches",
    n: f.matches,
    color: "#CDBBA6",
    note: "mutual"
  }, {
    label: "turned into conversations",
    n: f.conversations,
    color: "#C79B74",
    note: "you almost always say something"
  }, {
    label: "reached a number or a date",
    n: f.reached,
    color: "var(--clay)",
    note: "the real shortlist"
  }, {
    label: "became dates",
    n: f.dates,
    color: "var(--clay-deep)",
    note: "you actually met"
  }, {
    label: "were your type",
    n: f.myType,
    color: "var(--sage)",
    note: "by your own call"
  }];
  const max = rows[0].n || 1;
  return /*#__PURE__*/React.createElement("section", {
    ref: ref,
    style: {
      position: "relative",
      zIndex: 1,
      padding: "8vh 1.5rem 10vh",
      maxWidth: 720,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--ink-faint)",
      textAlign: "center",
      marginBottom: "0.75rem"
    }
  }, "The funnel"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--serif)",
      fontWeight: 400,
      fontSize: "clamp(1.8rem,4vw,2.6rem)",
      textAlign: "center",
      lineHeight: 1.15,
      marginBottom: "3.5rem",
      letterSpacing: "-0.01em"
    }
  }, fmt(f.likes), " people, and it narrows to ", fmt(f.myType), "."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem"
    }
  }, rows.map((r, i) => {
    const w = Math.max(6, r.n / max * 100);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(12px)",
        transition: `all .6s ease ${i * 0.12}s`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: "0 0 46%",
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--serif)",
        fontSize: "1.5rem",
        lineHeight: 1,
        color: "var(--ink)"
      }
    }, fmt(r.n)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: "0.82rem",
        color: "var(--ink-soft)",
        marginTop: 2
      }
    }, r.label)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 34,
        width: shown ? `${w}%` : 0,
        background: r.color,
        borderRadius: 6,
        transition: `width .9s cubic-bezier(.22,1,.36,1) ${i * 0.12}s`
      }
    })));
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: "3rem",
      textAlign: "center",
      color: "var(--ink-soft)",
      fontSize: "1rem",
      maxWidth: 540,
      marginInline: "auto"
    }
  }, "The steepest drop isn't where you'd think. You convert matches into conversations beautifully — ", f.conversations, " of ", f.matches, ". The real attrition is everything upstream, and everything after the first date."));
}

// ---------- conversation deep-dive ----------
function Conversations({
  c,
  o
}) {
  const [ref, shown] = useReveal();
  return /*#__PURE__*/React.createElement("section", {
    ref: ref,
    style: {
      position: "relative",
      zIndex: 1,
      background: "#fff",
      borderTop: "1px solid var(--line)",
      borderBottom: "1px solid var(--line)",
      padding: "8vh 1.5rem"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--ink-faint)",
      textAlign: "center",
      marginBottom: "0.75rem"
    }
  }, "The ", c.count, " real conversations"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--serif)",
      fontWeight: 400,
      fontSize: "clamp(1.8rem,4vw,2.6rem)",
      textAlign: "center",
      lineHeight: 1.15,
      marginBottom: "3rem",
      letterSpacing: "-0.01em"
    }
  }, "A typical thread lived ", c.median, " messages."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: "1rem",
      marginBottom: "3.5rem"
    }
  }, [{
    k: "median length",
    v: c.median + " msgs"
  }, {
    k: "longest thread",
    v: fmt(c.longest) + " msgs"
  }, {
    k: "you wrote",
    v: fmt(c.totalMessages) + " msgs"
  }].map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--bg)",
      borderRadius: 12,
      padding: "1.1rem 1.25rem"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "0.8rem",
      color: "var(--ink-faint)",
      marginBottom: 6
    }
  }, m.k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--serif)",
      fontSize: "1.55rem"
    }
  }, m.v)))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "0.92rem",
      color: "var(--ink-soft)",
      marginBottom: "1rem"
    }
  }, "How far conversations got — share of the ", c.count, " that reached each length:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "0.55rem",
      marginBottom: "3rem"
    }
  }, c.survival.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "0.85rem"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "0 0 88px",
      textAlign: "right",
      fontSize: "0.85rem",
      color: "var(--ink-soft)"
    }
  }, "≥ ", s.n, " messages"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      background: "var(--bg)",
      borderRadius: 5,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: shown ? `${s.pct}%` : 0,
      background: "var(--clay)",
      borderRadius: 5,
      transition: `width .9s cubic-bezier(.22,1,.36,1) ${i * 0.08}s`
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: "0 0 42px",
      fontSize: "0.85rem",
      color: "var(--ink)"
    }
  }, s.pct, "%")))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "0.92rem",
      color: "var(--ink-soft)",
      marginBottom: "1rem"
    }
  }, "Where the ", o.met + o.escalated + o.cold, " matches landed:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 40,
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid var(--line)"
    }
  }, [{
    label: "cold",
    n: o.cold,
    color: "var(--cold)",
    ink: "var(--ink-soft)"
  }, {
    label: "reached out",
    n: o.escalated,
    color: "var(--clay)",
    ink: "#fff"
  }, {
    label: "met",
    n: o.met,
    color: "var(--clay-deep)",
    ink: "#fff"
  }].map((seg, i) => {
    const tot = o.met + o.escalated + o.cold || 1;
    const w = seg.n / tot * 100;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      title: `${seg.label}: ${seg.n}`,
      style: {
        width: `${w}%`,
        background: seg.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: seg.ink,
        fontSize: "0.8rem",
        whiteSpace: "nowrap",
        overflow: "hidden"
      }
    }, w > 12 ? `${seg.label} · ${seg.n}` : seg.n);
  }))));
}

// ---------- closing / fit ----------
function Fit({
  fit
}) {
  const [ref, shown] = useReveal();
  const total = fit.myType + fit.notMyType || 1;
  return /*#__PURE__*/React.createElement("section", {
    ref: ref,
    style: {
      position: "relative",
      zIndex: 1,
      padding: "10vh 1.5rem 14vh",
      maxWidth: 640,
      margin: "0 auto",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--ink-faint)",
      marginBottom: "0.75rem"
    }
  }, "The last gate"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--serif)",
      fontWeight: 400,
      fontSize: "clamp(1.8rem,4vw,2.6rem)",
      lineHeight: 1.15,
      marginBottom: "2rem",
      letterSpacing: "-0.01em"
    }
  }, "Even reaching a date was close to a coin-flip on fit."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: "2.5rem",
      marginBottom: "2rem"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--serif)",
      fontSize: "3rem",
      color: "var(--sage)",
      opacity: shown ? 1 : 0,
      transition: "opacity .8s ease"
    }
  }, fit.myType), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--ink-soft)",
      fontSize: "0.9rem"
    }
  }, "your type")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--serif)",
      fontSize: "3rem",
      color: "var(--ink-faint)",
      opacity: shown ? 1 : 0,
      transition: "opacity .8s ease .2s"
    }
  }, fit.notMyType), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--ink-soft)",
      fontSize: "0.9rem"
    }
  }, "not"))), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--ink-soft)",
      fontSize: "1rem",
      maxWidth: 480,
      marginInline: "auto"
    }
  }, "This is a mirror, not a verdict — it only sees your side of things, and it can't tell who went quiet first. But the shape is real, and the shape is the point."));
}

// ---------- app ----------
function App() {
  const [data, setData] = useState(null);
  if (!data) return /*#__PURE__*/React.createElement(Upload, {
    onData: setData
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(Spine, null), /*#__PURE__*/React.createElement("header", {
    style: {
      position: "relative",
      zIndex: 1,
      textAlign: "center",
      padding: "6vh 1.5rem 2vh"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--serif)",
      fontStyle: "italic",
      fontSize: "1.4rem",
      color: "var(--clay-deep)"
    }
  }, "Your mirror"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setData(null),
    style: {
      marginTop: 8,
      background: "none",
      border: "none",
      color: "var(--ink-faint)",
      cursor: "pointer",
      fontSize: "0.85rem",
      textDecoration: "underline",
      textUnderlineOffset: 3
    }
  }, "start over with another file")), /*#__PURE__*/React.createElement(Funnel, {
    f: data.funnel
  }), /*#__PURE__*/React.createElement(Conversations, {
    c: data.conversation,
    o: data.outcomes
  }), /*#__PURE__*/React.createElement(Fit, {
    fit: data.fit
  }), /*#__PURE__*/React.createElement("footer", {
    style: {
      position: "relative",
      zIndex: 1,
      textAlign: "center",
      padding: "3vh 1.5rem 6vh",
      color: "var(--ink-faint)",
      fontSize: "0.82rem"
    }
  }, "Read entirely in your browser. Nothing was uploaded or stored."));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
