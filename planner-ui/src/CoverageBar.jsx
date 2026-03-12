import { coverageFor } from "./utils";

export default function CoverageBar({ title, people }) {
  const cov = coverageFor(people);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span style={{ opacity: 0.7, fontSize: 12 }}>
          (0 = gap, 1 = thin coverage, 2+ = healthy)
        </span>
      </div>

      <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${cov.length || 1}, 1fr)` }}>
        {cov.map((c, i) => (
          <div
            key={i}
            style={{
              ...styles.cell,
              background: c === 0 ? "#5a0000" : c === 1 ? "#7a4a00" : "#0b5a0b"
            }}
            title={`Block ${i}: ${c} available`}
          >
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gap: 2,
    marginTop: 6
  },
  cell: {
    height: 22,
    fontSize: 12,
    lineHeight: "22px",
    textAlign: "center",
    borderRadius: 4,
    userSelect: "none"
  }
};
