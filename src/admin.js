import "./styles/main.css";

import { getPosts, createPost, deletePost } from "./api/postsApi.js";
import { setStatus } from "./ui/renderStatus.js";
import { appendPosts } from "./ui/renderPosts.js";
import { uploadAndGetPictureHTML } from "./api/imageUpload.js";

// DOM-element
const postsContainer = document.querySelector("#posts");
const form = document.querySelector("#create-form");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");

// Image upload element
const heroInput = document.getElementById("heroImage");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const variantsBox = document.getElementById("variants");
const variantsList = document.getElementById("variantsList");
const pictureSnippet = document.getElementById("pictureSnippet");

// Image upload state
let latestPictureHTML = "";

const isAdminView = Boolean(form);

// Pagination-variabler
let allPosts = [];
let page = 0;
const PAGE_SIZE = 5;
let allPostsLoaded = false;

// Loading state
let isLoading = false;
let errorMessage = "";

// ===== localStorage draft (admin) =====
const DRAFT_KEY = "adminDraft";

// Laddar utkast fran localStorage
function loadDraft() {
    if (!titleInput || !contentInput) return;
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (draft?.title && !titleInput.value) titleInput.value = draft.title;
        if (draft?.content && !contentInput.value) contentInput.value = draft.content;
    } catch {
        // ignore
    }
}

// Sparar utkast till localStorage
function saveDraft() {
    if (!titleInput || !contentInput) return;
    try {
        localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
                title: titleInput.value,
                content: contentInput.value,
                updatedAt: new Date().toISOString(),
            })
        );
    } catch {
        // ignore
    }
}

// Rensar utkast fran localStorage
function clearDraft() {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        // ignore
    }
}

// Aterstaller bild-UI
function resetImageUI() {
    latestPictureHTML = "";
    if (heroInput) heroInput.value = "";
    if (pictureSnippet) pictureSnippet.value = "";
    if (variantsList) variantsList.innerHTML = "";
    if (variantsBox) variantsBox.hidden = true;
    if (imagePreview) imagePreview.hidden = true;
}

// ===== Pagination functions =====

// Laddar nasta sida av posts fran allPosts-arrayen
function loadMorePosts() {
    if (allPostsLoaded) return;
    if (!postsContainer) return;

    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = allPosts.slice(start, end);

    if (slice.length === 0) {
        allPostsLoaded = true;
        return;
    }

    appendPosts(postsContainer, slice, isAdminView ? handleDeletePost : undefined);
    page++;
}

// Renderar baserat pa loading state
function render() {
    if (!postsContainer) return;

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

// Laddar posts fran API
async function loadPosts() {
    try {
        const posts = await fetchPosts();
        allPosts = posts;
        errorMessage = "";
        setStatus(`Hittade ${posts.length} inlagg.`);
    } catch (err) {
        console.error("Error loading posts:", err);
        allPosts = [];
        errorMessage = "Kunde inte ladda inlagg, API: Offline.";
        setStatus("Kunde inte ladda inlagg, API: Offline.");
    }
}

// Huvudfunktion for att ladda och rendera posts
async function loadAndRenderPosts() {
    if (!postsContainer) return;

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

// Tar bort en post via API
async function handleDeletePost(id) {
    setStatus("Tar bort inlagg...");
    try {
        await deletePost(id);
        setStatus("Inlagg borttaget.");
        await loadAndRenderPosts();
    } catch (err) {
        console.error("Error deleting post:", err);
        setStatus("Kunde inte ta bort inlagg.");
    }
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

// ===== Event listeners =====

// Bilduppladdning till Cloudinary
if (heroInput) {
    heroInput.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Visa lokal forhandsvisning
        const originalUrl = URL.createObjectURL(file);
        if (previewImg) previewImg.src = originalUrl;
        if (imagePreview) imagePreview.hidden = false;

        // Visa laddnings-status
        setStatus("Laddar upp bild till Cloudinary...");
        if (variantsBox) variantsBox.hidden = false;
        if (variantsList) {
            variantsList.innerHTML = "<li>Laddar upp...</li>";
        }

        try {
            // Ladda upp till Cloudinary och fa picture HTML
            latestPictureHTML = await uploadAndGetPictureHTML(file);

            // Visa resultat
            if (pictureSnippet) pictureSnippet.value = latestPictureHTML;
            if (variantsList) {
                variantsList.innerHTML = `
          <li>Uppladdning klar</li>
          <li>Responsiva varianter genereras automatiskt av Cloudinary</li>
          <li>Storlekar: 320px, 640px, 960px, 1280px</li>
          <li>Format: WebP + JPG fallback</li>
        `;
            }

            // Auto-insert i content
            if (contentInput && latestPictureHTML && !contentInput.value.includes("<picture>")) {
                contentInput.value = `${latestPictureHTML}\n\n${contentInput.value}`;
                saveDraft();
            }

            setStatus("Bild uppladdad till Cloudinary");
        } catch (err) {
            console.error("Upload error:", err);
            setStatus("Bilduppladdning misslyckades");
            if (variantsList) {
                variantsList.innerHTML = "<li>Fel vid uppladdning - kontrollera Cloudinary-konfiguration</li>";
            }
        }
    });
}

// Formularet
if (form) {
    loadDraft();

    titleInput?.addEventListener("input", saveDraft);
    contentInput?.addEventListener("input", saveDraft);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = titleInput?.value?.trim();
        let content = contentInput?.value ?? "";

        // Om vi har genererat en picture snippet, se till att den ar inkluderad
        if (latestPictureHTML && !content.includes("<picture>")) {
            content = `${latestPictureHTML}\n\n${content}`;
        }

        content = content.trim();
        if (!title || !content) return;

        try {
            setStatus("Skapar...");

            await createPost({
                title,
                content,
                createdAt: new Date().toISOString(),
            });

            if (titleInput) titleInput.value = "";
            if (contentInput) contentInput.value = "";

            resetImageUI();
            clearDraft();

            await loadAndRenderPosts();
            setStatus("Publicerat");
        } catch (err) {
            console.error(err);
            setStatus("Fel vid POST");
        }
    });
}

// Initialisering
loadAndRenderPosts();
initPaginationObserver();