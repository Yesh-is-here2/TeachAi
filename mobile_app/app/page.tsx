"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: { score: number; doc_id: number }[];
  timestamp: Date;
};

type Level = "beginner" | "intermediate" | "advanced";
type Style = "simple" | "detailed" | "socratic";

export default function Page() {
  const [userId, setUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState<Level>("beginner");
  const [style, setStyle] = useState<Style>("simple");
  const [activeTab, setActiveTab] = useState<"chat" | "notes" | "learn">("chat");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteStatus, setNoteStatus] = useState("");

  const [learnTopic, setLearnTopic] = useState("");
  const [learnLoading, setLearnLoading] = useState(false);
  const [lesson, setLesson] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function ensureUserId(): Promise<string> {
    if (userId) return userId;
    const stored = localStorage.getItem("teachai_user_id");
    if (stored) { setUserId(stored); return stored; }
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok || !data.user_id) throw new Error("Failed to create session");
    setUserId(data.user_id);
    localStorage.setItem("teachai_user_id", data.user_id);
    return data.user_id;
  }

  useEffect(() => { ensureUserId().catch(() => {}); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function handleAsk() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);
    const userMsg: Message = { role: "user", content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const uid = await ensureUserId();
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, question: q, level, style, top_k: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.answer,
        sources: data.sources?.filter((s: { score: number; doc_id: number }) => s.score > 0.3),
        timestamp: new Date(),
      }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleIngest() {
    if (!noteText.trim()) return;
    setNoteLoading(true);
    setNoteStatus("");
    try {
      const uid = await ensureUserId();
      const res = await fetch(`${API_BASE}/ingest/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, title: noteTitle || "Notes", text: noteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Ingest failed");
      setNoteStatus(`✓ Saved ${data.chunks_added} chunks — notes are now searchable`);
      setNoteText("");
      setNoteTitle("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setNoteStatus(`⚠️ ${msg}`);
    } finally {
      setNoteLoading(false);
    }
  }

  async function handleLearn() {
    if (!learnTopic.trim()) return;
    setLearnLoading(true);
    setLesson("");
    try {
      const uid = await ensureUserId();
      const res = await fetch(`${API_BASE}/learn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, topic: learnTopic, level, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Learn failed");
      setLesson(data.lesson);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      setLesson(`⚠️ ${msg}`);
    } finally {
      setLearnLoading(false);
    }
  }

  const sidebarTabs = [
    { id: "chat" as const, icon: "💬", label: "Ask Python" },
    { id: "notes" as const, icon: "📝", label: "My Notes" },
    { id: "learn" as const, icon: "📚", label: "Learn Topic" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* TOP BAR */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(13,17,23,0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "var(--gold)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "16px",
          }}>🎓</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "0.3px" }}>TeachAI</div>
            <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>Python Tutor · RAG-Powered</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select value={level} onChange={(e) => setLevel(e.target.value as Level)} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            color: "var(--text)", borderRadius: "6px", padding: "6px 10px",
            fontSize: "12px", cursor: "pointer", outline: "none",
          }}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select value={style} onChange={(e) => setStyle(e.target.value as Style)} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            color: "var(--text)", borderRadius: "6px", padding: "6px 10px",
            fontSize: "12px", cursor: "pointer", outline: "none",
          }}>
            <option value="simple">Simple</option>
            <option value="detailed">Detailed</option>
            <option value="socratic">Socratic</option>
          </select>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 60px)" }}>

        {/* SIDEBAR */}
        <aside style={{
          width: "220px",
          borderRight: "1px solid var(--border)",
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          background: "rgba(13,17,23,0.6)",
          flexShrink: 0,
        }}>
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 20px",
                border: "none",
                borderLeft: activeTab === tab.id ? "2px solid var(--gold)" : "2px solid transparent",
                background: activeTab === tab.id ? "var(--gold-dim)" : "transparent",
                color: activeTab === tab.id ? "var(--gold)" : "var(--text-dim)",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s ease",
                fontFamily: "inherit",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}

          <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-dimmer)", marginBottom: "4px" }}>SESSION</div>
            <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "monospace", wordBreak: "break-all" }}>
              {userId ? userId.slice(0, 16) + "..." : "Connecting..."}
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* CHAT TAB */}
          {activeTab === "chat" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "28px 40px", display: "flex", flexDirection: "column", gap: "24px" }}>

                {messages.length === 0 && (
                  <div style={{ textAlign: "center", paddingTop: "60px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🐍</div>
                    <div style={{
                      fontSize: "22px", fontWeight: 700, marginBottom: "8px",
                      background: "linear-gradient(135deg, var(--gold), #ffcc44)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>
                      Ready to learn Python?
                    </div>
                    <div style={{ color: "var(--text-dim)", fontSize: "14px", maxWidth: "400px", margin: "0 auto", lineHeight: 1.7 }}>
                      Ask any Python question. Add your own notes in the Notes tab and I will use them to give you personalised answers.
                    </div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" }}>
                      {["How do Python decorators work?", "Explain list comprehensions", "What is a generator?"].map((q) => (
                        <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }} style={{
                          padding: "8px 16px", borderRadius: "20px",
                          border: "1px solid var(--border)", background: "var(--bg-card)",
                          color: "var(--text-dim)", fontSize: "12px", cursor: "pointer",
                          transition: "all 0.2s", fontFamily: "inherit",
                        }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: "6px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-dimmer)", paddingLeft: msg.role === "user" ? 0 : "4px" }}>
                      {msg.role === "user" ? "You" : "TeachAI"}
                      <span style={{ marginLeft: "6px" }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{
                      maxWidth: "72%", padding: "14px 18px",
                      borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                      background: msg.role === "user" ? "linear-gradient(135deg, rgba(240,165,0,0.15), rgba(240,165,0,0.08))" : "var(--bg-card)",
                      border: `1px solid ${msg.role === "user" ? "rgba(240,165,0,0.25)" : "var(--border)"}`,
                      fontSize: "14px", lineHeight: 1.75, color: "var(--text)",
                      whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", paddingLeft: "4px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-dimmer)" }}>From your notes:</span>
                        {msg.sources.map((s, si) => (
                          <span key={si} className="score-badge">doc #{s.doc_id} · {Math.round(s.score * 100)}%</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{
                      padding: "14px 18px", borderRadius: "4px 16px 16px 16px",
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                      display: "flex", gap: "5px", alignItems: "center",
                    }}>
                      {[0, 1, 2].map((d) => (
                        <div key={d} style={{
                          width: "6px", height: "6px", borderRadius: "50%",
                          background: "var(--gold)",
                          animation: `blink 1.2s ease ${d * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div style={{ borderTop: "1px solid var(--border)", padding: "16px 40px 20px", background: "rgba(13,17,23,0.9)" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <textarea
                    ref={textareaRef}
                    className="input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                    placeholder="Ask a Python question... (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    style={{ flex: 1, resize: "none" }}
                  />
                  <button className="btn-gold" onClick={handleAsk} disabled={!input.trim() || loading} style={{ padding: "12px 24px", flexShrink: 0 }}>
                    {loading ? "..." : "Ask →"}
                  </button>
                  {messages.length > 0 && (
                    <button className="btn-ghost" onClick={() => setMessages([])} style={{ padding: "12px 16px", flexShrink: 0 }}>
                      Clear
                    </button>
                  )}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-dimmer)", marginTop: "8px" }}>
                  Level: <span style={{ color: "var(--gold)" }}>{level}</span> · Style: <span style={{ color: "var(--gold)" }}>{style}</span> · Change in top bar
                </div>
              </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === "notes" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
              <div style={{ maxWidth: "680px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>My Notes</h2>
                <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "28px", lineHeight: 1.6 }}>
                  Paste your Python notes, documentation, or code snippets. TeachAI will chunk, embed, and use them to give you personalised answers.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>NOTE TITLE (optional)</label>
                    <input className="input" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g. Chapter 3 — Functions" />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>NOTE CONTENT</label>
                    <textarea className="input" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Paste your Python notes here..." rows={14} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <button className="btn-gold" onClick={handleIngest} disabled={!noteText.trim() || noteLoading}>
                      {noteLoading ? "Saving..." : "Save Notes →"}
                    </button>
                    {noteStatus && (
                      <span style={{ fontSize: "13px", color: noteStatus.startsWith("✓") ? "var(--green)" : "var(--red)" }}>
                        {noteStatus}
                      </span>
                    )}
                  </div>
                </div>
                <div className="card" style={{ marginTop: "36px", padding: "20px 24px" }}>
                  <div style={{ fontSize: "12px", color: "var(--gold)", letterSpacing: "1px", marginBottom: "12px", fontWeight: 600 }}>HOW NOTES WORK</div>
                  {[
                    ["1. Chunked", "Your notes are split into 900-char overlapping chunks"],
                    ["2. Embedded", "Each chunk is converted to a 1536-dim vector via OpenAI"],
                    ["3. Indexed", "Stored in a NumPy vector store for cosine similarity search"],
                    ["4. Retrieved", "When you ask a question, the top matching chunks are injected into the answer"],
                  ].map(([title, desc]) => (
                    <div key={title} style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
                      <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>{title}</span>
                      <span style={{ color: "var(--text-dim)", fontSize: "13px" }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEARN TAB */}
          {activeTab === "learn" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
              <div style={{ maxWidth: "720px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>Learn a Topic</h2>
                <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "28px" }}>
                  Get a full structured lesson on any Python topic — step-by-step explanation, code examples, common mistakes, and a mini quiz.
                </p>
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                  <input className="input" value={learnTopic} onChange={(e) => setLearnTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLearn()}
                    placeholder="e.g. decorators, async/await, list comprehensions..."
                    style={{ flex: 1 }} />
                  <button className="btn-gold" onClick={handleLearn} disabled={!learnTopic.trim() || learnLoading} style={{ flexShrink: 0 }}>
                    {learnLoading ? "Generating..." : "Generate Lesson →"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
                  {["Decorators", "Generators", "async/await", "Context Managers", "Type Hints", "Dataclasses"].map((t) => (
                    <button key={t} onClick={() => setLearnTopic(t)} className="btn-ghost" style={{ padding: "6px 14px", fontSize: "12px" }}>{t}</button>
                  ))}
                </div>
                {learnLoading && (
                  <div style={{ color: "var(--text-dim)", fontSize: "14px", animation: "blink 1.5s ease infinite" }}>
                    Generating lesson on "{learnTopic}"...
                  </div>
                )}
                {lesson && (
                  <div className="card" style={{ padding: "24px 28px" }}>
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "14px", lineHeight: 1.8, color: "var(--text)", background: "transparent", border: "none", padding: 0, margin: 0 }}>
                      {lesson}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}