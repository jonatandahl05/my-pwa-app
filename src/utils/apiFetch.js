export async function apiFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error("Fetch failed + ${res.status}");

        if (res.status === 204) 
            return null; // No content to return

        return res.json();

    } catch (err) {
        console.error("API Fetch Error:", err);
        throw err; // Re-throw the error for further handling
    }

}