export function blocksForRoom(room) {
  const start = new Date(room.startUtc);
  const end = new Date(room.endUtc);
  const interval = room.intervalMinutes;

  const blocks = [];
  let cur = new Date(start);

  while (cur < end) {
    const next = new Date(cur.getTime() + interval * 60000);
    blocks.push({ start: new Date(cur), end: next });
    cur = next;
  }
  return blocks;
}

export function formatHM(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function coverageFor(people) {
  const len = people.length ? people[0].slots.length : 0;
  const cov = Array(len).fill(0);
  for (const p of people) {
    for (let i = 0; i < len; i++) if (p.slots[i]) cov[i]++;
  }
  return cov;
}
