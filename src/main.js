import "./styles/main.css";
import { getPosts, createPost, deletePost } from "./api/postsApi.js";
import { createComment } from "./api/commentsApi.js";
import { setStatus } from "./ui/renderStatus.js";
import { renderPosts } from "./ui/renderPosts.js";


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


postsContainer.addEventListener("submit", async (e) => {
  const commentForm = e.target.closest(".comment-form");
  if (!commentForm) return;

  e.preventDefault();

  const postId = commentForm.dataset.postId;
  const author = commentForm.querySelector('[name="author"]').value.trim();
  const text = commentForm.querySelector('[name="text"]').value.trim();
  if (!text) return;

  try {
    setStatus("Adding comment...");
    await createComment({
      postId,
      author,
      text,
      createdAt: new Date().toISOString(),
    });
    commentForm.reset();
    await loadAndRenderPosts();
    setStatus("Comment added.");
  } catch (err) {
    console.error("Error adding comment:", err);
    setStatus("Could not add comment.");
  }
});


loadAndRenderPosts();

