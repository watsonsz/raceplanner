import { useEffect, useMemo, useState } from "react";
import * as signalR from "@microsoft/signalr";
import {
  API_BASE,
  addPerson,
  getRoom,
  removePerson,
  updatePerson,
  updateTheme,
  updateProficiencies,
  updateSchedule
} from "./api";
import CoverageBar from "./CoverageBar";
import PersonRow from "./PersonRow";
import { applyTheme, defaultTheme } from "./theme";
import { blocksForRoom } from "./utils";

export default function RoomView({ code, onExit }) {
  const [state, setState] = useState(null);
  const [status, setStatus] = useState("loading...");

  // load room + connect hub
  useEffect(() => {
    let connection;

    async function start() {
      setStatus("loading...");
      const initial = await getRoom(code);
      setState(initial);
      applyTheme(initial.room.theme ?? defaultTheme);

      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE}/plannerHub`)
        .withAutomaticReconnect()
        .build();

      connection.on("StateUpdated", (s) => {
        setState(s);
        applyTheme(s.room.theme ?? defaultTheme);
      });

      connection.onreconnecting(() => setStatus("reconnecting..."));
      connection.onreconnected(() => setStatus("live"));
      connection.onclose(() => setStatus("offline"));

      await connection.start();
      await connection.invoke("JoinRoom", code);
      setStatus("live");
    }

    start().catch((e) => {
      console.error(e);
      setStatus(String(e));
    });

    return () => {
      if (connection) connection.stop();
    };
  }, [code]);

  const room = state?.room;
  const drivers = state?.drivers ?? [];
  const pit = state?.pitCrew ?? [];
  const vehicles = state?.vehicles ?? [];
  const proficiencies = state?.proficiencies ?? [];
  const schedule = state?.schedule ?? [];
  const blocks = useMemo(() => (room ? blocksForRoom(room) : []), [room]);

  async function onChangePerson(groupKey, person) {
    // optimistic
    setState((prev) => {
      if (!prev) return prev;
      const key = groupKey === "drivers" ? "drivers" : "pitCrew";
      const nextList = prev[key].map((p) => (p.id === person.id ? person : p));
      return { ...prev, [key]: nextList };
    });

    await updatePerson(code, { group: groupKey, ...person });
  }

  async function onAdd(groupKey) {
    const name = prompt(groupKey === "drivers" ? "Driver name?" : "Crew name?");
    if (!name) return;

    const nextState = await addPerson(code, groupKey, name.trim());
    setState(nextState);
    applyTheme(nextState.room.theme ?? defaultTheme);
  }

  async function onRemove(groupKey, id) {
    const nextState = await removePerson(code, groupKey, id);
    setState(nextState);
    applyTheme(nextState.room.theme ?? defaultTheme);
  }

  async function onThemeChange(nextTheme) {
    applyTheme(nextTheme);
    await updateTheme(code, nextTheme);
  }

async function onChangeProficiency(personId, vehicleId, rating) {
  const next = [...proficiencies];
  const idx = next.findIndex(
    (p) => p.personId === personId && p.vehicleId === vehicleId
  );

  if (idx >= 0) {
    next[idx] = { ...next[idx], rating };
  } else {
    next.push({ personId, vehicleId, rating });
  }

  setState((prev) => prev ? { ...prev, proficiencies: next } : prev);

  const nextState = await updateProficiencies(code, next);
  if (nextState) {
    setState(nextState);
    applyTheme(nextState.room.theme ?? defaultTheme);
  }
}

async function onChangeScheduleEntry(blockIndex, role, field, value) {
  const next = [...schedule];
  let idx = next.findIndex((s) => s.blockIndex === blockIndex && s.role === role);

  if (idx < 0) {
    next.push({
      blockIndex,
      role,
      personId: "",
      vehicleId: null
    });
    idx = next.length - 1;
  }

  next[idx] = {
    ...next[idx],
    [field]: value === "" ? (field === "vehicleId" ? null : "") : value
  };

  const cleaned = next.filter((s) => s.personId);

  setState((prev) => prev ? { ...prev, schedule: cleaned } : prev);

  const nextState = await updateSchedule(code, cleaned);
  if (nextState) {
    setState(nextState);
    applyTheme(nextState.room.theme ?? defaultTheme);
  }
}

if (!state) {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={{ marginTop: 0 }}>Loading Room</h1>
            <div style={{ opacity: 0.8 }}>{status}</div>
          </div>

          <button style={styles.button} onClick={onExit}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
return (
  <div style={styles.page}>
    <div style={styles.shell}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={{ margin: 0 }}>{room.raceName}</h1>
          <div style={{ opacity: 0.8 }}>
            Team: <b>{room.teamName}</b> • Interval: <b>{room.intervalMinutes}m</b> • Status: {status}
          </div>
        </div>

        <button style={styles.button} onClick={onExit}>
          Exit
        </button>
      </div>

      <ThemeBar theme={room.theme ?? defaultTheme} onChange={onThemeChange} />

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
         <h2 style={{ margin: 0 }}>Driver Availability</h2> 
          <button style={styles.button} onClick={() => onAdd("drivers")}>
            + Add Driver
          </button>
        </div>

        <CoverageBar title="Driver Coverage" people={drivers} />

        {drivers.map((p) => (
          <PersonRow
            key={p.id}
            person={p}
            blocks={blocks}
            groupKey="drivers"
            onChange={(np) => onChangePerson("drivers", np)}
            onRemove={onRemove}
          />
        ))}
      </section>

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
         <h2 style={{ margin: 0 }}>Pit Crew Availability</h2> 
          <button style={styles.button} onClick={() => onAdd("pitcrew")}>
            + Add Crew
          </button>
        </div>

        <CoverageBar title="Pit Crew Coverage" people={pit} />

        {pit.map((p) => (
          <PersonRow
            key={p.id}
            person={p}
            blocks={blocks}
            groupKey="pitcrew"
            onChange={(np) => onChangePerson("pitcrew", np)}
            onRemove={onRemove}
          />
        ))}
      </section>
      {vehicles.length > 1 && (
  <section style={styles.card}>
    <h2 style={{ marginTop: 0 }}>Vehicle Proficiency</h2>
    <VehicleProficiencySection
      drivers={drivers}
      vehicles={vehicles}
      proficiencies={proficiencies}
      onChange={onChangeProficiency}
    />
  </section>
)}

<section style={styles.card}>
  <h2 style={{ marginTop: 0 }}>Race Schedule</h2>
  <ScheduleSection
  blocks={blocks}
  intervalMinutes={room.intervalMinutes}
  daylightSettings={room.daylightSettings}
  drivers={drivers}
  pit={pit}
  vehicles={vehicles}
  schedule={schedule}
  onChange={onChangeScheduleEntry}
/>
</section>
    </div>
  </div>
);
}

function ThemeBar({ theme, onChange }) {
  function set(key, val) {
    onChange({ ...theme, [key]: val });
  }

  return (
    <div style={styles.card}>
     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <h2 style={{ margin: 0 }}>Theme</h2>
      <div style={{ opacity: 0.7, fontSize: 12 }}>Changes sync live to everyone in this room</div>
    </div> 
      <div style={styles.themeGrid}>
        <Color label="Background" value={theme.background} onChange={(v) => set("background", v)} />
        <Color label="Panel" value={theme.panel} onChange={(v) => set("panel", v)} />
        <Color label="Text" value={theme.text} onChange={(v) => set("text", v)} />
        <Color label="Border" value={theme.border} onChange={(v) => set("border", v)} />
        <Color label="Accent" value={theme.accent} onChange={(v) => set("accent", v)} />
      </div>
    </div>
  );
}

function Color({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <div style={{ width: 90, opacity: 0.8, textAlign: "right" }}>{label}</div>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <code style={{ opacity: 0.8, minWidth: 80 }}>{value}</code>
    </div>
  );
}
function VehicleProficiencySection({ drivers, vehicles, proficiencies, onChange }) {
  function getRating(personId, vehicleId) {
    const found = proficiencies.find(
      (p) => p.personId === personId && p.vehicleId === vehicleId
    );
    return found?.rating ?? "Passable";
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={tableStyles.th}>Driver</th>
            {vehicles.map((vehicle) => (
              <th key={vehicle.id} style={tableStyles.th}>
                {vehicle.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.id}>
              <td style={tableStyles.tdStrong}>{driver.name}</td>
              {vehicles.map((vehicle) => (
                <td key={vehicle.id} style={tableStyles.td}>
                  <select
                    style={tableStyles.select}
                    value={getRating(driver.id, vehicle.id)}
                    onChange={(e) => onChange(driver.id, vehicle.id, e.target.value)}
                  >
                    <option value="Proficient">Proficient</option>
                    <option value="Passable">Passable</option>
                    <option value="Bad">Bad</option>
                  </select>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleSection({
  blocks,
  intervalMinutes,
  daylightSettings,
  drivers,
  pit,
  vehicles,
  schedule,
  onChange
}) {
  function getEntry(blockIndex, role) {
    return schedule.find((s) => s.blockIndex === blockIndex && s.role === role);
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={tableStyles.th}>Time</th>
            <th style={tableStyles.th}>Driver</th>
            <th style={tableStyles.th}>Vehicle</th>
            <th style={tableStyles.th}>Pit Crew</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block, i) => {
           const driverEntry = getEntry(i, "driver");
           const pitEntry = getEntry(i, "pitcrew");
           const offsetMinutes = i * intervalMinutes;
           const daylightState = getDaylightStateForInterval(daylightSettings, offsetMinutes, intervalMinutes);
           const daylightIcon = getDaylightIcon(daylightState);
           const daylightLabel = getDaylightLabel(daylightState); 

            return (
              <tr key={i}>
                <td style={tableStyles.td}>
                  <div style={tableStyles.timeCell}>
                 {daylightIcon && (
                    <div style={tableStyles.daylightIcon}>
                      {daylightIcon}
                    </div>
                  )} 
                    <span>
                      {block.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {block.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </td>

                <td style={tableStyles.td}>
                  <select
                    style={tableStyles.select}
                    value={driverEntry?.personId ?? ""}
                    onChange={(e) => onChange(i, "driver", "personId", e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={tableStyles.td}>
                  <select
                    style={tableStyles.select}
                    value={driverEntry?.vehicleId ?? ""}
                    onChange={(e) =>
                      onChange(i, "driver", "vehicleId", e.target.value === "" ? null : Number(e.target.value))
                    }
                  >
                    <option value="">Unassigned</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={tableStyles.td}>
                  <select
                    style={tableStyles.select}
                    value={pitEntry?.personId ?? ""}
                    onChange={(e) => onChange(i, "pitcrew", "personId", e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {pit.map((crew) => (
                      <option key={crew.id} value={crew.id}>
                        {crew.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getDaylightStateForInterval(daylightSettings, offsetMinutes, intervalMinutes) {
  if (!daylightSettings?.enabled) return null;

  const startCondition = getDaylightConditionAtOffset(daylightSettings, offsetMinutes);
  if (!startCondition) return null;

  const minutesUntilTransition = getMinutesUntilNextTransition(daylightSettings, offsetMinutes);

  const hasTransitionDuringInterval =
    minutesUntilTransition !== null && minutesUntilTransition < intervalMinutes;

  if (!hasTransitionDuringInterval) {
    return {
      startCondition,
      type: startCondition
    };
  }

  if (startCondition === "day") {
    return {
      startCondition,
      type: "sunset"
    };
  }

  return {
    startCondition,
    type: "sunrise"
  };
}

function getDaylightConditionAtOffset(daylightSettings, offsetMinutes) {
  if (!daylightSettings?.enabled) return null;

  let currentCondition = daylightSettings.raceStartCondition;
  let remaining = Number(daylightSettings.timeUntilTransitionMinutes);
  let minutesLeft = Number(offsetMinutes);

  if (remaining < 0) return null;
  if (
    Number(daylightSettings.lengthOfDayMinutes) <= 0 ||
    Number(daylightSettings.lengthOfNightMinutes) <= 0
  ) {
    return null;
  }

  while (minutesLeft >= remaining) {
    minutesLeft -= remaining;
    currentCondition = currentCondition === "day" ? "night" : "day";
    remaining =
      currentCondition === "day"
        ? Number(daylightSettings.lengthOfDayMinutes)
        : Number(daylightSettings.lengthOfNightMinutes);

    if (remaining <= 0) return null;
  }

  return currentCondition;
}

function getMinutesUntilNextTransition(daylightSettings, offsetMinutes) {
  if (!daylightSettings?.enabled) return null;

  let currentCondition = daylightSettings.raceStartCondition;
  let remaining = Number(daylightSettings.timeUntilTransitionMinutes);
  let minutesLeft = Number(offsetMinutes);

  if (remaining < 0) return null;
  if (
    Number(daylightSettings.lengthOfDayMinutes) <= 0 ||
    Number(daylightSettings.lengthOfNightMinutes) <= 0
  ) {
    return null;
  }

  while (minutesLeft >= remaining) {
    minutesLeft -= remaining;
    currentCondition = currentCondition === "day" ? "night" : "day";
    remaining =
      currentCondition === "day"
        ? Number(daylightSettings.lengthOfDayMinutes)
        : Number(daylightSettings.lengthOfNightMinutes);

    if (remaining <= 0) return null;
  }

  return remaining - minutesLeft;
}

function getDaylightIcon(daylightState) {
  if (!daylightState) return null;

  return <DaylightIcon type={daylightState.type} />;
}

function DaylightIcon({ type }) {
  return (
    <div style={iconStyles.wrapper} title={getDaylightLabel({ type })}>
      {type === "day" && <div style={iconStyles.sun} />}
     {type === "night" && (
        <div style={iconStyles.moon}>
          <div style={iconStyles.moonCut} />
        </div>
      )} 
      {type === "sunrise" && (
        <div style={iconStyles.transition}>
          <div style={iconStyles.moonHalf} />
          <div style={iconStyles.sunHalf} />
        </div>
      )}
      {type === "sunset" && (
        <div style={iconStyles.transition}>
          <div style={iconStyles.sunHalf} />
          <div style={iconStyles.moonHalf} />
        </div>
      )}
    </div>
  );
}

function getDaylightLabel(daylightState) {
  if (!daylightState) return "";

  switch (daylightState.type) {
    case "day":
      return "Day";
    case "night":
      return "Night";
    case "sunrise":
      return "Sunrise during interval";
    case "sunset":
      return "Sunset during interval";
    default:
      return "";
  }
}
const DAY_COLOR="#f5c542";
const NIGHT_COLOR="#2f4f7a"
const tableStyles = {
  timeCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  daylightIcon: {
    fontSize: "1rem",
    lineHeight: 1
  },
  th: {
    borderBottom: "1px solid var(--border)",
    padding: "10px",
    textAlign: "left"
  },
  td: {
    borderBottom: "1px solid var(--border)",
    padding: "10px",
    textAlign: "left"
  },
  tdStrong: {
    borderBottom: "1px solid var(--border)",
    padding: "10px",
    textAlign: "left",
    fontWeight: 600
  },
  select: {
    width: "100%",
    background: "var(--bg)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px"
  }
};
const iconStyles = {
  wrapper: {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  // full sun
  sun: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: DAY_COLOR,
    boxShadow: `0 0 6px ${DAY_COLOR}`
  },

  // crescent moon
  moon: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: NIGHT_COLOR,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 0 6px ${NIGHT_COLOR}`
  },

  // fake crescent cutout
  moonCut: {
    position: "absolute",
    top: 0,
    left: 5,
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "var(--panel)"
  },

  // sunrise/sunset container
  transition: {
    display: "flex",
    width: 16,
    height: 12,
    borderRadius: 5,
    overflow: "hidden",
    border: "1px solid var(--border)"
  },

  sunHalf: {
    flex: 1,
    background: DAY_COLOR
  },

  moonHalf: {
    flex: 1,
    background: NIGHT_COLOR
  }
};
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    fontFamily: "system-ui, sans-serif",
    padding: "32px",
    display: "flex",
    justifyContent: "center"
  },

  shell: {
    width: "100%",
    maxWidth: "1600px",
    margin: "0 auto"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    marginBottom: "18px"
  },

  headerLeft: {
    flex: 1,
    textAlign: "center"
  },

  card: {
    marginTop: "14px",
    padding: "18px",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    background: "var(--panel)"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px"
  },

  button: {
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "8px 12px",
    cursor: "pointer"
  },

  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "10px",
    marginTop: "10px"
  }
};
