//onlineStatus.js
export function initOnlineStatus(setStatus) {
    function update() {
        if (navigator.onLine) {
            setStatus("Online");
        } else {
            setStatus("Offline – visar cache");
        }
    }

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
}