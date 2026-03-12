import { useMemo, useState } from "react";
import { formatHM } from "./utils";

export default function PersonRow({ person, blocks, groupKey, onChange, onRemove }) {
  const [drag, setDrag] = useState(null); // null | "fill" | "clear"

  const total = useMemo(() => person.slots.filter(Boolean).length, [person.slots]);

  function setSlot(i, value) {
    const next = person.slots.slice();
    next[i] = value;
    onChange({ ...person, slots: next });
  }

  function onMouseDownCell(i) {
    const nextMode = person.slots[i] ? "clear" : "fill";
    setDrag(nextMode);
    setSlot(i, nextMode === "fill");
  }

  function onEnterCell(i) {
    if (!drag) return;
    setSlot(i, drag === "fill");
  }

  return (
    <div style={styles.row}>
      <div style={styles.left}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...styles.dot, background: person.color }} />
          <input
            value={person.name}
            onChange={(e) => onChange({ ...person, name: e.target.value })}
            style={styles.name}
          />
        </div>
        <div style={styles.meta}>
          {total} blocks • {groupKey}
        </div>
      </div>

      <div
        style={{ ...styles.grid, gridTemplateColumns: `repeat(${blocks.length || 1}, 1fr)` }}
        onMouseUp={() => setDrag(null)}
        onMouseLeave={() => setDrag(null)}
      >
      {person.slots.map((active, i) => {
        const b = blocks[i];
        const label = b ? `${formatHM(b.start)} - ${formatHM(b.end)}` : `${i}`;

        return (
          <div
            key={i}
            title={label}
            onMouseDown={() => onMouseDownCell(i)}
            onMouseEnter={() => onEnterCell(i)}
            style={{
              ...styles.cell,
              background: active ? person.color : "var(--panel)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              opacity: active ? 0.95 : 1
            }}
          >
            {label}
          </div>
        );
      })}
      </div>

      <button onClick={() => onRemove(groupKey, person.id)} style={styles.remove}>
        ✕
      </button>
    </div>
  );
}

const styles = {
  row: {
    display: "grid",
    gridTemplateColumns: "260px 1fr 40px",
    gap: 10,
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid var(--border)"
  },
  left: { display: "flex", flexDirection: "column", gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 999 },
  name: {
    width: 190,
    background: "var(--bg)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "6px 8px"
  },
  meta: { fontSize: 12, opacity: 0.7 },
  grid: { display: "grid", gap: 2 },
  cell: {
    minHeight: 42,
    borderRadius: 6,
    fontSize: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    userSelect: "none",
    cursor: "pointer",
    padding: "4px",
    whiteSpace: "normal",
    lineHeight: 1.2
  },
  remove: {
    height: 30,
    background: "var(--panel)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    cursor: "pointer"
  }
};
