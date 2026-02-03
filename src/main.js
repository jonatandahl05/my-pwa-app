import "./styles/main.css";
import { getPosts, createPost, deletePost } from "./api/postsApi.js";
import { setStatus } from "./ui/renderStatus.js";
import { renderPosts } from "./ui/renderPosts.js";
import { initAuth } from "./utils/login.js";

const form = document.querySelector("#create-form");

initAuth(form, () => {
    loadAndRenderPosts();
});


const postsContainer = document.querySelector("#posts");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");

async function loadAndRenderPosts() {
    setStatus("Laddar inlägg...");
    try {
        const posts = await getPosts();
        renderPosts(postsContainer, posts, handleDeletePost);
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
        loadAndRenderPosts();
    } catch (err) {
        console.error("Error deleting post:", err);
        setStatus("Kunde inte ta bort inlägg.");
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
    setStatus("Fel vid POST ❌");
  }
});


loadAndRenderPosts();

