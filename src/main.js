//main.js
import "./styles/main.css";
import { getPosts, createPost, deletePost } from "./api/postsApi.js";
import { setStatus } from "./ui/renderStatus.js";
import { renderPosts } from "./ui/renderPosts.js";
import { initAuth } from "./utils/login.js";
import {
    getCommentsByPost,
    createComment,
    deleteComment,
    flagComment
} from "./api/commentsApi.js";
import { getUser } from "./utils/login.js";

import { renderComments } from "./ui/renderComments.js";

import { initOnlineStatus } from "./utils/onlineStatus.js";

initOnlineStatus(setStatus);

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
    document.querySelectorAll(".comments").forEach((el) => {
        const postId = el.dataset.post;
        const list = el.querySelector(".comments-list");
        const form = el.querySelector(".comment-form");

        loadComments(postId, list);

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const data = new FormData(form);
            const user = getUser();

            await createComment({
                postId,
                author: user ? user.username : "Gäst",
                text: data.get("text"),
                flagged: false,
            });

            form.reset();
            await loadComments(postId, list);
        });
    });
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

async function loadComments(postId, container) {
    const comments = await getCommentsByPost(postId);
    renderComments(
        container,
        comments,
        async (id) => {
            await deleteComment(id);
            await loadComments(postId, container);
        },
        async (id, flagged) => {
            await flagComment(id, flagged);
            await loadComments(postId, container);
        }
    );
}

loadAndRenderPosts();

