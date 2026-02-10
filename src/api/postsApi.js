//postsApi.js
import { apiFetch } from "../utils/apiFetch.js";

const BASE_URL = "http://localhost:3000";

export async function getPosts() {
    try {
        const posts = await apiFetch(`${BASE_URL}/posts`);
        localStorage.setItem("posts-cache", JSON.stringify(posts));
        return posts;
    } catch (err) {
        const cached = localStorage.getItem("posts-cache");
        if (cached) {
            return JSON.parse(cached);
        }
        throw err;
    }
}

export function createPost(data) {
    return apiFetch(`${BASE_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export function deletePost(id) {
    return apiFetch(`${BASE_URL}/posts/${id}`, {
        method: "DELETE",
    });
}