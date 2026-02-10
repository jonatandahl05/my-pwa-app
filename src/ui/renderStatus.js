console.log("🟢 renderStatus-modulen laddades (lazy-loaded)");


export function setStatus(text) {
    const statusEl = document.getElementById("status");
    statusEl.textContent = text;
}