import { useEffect, useMemo, useState } from "react";

export type CommandItem = {
  id: string;
  label: string;
  keywords?: string[];
  run: () => void;
};

type Props = {
  commands: CommandItem[];
};

export function CommandPalette({ commands }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;

    return commands.filter((c) => {
      const hay = `${c.label} ${(c.keywords ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const hotkey = isMac
        ? e.metaKey && e.key.toLowerCase() === "k"
        : e.ctrlKey && e.key.toLowerCase() === "k";

      if (hotkey) {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
      }

      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function runCommand(cmd: CommandItem) {
    setOpen(false);
    setQuery("");
    cmd.run();
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "start center",
        paddingTop: 90,
        zIndex: 9999,
      }}
      onMouseDown={() => {
        setOpen(false);
        setQuery("");
      }}
    >
      <div
        style={{
          width: "min(720px, 92vw)",
          background: "#fff",
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.15)",
          boxShadow: "0 20px 80px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command… (Esc to close)"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.2)",
              outline: "none",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ maxHeight: "55vh", overflow: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 14, opacity: 0.7 }}>No matches.</div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => runCommand(cmd)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  border: "none",
                  background: "#fff",
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  fontWeight: 700,
                }}
              >
                {cmd.label}
              </button>
            ))
          )}
        </div>

        <div style={{ padding: 10, fontSize: 12, opacity: 0.75 }}>
          Tip: Press <b>⌘K</b> anytime.
        </div>
      </div>
    </div>
  );
}
