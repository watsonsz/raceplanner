export function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty("--bg", theme.background);
  root.style.setProperty("--panel", theme.panel);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--accent", theme.accent);
}

export const defaultTheme = {
  background: "#0b0b0b",
  panel: "#0f0f0f",
  text: "#ffffff",
  border: "#deddda",
  accent: "#ff6b6b"
};
