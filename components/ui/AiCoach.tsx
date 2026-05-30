"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { weeklyReview, chatWithCoach, type AiCoachResult } from "@/lib/actions/ai";

type Tab = "review" | "chat";
type Message = { role: "user" | "assistant"; content: string };

function SectionCard({
  title,
  items,
  color,
  icon,
}: {
  title: string;
  items: string[];
  color: string;
  icon: string;
}) {
  if (items.length === 0) return null;
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${color}40`,
        borderRadius: "var(--radius-lg)",
        padding: 20,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          color,
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 14,
          fontFamily: "var(--font-display)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>{icon}</span> {title}
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "var(--color-text)",
              paddingLeft: 14,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                color,
                fontSize: 10,
                top: 4,
              }}
            >
              ▸
            </span>
            {item}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function MessageBubble({ msg, index }: { msg: Message; index: number }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "11px 16px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, var(--color-accent), #0050ff)"
            : "var(--color-surface)",
          border: isUser ? "none" : "1px solid var(--color-border)",
          color: isUser ? "#000" : "var(--color-text)",
          fontSize: 13,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

export function AiCoach({ contextJson }: { contextJson: string }) {
  const [tab, setTab] = useState<Tab>("review");
  const [reviewResult, setReviewResult] = useState<AiCoachResult | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewing, startReview] = useTransition();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isChatting, startChat] = useTransition();
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleReview() {
    setReviewError(null);
    startReview(async () => {
      try {
        const result = await weeklyReview(contextJson);
        setReviewResult(result);
      } catch (e) {
        setReviewError(e instanceof Error ? e.message : "Chyba při analýze");
      }
    });
  }

  function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const question = input.trim();
    setInput("");
    setChatError(null);

    const newHistory = [...messages, { role: "user" as const, content: question }];
    setMessages(newHistory);

    startChat(async () => {
      try {
        const answer = await chatWithCoach(contextJson, messages, question);
        setMessages([...newHistory, { role: "assistant" as const, content: answer }]);
      } catch (e) {
        setChatError(e instanceof Error ? e.message : "Chyba při komunikaci s AI");
      }
    });
  }

  const tabStyle = (active: boolean) => ({
    padding: "8px 20px",
    borderRadius: "var(--radius)",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    background: active ? "rgba(0,200,255,0.12)" : "transparent",
    color: active ? "var(--color-accent)" : "var(--color-text-muted)",
    border: active ? "1px solid rgba(0,200,255,0.25)" : "1px solid transparent",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 6 }}>
        <button style={tabStyle(tab === "review")} onClick={() => setTab("review")}>
          ◈ Weekly Review
        </button>
        <button style={tabStyle(tab === "chat")} onClick={() => setTab("chat")}>
          ✦ Chat s koučem
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Trigger */}
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: 24,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  marginBottom: 20,
                  lineHeight: 1.8,
                }}
              >
                AI dostane tvoje spočítané statistiky a vrátí strukturovanou analýzu —
                silné stránky, úniky a konkrétní doporučení. Žádné číslo nevymyslí.
              </p>
              <motion.button
                onClick={handleReview}
                disabled={isReviewing}
                whileHover={!isReviewing ? { scale: 1.02 } : {}}
                whileTap={!isReviewing ? { scale: 0.97 } : {}}
                style={{
                  padding: "12px 28px",
                  background: isReviewing
                    ? "var(--color-surface-2)"
                    : "linear-gradient(135deg, #00c8ff 0%, #0050ff 50%, #7c00ff 100%)",
                  color: isReviewing ? "var(--color-text-muted)" : "white",
                  border: "none",
                  borderRadius: "var(--radius)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: isReviewing ? "not-allowed" : "pointer",
                  letterSpacing: "0.04em",
                  boxShadow: isReviewing ? "none" : "0 4px 24px rgba(0,80,255,0.3)",
                }}
              >
                {isReviewing ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ◌
                    </motion.span>
                    Analyzuji...
                  </span>
                ) : (
                  "✦ Spustit týdenní review"
                )}
              </motion.button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {reviewError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: "var(--color-loss-dim)",
                    border: "1px solid var(--color-loss)",
                    borderRadius: "var(--radius)",
                    padding: "12px 16px",
                    color: "var(--color-loss)",
                    fontSize: 13,
                  }}
                >
                  {reviewError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {reviewResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {/* Top glow bar */}
                  <div
                    style={{
                      height: 2,
                      background:
                        "linear-gradient(90deg, transparent, var(--color-accent), #7c00ff, transparent)",
                      borderRadius: 2,
                    }}
                  />

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <SectionCard
                      title="Silné stránky"
                      items={reviewResult.strengths}
                      color="var(--color-profit)"
                      icon="↑"
                    />
                    <SectionCard
                      title="Úniky"
                      items={reviewResult.leaks}
                      color="var(--color-loss)"
                      icon="↓"
                    />
                    <SectionCard
                      title="Doporučení"
                      items={reviewResult.recommendations}
                      color="var(--color-accent)"
                      icon="→"
                    />
                  </div>

                  {reviewResult.flaggedTradeIds.length > 0 && (
                    <div
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius)",
                        padding: "12px 16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.1em",
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          marginBottom: 8,
                        }}
                      >
                        Flagnuté obchody
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {reviewResult.flaggedTradeIds.map((id) => (
                          <a
                            key={id}
                            href={`/trades/${id}`}
                            style={{
                              fontSize: 11,
                              padding: "4px 10px",
                              background: "var(--color-loss-dim)",
                              border: "1px solid var(--color-loss)",
                              borderRadius: 6,
                              color: "var(--color-loss)",
                              textDecoration: "none",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {id.slice(-6)}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {tab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: 0 }}
          >
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              {/* Messages */}
              <div
                style={{
                  minHeight: 320,
                  maxHeight: 520,
                  overflowY: "auto",
                  padding: "20px 20px 8px",
                }}
              >
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                      fontSize: 13,
                      paddingTop: 80,
                      lineHeight: 1.8,
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.4 }}>✦</div>
                    Zeptej se kouče na svůj styl obchodování,
                    <br />
                    specifické setupy nebo na to, co zlepšit.
                  </motion.div>
                )}
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} index={i} />
                ))}
                {isChatting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: "flex", gap: 4, paddingBottom: 8, paddingLeft: 4 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--color-accent)",
                        }}
                      />
                    ))}
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  padding: "12px 16px",
                }}
              >
                {chatError && (
                  <div
                    style={{
                      color: "var(--color-loss)",
                      fontSize: 12,
                      marginBottom: 8,
                    }}
                  >
                    {chatError}
                  </div>
                )}
                <form
                  onSubmit={handleChat}
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Zeptej se kouče na svůj trading..."
                    disabled={isChatting}
                    style={{
                      flex: 1,
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius)",
                      color: "var(--color-text)",
                      padding: "9px 14px",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <motion.button
                    type="submit"
                    disabled={isChatting || !input.trim()}
                    whileHover={!isChatting && input.trim() ? { scale: 1.05 } : {}}
                    whileTap={!isChatting && input.trim() ? { scale: 0.95 } : {}}
                    style={{
                      padding: "9px 18px",
                      background:
                        !isChatting && input.trim()
                          ? "var(--color-accent)"
                          : "var(--color-border)",
                      color: !isChatting && input.trim() ? "#000" : "var(--color-text-muted)",
                      border: "none",
                      borderRadius: "var(--radius)",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: !isChatting && input.trim() ? "pointer" : "not-allowed",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Odeslat →
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
