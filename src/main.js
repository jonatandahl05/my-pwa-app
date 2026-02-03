import "./styles/main.css";
import { getPosts, createPost, deletePost } from "./api/postsApi.js";
import { setStatus } from "./ui/renderStatus.js";
import { renderPosts } from "./ui/renderPosts.js";
import { initAuth } from "./utils/login.js";
import { isAdmin } from "./utils/login.js";
import {
  loadLocalPosts,
  addLocalPost,
  deleteLocalPost,
  saveLocalPosts,
} from "./storage/localPosts.js";

const form = document.querySelector("#create-form");
const postsContainer = document.querySelector("#posts");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");
const adminLink = document.getElementById("admin-link");

initAuth(form, () => {
    loadAndRenderPosts();
});

if (adminLink && !isAdmin()) {
  adminLink.style.display = "none";
}


async function loadAndRenderPosts() {
  setStatus("Laddar inlägg...");

  try {
    const posts = await getPosts();

    // Cachea online-data i localStorage som backup
    saveLocalPosts(posts);

    renderPosts(postsContainer, posts, handleDeletePost);
    setStatus(`Hittade ${posts.length} inlägg.`);
  } catch (err) {
    console.error("Error loading posts:", err);

    const localPosts = loadLocalPosts();
    renderPosts(postsContainer, localPosts, handleDeletePost);

    setStatus(
      localPosts.length
        ? `API: Offline. Visar ${localPosts.length} sparade inlägg (localStorage).`
        : "API: Offline. Inga lokala inlägg hittades."
    );
  }
}



async function handleDeletePost(id) {
  setStatus("Tar bort inlägg...");

  try {
    await deletePost(id);
    setStatus("Inlägg borttaget.");
    loadAndRenderPosts();
  } catch (err) {
    console.error("Error deleting post:", err);

    // Offline-delete
    deleteLocalPost(id);
    setStatus("API: Offline. Tog bort inlägg lokalt (localStorage).");
    loadAndRenderPosts();
  }
}



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

    // Offline-create
    addLocalPost({ title, content });
    titleInput.value = "";
    contentInput.value = "";

    setStatus("API: Offline. Sparade inlägget lokalt (localStorage).");
    await loadAndRenderPosts();
  }
});



loadAndRenderPosts();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
        .then(() => console.log("Service Worker registrerad"))
        .catch(err => console.error("SW error:", err));
}
