// parser.js — runs entirely in the browser. Nothing is uploaded or stored.
// Takes the raw array from a Hinge matches.json and returns derived insights.

const PHONE_RE = /\+?\d[\d\s\-]{7,}\d/;
const SWITCH_RE = /whatsapp|instagram|\binsta\b|\bsnap\b|my number|exchange numbers|@\w+/i;
const MEET_RE = /\b(coffee|drink|dinner|date|grab|free (on|this|tomorrow|tonight)|let'?s meet|meet up)\b/i;

function sortedMessages(thread) {
  return (thread.chats || [])
    .filter((c) => c && c.body)
    .slice()
    .sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));
}

function isRealMatch(thread) {
  return Object.prototype.hasOwnProperty.call(thread, "match");
}

function metAt(thread) {
  const wm = thread.we_met || [];
  return wm.some((w) => w.did_meet_subject === "Yes");
}

function escalated(text) {
  return PHONE_RE.test(text) || SWITCH_RE.test(text);
}

// Classify a real match into one of three honest outcomes.
function outcomeOf(thread) {
  const msgs = sortedMessages(thread);
  const text = msgs.map((m) => m.body).join(" ");
  if (metAt(thread)) return "met";
  if (escalated(text)) return "escalated";
  return "cold";
}

export function analyze(raw) {
  if (!Array.isArray(raw)) throw new Error("Expected an array of matches.");

  const likesNoMatch = raw.filter((t) => !isRealMatch(t)).length;
  const matches = raw.filter(isRealMatch);
  const conversations = matches.filter((m) => sortedMessages(m).length > 0);

  let met = 0, escalatedCount = 0, cold = 0;
  let myTypeYes = 0, myTypeNo = 0;

  const convoLengths = [];
  const hourHistogram = new Array(24).fill(0);
  let totalMessages = 0;

  for (const m of matches) {
    const o = outcomeOf(m);
    if (o === "met") {
      met++;
      for (const w of m.we_met || []) {
        if (w.was_my_type === true) myTypeYes++;
        else if (w.was_my_type === false) myTypeNo++;
      }
    } else if (o === "escalated") escalatedCount++;
    else cold++;
  }

  for (const m of conversations) {
    const msgs = sortedMessages(m);
    convoLengths.push(msgs.length);
    totalMessages += msgs.length;
    for (const msg of msgs) {
      const h = parseInt((msg.timestamp || "").slice(11, 13), 10);
      if (!isNaN(h)) hourHistogram[h]++;
    }
  }

  convoLengths.sort((a, b) => a - b);
  const median = convoLengths.length
    ? convoLengths[Math.floor(convoLengths.length / 2)]
    : 0;

  // Survival curve: of real conversations, what fraction reached >= N messages.
  const milestones = [1, 2, 4, 8, 16, 32, 64];
  const survival = milestones.map((n) => ({
    n,
    pct: conversations.length
      ? Math.round(
          (convoLengths.filter((l) => l >= n).length / conversations.length) * 100
        )
      : 0,
  }));

  return {
    funnel: {
      likes: likesNoMatch,
      matches: matches.length,
      conversations: conversations.length,
      reached: escalatedCount + met,
      dates: met,
      myType: myTypeYes,
    },
    outcomes: { met, escalated: escalatedCount, cold },
    fit: { myType: myTypeYes, notMyType: myTypeNo },
    conversation: {
      count: conversations.length,
      median,
      longest: convoLengths.length ? convoLengths[convoLengths.length - 1] : 0,
      totalMessages,
      survival,
      hourHistogram,
    },
  };
}
