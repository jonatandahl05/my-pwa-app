import "./styles/main.css";

import { getPosts, createPost, deletePost } from "./api/postsApi.js";
import { setStatus } from "./ui/renderStatus.js";
import { renderPosts } from "./ui/renderPosts.js";

// Admin.html använder samma container-id som index
const postsContainer = document.querySelector("#posts");

// Admin-form (finns bara på admin.html)
const form = document.querySelector("#create-form");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");

const isAdminView = Boolean(form);

// ===== localStorage draft (admin) =====
const DRAFT_KEY = "adminDraft";

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

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

async function loadAndRenderPosts() {
  if (!postsContainer) return;

  setStatus("Laddar inlägg...");

  try {
    const posts = await getPosts();

   
    renderPosts(postsContainer, posts, isAdminView ? handleDeletePost : undefined);

    setStatus(`Hittade ${posts.length} inlägg.`);
  } catch (err) {
    console.error("Error loading posts:", err);
    setStatus("Kunde inte ladda inlägg, API: Offline.");
    postsContainer.innerHTML = "<p>Kunde inte ladda inlägg.</p>";
  }
}

async function handleDeletePost(id) {
  setStatus("Tar bort inlägg...");
  try {
    await deletePost(id);
    setStatus("Inlägg borttaget.");
    await loadAndRenderPosts();
  } catch (err) {
    console.error("Error deleting post:", err);
    setStatus("Kunde inte ta bort inlägg.");
  }
}


if (form) {
  // ladda ev. draft när du öppnar admin
  loadDraft();

  // autospara draft medan du skriver
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
      setStatus("Publicerat ✅");
    } catch (err) {
      console.error(err);
      setStatus("Fel vid POST ❌");
    }
  });
}

// init
loadAndRenderPosts();