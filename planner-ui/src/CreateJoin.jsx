import { useEffect, useState } from "react";
import { createRoom, listRooms } from "./api";
import { defaultTheme } from "./theme";

export default function CreateJoin({ onEnterRoom }) {
  const [raceName, setRaceName] = useState("24h Endurance");
  const [teamName, setTeamName] = useState("Team");
  const [startLocal, setStartLocal] = useState(() => toLocalInputValue(new Date()));
  const [endLocal, setEndLocal] = useState(() => toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000)));
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [theme, setTheme] = useState(defaultTheme);
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState("");
  const [vehicles, setVehicles] = useState([""]);

  // NEW: daylight tracking state
  const [trackDaylightConditions, setTrackDaylightConditions] = useState(false);
  const [raceStartCondition, setRaceStartCondition] = useState("day"); // "day" | "night"
  const [timeUntilTransitionMinutes, setTimeUntilTransitionMinutes] = useState(60); // until next sunrise/sunset
  const [lengthOfDayMinutes, setLengthOfDayMinutes] = useState(720);
  const [lengthOfNightMinutes, setLengthOfNightMinutes] = useState(720);

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const data = await listRooms();
      setRooms(data);
    } catch (e) {
      setStatus(String(e));
    }
  }

  async function onCreate() {
    setStatus("Creating...");
    try {
      const payload = {
        raceName,
        teamName,
        startUtc: new Date(startLocal).toISOString(),
        endUtc: new Date(endLocal).toISOString(),
        intervalMinutes: Number(intervalMinutes),
        theme,
        vehicles: vehicles.map((v) => v.trim()).filter(Boolean),

        // NEW
        daylightSettings: trackDaylightConditions
          ? {
              enabled: true,
              raceStartCondition,
              timeUntilTransitionMinutes: Number(timeUntilTransitionMinutes),
              lengthOfDayMinutes: Number(lengthOfDayMinutes),
              lengthOfNightMinutes: Number(lengthOfNightMinutes)
            }
          : null
      };

      const state = await createRoom(payload);
      onEnterRoom(state.room.code);
    } catch (e) {
      setStatus(String(e));
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div>
            <h1 style={styles.title}>Endurance Planner</h1>
            <p style={styles.subtitle}>
              Create a race room, manage driver and pit crew availability, and coordinate your event in real time.
            </p>
          </div>
        </header>

        <div className="lobby-grid">
          <section style={styles.cardLarge}>
            <h2 style={styles.sectionTitle}>Create Race</h2>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Race Name</label>
                <input
                  style={styles.input}
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Team Name</label>
                <input
                  style={styles.input}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Start Time</label>
                <input
                  style={styles.input}
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>End Time</label>
                <input
                  style={styles.input}
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Interval</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(e.target.value)}
                />
              </div>
            </div>

            {/* NEW: Daylight section */}
            <div style={{ marginTop: 24 }}>
              <h3 style={styles.subheading}>Daylight Conditions</h3>

              <label style={styles.switchRow}>
                <input
                  type="checkbox"
                  checked={trackDaylightConditions}
                  onChange={(e) => setTrackDaylightConditions(e.target.checked)}
                />
                <span>Track Daylight Conditions?</span>
              </label>

              {trackDaylightConditions && (
                <div style={{ ...styles.formGrid, marginTop: 16 }}>
                  <div>
                    <label style={styles.label}>Race Start Condition</label>
                    <select
                      style={styles.input}
                      value={raceStartCondition}
                      onChange={(e) => setRaceStartCondition(e.target.value)}
                    >
                      <option value="day">Day</option>
                      <option value="night">Night</option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Time until Sunset/Sunrise (minutes)</label>
                    <input
                      style={styles.input}
                      type="number"
                      min="0"
                      value={timeUntilTransitionMinutes}
                      onChange={(e) => setTimeUntilTransitionMinutes(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Length of Day (minutes)</label>
                    <input
                      style={styles.input}
                      type="number"
                      min="1"
                      value={lengthOfDayMinutes}
                      onChange={(e) => setLengthOfDayMinutes(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Length of Night (minutes)</label>
                    <input
                      style={styles.input}
                      type="number"
                      min="1"
                      value={lengthOfNightMinutes}
                      onChange={(e) => setLengthOfNightMinutes(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <h3 style={styles.subheading}>Vehicles</h3>

              <div style={{ display: "grid", gap: 10 }}>
                {vehicles.map((vehicle, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <input
                      style={styles.input}
                      value={vehicle}
                      placeholder={`Vehicle ${i + 1}`}
                      onChange={(e) => {
                        const next = [...vehicles];
                        next[i] = e.target.value;
                        setVehicles(next);
                      }}
                    />
                    <button
                      style={styles.secondaryButton}
                      onClick={() => setVehicles(vehicles.filter((_, idx) => idx !== i))}
                      disabled={vehicles.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  style={styles.secondaryButton}
                  onClick={() => setVehicles([...vehicles, ""])}
                >
                  + Add Vehicle
                </button>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <h3 style={styles.subheading}>Color Scheme</h3>
              <div style={styles.themeGrid}>
                <ThemeColor
                  label="Background"
                  value={theme.background}
                  onChange={(v) => setTheme({ ...theme, background: v })}
                />
                <ThemeColor
                  label="Panel"
                  value={theme.panel}
                  onChange={(v) => setTheme({ ...theme, panel: v })}
                />
                <ThemeColor
                  label="Text"
                  value={theme.text}
                  onChange={(v) => setTheme({ ...theme, text: v })}
                />
                <ThemeColor
                  label="Border"
                  value={theme.border}
                  onChange={(v) => setTheme({ ...theme, border: v })}
                />
                <ThemeColor
                  label="Accent"
                  value={theme.accent}
                  onChange={(v) => setTheme({ ...theme, accent: v })}
                />
              </div>
            </div>

            <div style={styles.actions}>
              <button style={styles.primaryButton} onClick={onCreate}>
                Create Race
              </button>
            </div>
          </section>

          <section style={styles.cardSide}>
            <div style={styles.sideHeader}>
              <h2 style={styles.sectionTitle}>Active Races</h2>
              <button style={styles.secondaryButton} onClick={loadRooms}>
                Refresh
              </button>
            </div>

            <div style={styles.roomList}>
              {rooms.length === 0 ? (
                <div style={styles.emptyState}>No active rooms yet.</div>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.code}
                    style={styles.roomItem}
                    onClick={() => onEnterRoom(room.code)}
                  >
                    <div style={styles.roomTitle}>
                      {room.raceName} : {room.teamName}
                    </div>
                    <div style={styles.roomMeta}>
                      {new Date(room.startUtc).toLocaleString()} • {room.intervalMinutes}m{" "}
                      blocks
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>

        {status && <div style={styles.status}>{status}</div>}
      </div>
    </div>
  );
}

function ThemeColor({ label, value, onChange }) {
  return (
    <div style={styles.themeRow}>
      <span style={styles.themeLabel}>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <code style={styles.themeCode}>{value}</code>
    </div>
  );
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0b",
    color: "white",
    fontFamily: "system-ui, sans-serif",
    padding: "32px",
    display: "flex",
    justifyContent: "center"
  },
  shell: {
    maxWidth: "1400px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  hero: {
    marginBottom: "24px",
    textAlign: "center"
  },
  title: {
    margin: 0,
    fontSize: "2.5rem"
  },
  subtitle: {
    marginTop: "10px",
    opacity: 0.8,
    maxWidth: "850px",
    fontSize: "1rem",
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center"
  },
  cardLarge: {
    background: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "16px",
    padding: "24px",
    textAlign: "center"
  },
  cardSide: {
    background: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "16px",
    padding: "24px",
    minHeight: "500px",
    textAlign: "center"
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "1.5rem"
  },
  subheading: {
    marginBottom: "12px"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
    gap: "18px 20px",
    alignItems: "start"
  },
  label: {
    display: "block",
    marginBottom: "8px",
    opacity: 0.85
  },
  input: {
    width: "100%",
    background: "#111",
    color: "white",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "0.95rem",
    boxSizing: "border-box"
  },
  switchRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginTop: "8px"
  },
  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
    gap: "12px 20px",
    justifyItems: "center"
  },
  themeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px"
  },
  themeLabel: {
    width: "100px",
    opacity: 0.85
  },
  themeCode: {
    opacity: 0.75
  },
  actions: {
    marginTop: "24px",
    display: "flex",
    justifyContent: "center"
  },
  primaryButton: {
    background: "#1d1d1d",
    color: "white",
    border: "1px solid #444",
    borderRadius: "12px",
    padding: "12px 18px",
    cursor: "pointer",
    fontSize: "1rem"
  },
  secondaryButton: {
    background: "transparent",
    color: "white",
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "8px 12px",
    cursor: "pointer"
  },
  sideHeader: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px"
  },
  roomList: {
    display: "grid",
    gap: "12px"
  },
  roomItem: {
    textAlign: "center",
    background: "#111",
    color: "white",
    border: "1px solid #2b2b2b",
    borderRadius: "12px",
    padding: "14px",
    cursor: "pointer"
  },
  roomTitle: {
    fontWeight: 600,
    marginBottom: "6px"
  },
  roomMeta: {
    opacity: 0.75,
    fontSize: "0.9rem"
  },
  emptyState: {
    opacity: 0.7,
    padding: "12px 0"
  },
  status: {
    marginTop: "18px",
    opacity: 0.8
  }
};