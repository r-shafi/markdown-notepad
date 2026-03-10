const loadedFonts = new Set<string>();

export function loadGoogleFont(fontFamily: string) {
  const name = fontFamily.replace(/'/g, "").split(",")[0].trim();
  if (
    loadedFonts.has(name) ||
    !name ||
    name === "monospace" ||
    name === "sans-serif" ||
    name === "serif"
  )
    return;
  loadedFonts.add(name);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}
