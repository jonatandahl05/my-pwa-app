import "./styles/main.css";

import { getPosts, createPost, deletePost } from "./api/postsApi.js";
import { setStatus } from "./ui/renderStatus.js";
import { appendPosts } from "./ui/renderPosts.js";

// DOM-element
const postsContainer = document.querySelector("#posts");
const form = document.querySelector("#create-form");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");

// ===== Image upload (responsive variants) =====
const heroInput = document.getElementById("heroImage");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const variantsBox = document.getElementById("variants");
const variantsList = document.getElementById("variantsList");
const pictureSnippet = document.getElementById("pictureSnippet");

// Keep latest generated <picture> HTML so we can save it with the post.
let latestPictureHTML = "";

// You can tweak these widths (must be <= original width).
const TARGET_WIDTHS = [320, 640, 960, 1280];

const isAdminView = Boolean(form);

// Pagination-variabler
let allPosts = [];
let page = 0;
const PAGE_SIZE = 5;
let allPostsLoaded = false;

// Loading state
let isLoading = false;
let errorMessage = "";
// When editor selects an image, generate responsive variants + <picture> snippet.
if (heroInput) {
  heroInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview original
    const originalUrl = URL.createObjectURL(file);
    if (previewImg) previewImg.src = originalUrl;
    if (imagePreview) imagePreview.hidden = false;

    latestPictureHTML = "";
    if (variantsList) variantsList.innerHTML = "";
    if (variantsBox) variantsBox.hidden = false;

    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch (err) {
      console.error(err);
      setStatus("Kunde inte läsa bilden.");
      return;
    }

    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    const webpSources = [];
    const jpgSources = [];

    for (const w of TARGET_WIDTHS) {
      if (w > bitmap.width) continue;

      const v = await generateVariant(bitmap, w);

      // Build srcset entries (currently blob URLs for demo)
      if (v.webpUrl) webpSources.push(`${v.webpUrl} ${w}w`);
      jpgSources.push(`${v.jpgUrl} ${w}w`);

      // UI list item
      if (variantsList) {
        const li = document.createElement("li");
        const webpKb = v.webpBlob ? (v.webpBlob.size / 1024).toFixed(0) : "-";
        const jpgKb = (v.jpgBlob.size / 1024).toFixed(0);
        li.innerHTML = `<strong>${w}px</strong> — webp: ${webpKb} KB, jpg: ${jpgKb} KB`;

        // Optional: let editor download the generated variants
        addDownloadLink(li, "Download WebP", v.webpBlob, `${baseName}-${w}w.webp`);
        addDownloadLink(li, "Download JPG", v.jpgBlob, `${baseName}-${w}w.jpg`);

        variantsList.appendChild(li);
      }
    }

    // Build and show snippet
    const fallbackSrc = jpgSources.length ? jpgSources[0].split(" ")[0] : originalUrl;
    latestPictureHTML = buildPictureHTML({
      webpSources,
      jpgSources,
      fallbackSrc,
    });

    if (pictureSnippet) pictureSnippet.value = latestPictureHTML;

    // EASIEST FLOW: auto-insert snippet into content (top), only once.
    if (contentInput && latestPictureHTML && !contentInput.value.includes("<picture>")) {
      contentInput.value = `${latestPictureHTML}\n\n${contentInput.value}`;
      saveDraft();
    }

    setStatus("Bildvarianter genererade ✅");
  });
}

async function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Kunde inte skapa blob"));
      resolve(blob);
    }, type, quality);
  });
}

async function generateVariant(bitmap, targetWidth) {
  const scale = targetWidth / bitmap.width;
  const targetHeight = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  // WebP first (best), JPEG fallback
  let webpBlob;
  try {
    webpBlob = await canvasToBlob(canvas, "image/webp", 0.82);
  } catch {
    webpBlob = null;
  }
  const jpgBlob = await canvasToBlob(canvas, "image/jpeg", 0.85);

  const webpUrl = webpBlob ? URL.createObjectURL(webpBlob) : "";
  const jpgUrl = URL.createObjectURL(jpgBlob);

  return { webpBlob, jpgBlob, webpUrl, jpgUrl, w: targetWidth, h: targetHeight };
}

function buildPictureHTML({ webpSources, jpgSources, fallbackSrc }) {
  // Adjust sizes for your layout.
  const sizes = "(max-width: 768px) 100vw, 800px";

  const webpSrcset = webpSources.length ? webpSources.join(", ") : "";
  const jpgSrcset = jpgSources.length ? jpgSources.join(", ") : "";

  return `<picture>\n` +
    (webpSrcset
      ? `  <source type=\"image/webp\" srcset=\"${webpSrcset}\" sizes=\"${sizes}\">\n`
      : "") +
    `  <img\n` +
    `    src=\"${fallbackSrc}\"\n` +
    (jpgSrcset ? `    srcset=\"${jpgSrcset}\"\n` : "") +
    `    sizes=\"${sizes}\"\n` +
    `    alt=\"\"\n` +
    `    loading=\"lazy\"\n` +
    `    decoding=\"async\"\n` +
    `  >\n` +
    `</picture>`;
}

function addDownloadLink(li, label, blob, filename) {
  if (!blob) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.textContent = label;
  a.style.marginLeft = ".5rem";
  li.appendChild(a);
}

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
    const title = titleInput?.value?.trim();
    let content = contentInput?.value ?? "";

    // If we have generated a picture snippet, ensure it's included.
    if (latestPictureHTML && !content.includes("<picture>")) {
      content = `${latestPictureHTML}\n\n${content}`;
    }

    content = content.trim();
    if (!title || !content) return;

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
      // reset image UI
      latestPictureHTML = "";
      if (heroInput) heroInput.value = "";
      if (pictureSnippet) pictureSnippet.value = "";
      if (variantsList) variantsList.innerHTML = "";
      if (variantsBox) variantsBox.hidden = true;
      if (imagePreview) imagePreview.hidden = true;

      clearDraft();

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

// Hantera formularet
if (form) {
    // Ladda ev. utkast nar du oppnar admin
    loadDraft();

    // Autospara utkast medan du skriver
    titleInput?.addEventListener("input", saveDraft);
    contentInput?.addEventListener("input", saveDraft);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = titleInput?.value?.trim();
        const content = contentInput?.value?.trim();
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