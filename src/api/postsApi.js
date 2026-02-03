import { apiFetch } from "../utils/apiFetch.js";

const BASE_URL = "http://localhost:3000";

export function getPosts() {
  return apiFetch(`${BASE_URL}/posts?_embed=comments`);
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
