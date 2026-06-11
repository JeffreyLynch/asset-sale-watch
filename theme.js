const THEME_STORAGE_KEY = "settings";

initTheme();

async function initTheme() {
  const select = document.querySelector("#themeSelect");
  const theme = await getStoredTheme();
  applyTheme(theme);

  if (select) {
    select.value = theme;
    select.addEventListener("change", async () => {
      await setStoredTheme(select.value);
      applyTheme(select.value);
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[THEME_STORAGE_KEY]) {
      applyTheme(changes[THEME_STORAGE_KEY].newValue?.theme || "auto");
      if (select) {
        select.value = changes[THEME_STORAGE_KEY].newValue?.theme || "auto";
      }
    }
  });
}

async function getStoredTheme() {
  const data = await chrome.storage.local.get(THEME_STORAGE_KEY);
  return data[THEME_STORAGE_KEY]?.theme || "auto";
}

async function setStoredTheme(theme) {
  const data = await chrome.storage.local.get(THEME_STORAGE_KEY);
  await chrome.storage.local.set({
    [THEME_STORAGE_KEY]: {
      ...(data[THEME_STORAGE_KEY] || {}),
      theme
    }
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme || "auto";
}
