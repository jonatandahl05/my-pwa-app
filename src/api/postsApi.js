import { apiFetch } from "../utils/apiFetch.js";

console.log("🟢 postsApi-modulen laddades (lazy-loaded)");

const BASE_URL = "http://localhost:3000";

export function getPosts() {
  return apiFetch(`${BASE_URL}/posts`);
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