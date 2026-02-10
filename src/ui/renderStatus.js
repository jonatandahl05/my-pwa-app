//renderStatus.js
export function setStatus(text) {
    const statusEl = document.getElementById("status");
    statusEl.textContent = text;
}