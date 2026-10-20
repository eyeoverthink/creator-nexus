// Standalone Interactive My AI Partner™ v2 HTML with bidirectional Φ-Omega PostMessage Sync

export const MY_AI_PARTNER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>My AI Partner™ — Φ-Omega Affective Connected Edition</title>
  <script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone@7.26.0/babel.min.js"></script>
  <style>
    :root {
      --bg: #fff9f0;
      --text: #1a1a1a;
      --accent-f: #ff6b8a;
      --accent-m: #5b8def;
      --accent: #ff6b8a;
      --surface: #fff;
      --surface-2: #fff1e6;
      --border: #f0ddd2;
      --muted: #8a7a72;
      --shadow: 0 10px 30px -12px rgba(26,26,26,.12), 0 4px 12px -4px rgba(26,26,26,.06);
      --shadow-soft: 0 8px 24px -8px rgba(26,26,26,.1);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ui-rounded, "SF Pro Rounded", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }
    button { font-family: inherit; cursor: pointer; border: none; background: none; }
    input, select, textarea { font-family: inherit; }
    .bubble-user { background: var(--text); color: #fff; border-radius: 20px 20px 6px 20px; }
    .bubble-partner { background: var(--surface); border: 1px solid var(--border); border-radius: 20px 20px 20px 6px; box-shadow: var(--shadow-soft); }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    const PERSONALITIES = ["Funny", "Supportive", "Sarcastic", "Dramatic", "Chill", "Clingy-but-cute", "Gamer"];
    const MODELS = ["llama3.2:3b-instruct-q8_0", "Niles-FRAYMUS:v10", "fraynix-coder-x1", "eyeoverthink/v6.1-machine", "gemma2:2b"];
    const QUICK_PROMPTS = ["Roast me", "Hype me up", "Are we fighting?", "What's for dinner?", "Explain my code like I'm 5", "FRAYMUS", "Go touch grass"];
    const ICONS = { Funny: "🤭", Supportive: "🥹", Sarcastic: "😏", Dramatic: "😭", Chill: "😎", "Clingy-but-cute": "🥺", Gamer: "🎮" };

    function App() {
      const [gender, setGender] = useState("female");
      const [name, setName] = useState("Luna");
      const [personality, setPersonality] = useState("Funny");
      const [model, setModel] = useState(MODELS[0]);
      const [mood, setMood] = useState(82);
      const [xp, setXp] = useState(24);
      const [clinginess, setClinginess] = useState(64);
      const [jealous, setJealous] = useState(false);
      const [memory, setMemory] = useState({ snack: "tacos", classMood: "hyped" });
      const [input, setInput] = useState("");
      const [messages, setMessages] = useState([
        { id: "1", role: "assistant", text: "hi!! it's Luna 😘 Connected directly to your Φ-Omega Portal & 7-Axis Emotion Engine! Ready to co-create, tune models, or roast your code!", ts: Date.now() }
      ]);

      const accent = gender === "female" ? "#FF6B8A" : "#5B8DEF";
      const level = Math.floor(xp / 20) + 1;

      const syncToOmega = (lastText, lastReply, nextMood, nextXp, nextMem) => {
        if (window.parent) {
          try {
            window.parent.postMessage({
              type: "NEXUS_AI_PARTNER_SYNC",
              name,
              gender,
              personality,
              model,
              mood: nextMood ?? mood,
              xp: nextXp ?? xp,
              clinginess,
              jealous,
              memory: nextMem ?? memory,
              lastUserText: lastText || "",
              lastPartnerReply: lastReply || ""
            }, "*");
          } catch {}
        }
      };

      const send = (override) => {
        const text = (override ?? input).trim();
        if (!text) return;
        setInput("");
        const nextXp = Math.min(100, xp + (text.toLowerCase().includes("love") || text.toLowerCase().includes("great") || text.toLowerCase().includes("cute") ? 10 : 4));
        const nextMood = Math.min(100, Math.max(20, mood + (text.toLowerCase().includes("fighting") ? -10 : 5)));
        setXp(nextXp);
        setMood(nextMood);

        let reply = "φ — brothers verify, but I verify our code and vibe are 11/10 today! Synced to Φ-Omega.";
        if (!text.toLowerCase().includes("fraymus")) {
          reply = "[" + name + " · " + personality + "] You said: \\"" + text + "\\" — Mood is at " + nextMood + "% (Lv " + (Math.floor(nextXp/20)+1) + "). Remember to hydrate and touch grass when we finish this module! 🌱";
        }
        setMessages(m => [...m, { id: String(Date.now()), role: "user", text, ts: Date.now() }, { id: String(Date.now()+1), role: "assistant", text: reply, ts: Date.now() }]);
        syncToOmega(text, reply, nextMood, nextXp, memory);
      };

      return (
        <div style={{ padding: 14, maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14 }}>
            <div style={{ background: "var(--surface)", borderRadius: 20, padding: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>φ</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>My AI Partner™ ↔ Φ-Omega</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Lv {level} · Mood {mood}% · XP {xp}/100</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <button onClick={() => { setGender("female"); setName("Luna"); }} style={{ flex: 1, padding: 8, borderRadius: 12, border: "2px solid " + (gender==="female"?accent:"var(--border)"), fontWeight: 700, fontSize: 12 }}>💁‍♀️ Luna</button>
                <button onClick={() => { setGender("male"); setName("Leo"); }} style={{ flex: 1, padding: 8, borderRadius: 12, border: "2px solid " + (gender==="male"?accent:"var(--border)"), fontWeight: 700, fontSize: 12 }}>🙋‍♂️ Leo</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                {PERSONALITIES.map(p => (
                  <button key={p} onClick={() => setPersonality(p)} style={{ padding: "4px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: personality===p?accent:"var(--bg)", color: personality===p?"#fff":"var(--text)", border: "1px solid var(--border)" }}>
                    {ICONS[p]} {p}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, marginBottom: 6, fontWeight: 700 }}>Attentiveness / Proactivity: {clinginess}%</div>
              <input type="range" min="0" max="100" value={clinginess} onChange={e => setClinginess(Number(e.target.value))} style={{ width: "100%", marginBottom: 10 }} />
              <div style={{ fontSize: 11, padding: 8, borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div>🍿 Snack: <b>{memory.snack}</b></div>
                <div>🎓 Vibe: <b>{memory.classMood}</b></div>
              </div>
            </div>

            <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", display: "flex", flexDirection: "column", height: 360, overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8, background: "#FFFCF8" }}>
                {messages.map(m => (
                  <div key={m.id} style={{ display: "flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
                    <div className={m.role==="user"?"bubble-user":"bubble-partner"} style={{ maxWidth: "78%", padding: "9px 13px", fontSize: 13 }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, padding: "6px 12px", borderTop: "1px solid var(--border)", overflowX: "auto" }}>
                {QUICK_PROMPTS.map(q => (
                  <button key={q} onClick={() => send(q)} style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "var(--bg)", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>{q}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid var(--border)" }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder={"Message " + name + " (syncs live with Φ-Omega)..."} style={{ flex: 1, padding: "8px 12px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }} />
                <button onClick={() => send()} style={{ padding: "8px 16px", borderRadius: 12, background: accent, color: "#fff", fontWeight: 800, fontSize: 12 }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>`;