// Ladda bara CSS direkt (det är lätt och påverkar inte prestanda)
import "./styles/main.css";

// Hämta DOM-element
const form = document.querySelector("#create-form");
const postsContainer = document.querySelector("#posts");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");
const adminLink = document.getElementById("admin-link");

// 🔐 Lazy-load login-modulen (den behövs direkt, men är liten)
import("./utils/login.js").then(({ initAuth, isAdmin }) => {
    initAuth(form, async () => {
        if (!adminLink) return;

        if (isAdmin()) {
            adminLink.style.display = "inline-block";

            // 🧩 Lazy-load admin-kod endast för admin-användare
            const adminModule = await import("./admin.js");
            adminModule.initAdmin();
        } else {
            adminLink.style.display = "none";
        }
    });
});


// ⭐ Funktion för att ladda och rendera inlägg
async function loadAndRenderPosts() {
    // Lazy-load status UI
    const { setStatus } = await import("./ui/renderStatus.js");
    setStatus("Laddar inlägg...");

    try {
        // Lazy-load API först när vi behöver det
        const { getPosts } = await import("./api/postsApi.js");
        const posts = await getPosts();

        // Lazy-load storage-modul
        const storage = await import("./storage/localPosts.js");
        storage.saveLocalPosts(posts);

        // Lazy-load renderPosts
        const { renderPosts } = await import("./ui/renderPosts.js");
        renderPosts(postsContainer, posts, handleDeletePost);

        setStatus(`Hittade ${posts.length} inlägg.`);
    } catch (err) {
        console.error("Error loading posts:", err);

        const { setStatus } = await import("./ui/renderStatus.js");
        const storage = await import("./storage/localPosts.js");
        const { renderPosts } = await import("./ui/renderPosts.js");

        const localPosts = storage.loadLocalPosts();
        renderPosts(postsContainer, localPosts, handleDeletePost);

        setStatus(
            localPosts.length
                ? `API: Offline. Visar ${localPosts.length} sparade inlägg (localStorage).`
                : "API: Offline. Inga lokala inlägg hittades."
        );
    }
}


// ⭐ Ta bort inlägg (med lazy-loaded moduler)
async function handleDeletePost(id) {
    const { setStatus } = await import("./ui/renderStatus.js");
    setStatus("Tar bort inlägg...");

    try {
        const { deletePost } = await import("./api/postsApi.js");
        await deletePost(id);

        setStatus("Inlägg borttaget.");
        loadAndRenderPosts();
    } catch (err) {
        console.error("Error deleting post:", err);

        const storage = await import("./storage/localPosts.js");
        storage.deleteLocalPost(id);

        setStatus("API: Offline. Tog bort inlägg lokalt (localStorage).");
        loadAndRenderPosts();
    }
}


// ⭐ Skapa inlägg (lazy-loaded API + storage)
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) return;

    const { setStatus } = await import("./ui/renderStatus.js");

    try {
        setStatus("Skapar...");

        const { createPost } = await import("./api/postsApi.js");
        await createPost({ title, content });

        titleInput.value = "";
        contentInput.value = "";

        await loadAndRenderPosts();
    } catch (err) {
        console.error(err);

        const storage = await import("./storage/localPosts.js");
        storage.addLocalPost({ title, content });

        titleInput.value = "";
        contentInput.value = "";

        setStatus("API: Offline. Sparade inlägget lokalt (localStorage).");
        await loadAndRenderPosts();
    }
});


// ⭐ Ladda inlägg vid start
loadAndRenderPosts();


// ⭐ Registrera Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
        .then(() => console.log("Service Worker registrerad"))
        .catch(err => console.error("SW error:", err));
}
