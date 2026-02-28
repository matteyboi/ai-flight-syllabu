import { useEffect, useMemo, useRef, useState } from "react";

export type Command = {
  id: string;
  label: string;
  keywords?: string[];
  run: () => void;
};

type Props = {
  commands: Command[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function CommandBar({ commands, isOpen, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // global hotkey: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isK = e.key.toLowerCase() === "k";
      const meta = e.metaKey || e.ctrlKey;
      if (meta && isK) {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const clearId = window.setTimeout(() => setQuery(""), 0);
    const focusId = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(clearId);
      window.clearTimeout(focusId);
    };
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return commands;

    return commands.filter((c) => {
      const hay = [c.label, ...(c.keywords ?? [])].map(normalize).join(" ");
      return hay.includes(q);
    });
  }, [commands, query]);

  function runCommand(cmd: Command) {
    onOpenChange(false);
    setQuery("");
    // tiny delay so UI closes cleanly
    setTimeout(() => cmd.run(), 0);
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "start center",
        paddingTop: 80,
        zIndex: 9999,
      }}
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        style={{
          width: "min(720px, 92vw)",
          borderRadius: 16,
          border: "2px solid #111",
          background: "#fff",
          color: "#111",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command… (Esc to close)"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "2px solid #111",
              fontWeight: 800,
              outline: "none",
              color: "#111",
            }}
          />
        </div>

        <div style={{ maxHeight: "50vh", overflow: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 14, opacity: 0.8 }}>No matches.</div>
          ) : (
            <div style={{ display: "grid" }}>
              {filtered.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => runCommand(cmd)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    border: "none",
                    borderBottom: "1px solid #eee",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 900,
                    color: "#111",
                  }}
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 10,
            borderTop: "1px solid #eee",
            fontSize: 12,
            opacity: 0.8,
          }}
        >
          Tip: Cmd+K / Ctrl+K opens this. Esc closes it.
        </div>
      </div>
    </div>
  );
}