export const API_BASE = "";

export async function createRoom(payload) {
  const res = await fetch(`${API_BASE}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getRoom(code) {
  const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addPerson(code, group, name) {
  const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(code)}/people`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group, name })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updatePerson(code, person) {
  const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(code)}/people`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function removePerson(code, group, id) {
  const res = await fetch(
    `${API_BASE}/api/rooms/${encodeURIComponent(code)}/people/${encodeURIComponent(group)}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateTheme(code, theme) {
  const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(code)}/theme`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function listRooms() {
  const res = await fetch(`${API_BASE}/api/rooms`);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Failed to load rooms");
  }

  return text ? JSON.parse(text) : [];
}
export async function updateProficiencies(code, proficiencies) {
  const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(code)}/proficiencies`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proficiencies })
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to update proficiencies");
  return text ? JSON.parse(text) : null;
}

export async function updateSchedule(code, schedule) {
  const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(code)}/schedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schedule })
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to update schedule");
  return text ? JSON.parse(text) : null;
}
