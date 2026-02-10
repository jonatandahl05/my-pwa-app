import "./styles/main.css";
import { getPosts, createPost, deletePost } from "./api/postsApi.js";
import { setStatus } from "./ui/renderStatus.js";
import { appendPosts } from "./ui/renderPosts.js";
import { initAuth, isAdmin } from "./utils/login.js";
import {
    loadLocalPosts,
    addLocalPost,
    deleteLocalPost,
    saveLocalPosts,
} from "./storage/localPosts.js";

// DOM-element
const form = document.querySelector("#create-form");
const postsContainer = document.querySelector("#posts");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");
const adminLink = document.getElementById("admin-link");

// Pagination-variabler
let allPosts = [];
let page = 0;
const PAGE_SIZE = 5;
let allPostsLoaded = false;

// Loading state
let isLoading = false;
let errorMessage = "";

// Initialisera autentisering
initAuth(form, () => {
    if (!adminLink) return;
    adminLink.style.display = isAdmin() ? "inline-block" : "none";
});

if (adminLink && !isAdmin()) {
    adminLink.style.display = "none";
}

// Laddar nasta sida av posts fran allPosts-arrayen
function loadMorePosts() {
    if (allPostsLoaded) return;

    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = allPosts.slice(start, end);

    if (slice.length === 0) {
        allPostsLoaded = true;
        return;
    }

    appendPosts(postsContainer, slice, handleDeletePost);
    page++;
}

// Renderar baserat pa loading state
function render() {
    postsContainer.innerHTML = "";

    if (isLoading) {
        postsContainer.innerHTML = "<p>Laddar inlagg...</p>";
        return;
    }

    if (errorMessage) {
        postsContainer.innerHTML = `<p>${errorMessage}</p>`;
    }

    page = 0;
    allPostsLoaded = false;
    loadMorePosts();
}

// Hamtar posts fran API
async function fetchPosts() {
    const posts = await getPosts();
    return posts;
}

// Laddar posts fran API eller localStorage
async function loadPosts() {
    try {
        const posts = await fetchPosts();
        saveLocalPosts(posts);
        allPosts = posts;
        errorMessage = "";
        setStatus(`Hittade ${posts.length} inlagg.`);
    } catch (err) {
        console.error("Error loading posts:", err);
        const localPosts = loadLocalPosts();
        allPosts = localPosts;

        if (localPosts.length) {
            errorMessage = "";
            setStatus(`API: Offline. Visar ${localPosts.length} sparade inlagg.`);
        } else {
            errorMessage = "Kunde inte ladda inlagg.";
            setStatus("API: Offline. Inga lokala inlagg hittades.");
        }
    }
}

// Huvudfunktion for att ladda och rendera posts
async function loadAndRenderPosts() {
    try {
        isLoading = true;
        errorMessage = "";
        render();

        await loadPosts();
    } catch (err) {
        console.error("Unexpected error:", err);
        errorMessage = "Ett ovantat fel intraffade.";
    } finally {
        isLoading = false;
        render();
    }
}

// Tar bort en post via API eller lokalt
async function handleDeletePost(id) {
    setStatus("Tar bort inlagg...");

    try {
        await deletePost(id);
        setStatus("Inlagg borttaget.");
        await loadAndRenderPosts();
    } catch (err) {
        console.error("Error deleting post:", err);
        deleteLocalPost(id);
        setStatus("API: Offline. Tog bort inlagg lokalt.");
        await loadAndRenderPosts();
    }
}

// Hanterar formular-submit for att skapa ny post
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        if (!title || !content) return;

        try {
            setStatus("Skapar...");
            await createPost({ title, content });
            titleInput.value = "";
            contentInput.value = "";
            await loadAndRenderPosts();
        } catch (err) {
            console.error(err);
            addLocalPost({ title, content });
            titleInput.value = "";
            contentInput.value = "";
            setStatus("API: Offline. Sparade inlagget lokalt.");
            await loadAndRenderPosts();
        }
    });
}

// Initialisera IntersectionObserver for lazy loading
function initPaginationObserver() {
    const trigger = document.querySelector("#load-trigger");
    if (!trigger) return;

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMorePosts();
        }
    });

    observer.observe(trigger);
}

// Initialisering
loadAndRenderPosts();
initPaginationObserver();

// Registrera Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registrerad"))
        .catch((err) => console.error("SW error:", err));
}