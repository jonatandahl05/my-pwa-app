const KEY = "blog_settings_v1";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSettings(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
}
