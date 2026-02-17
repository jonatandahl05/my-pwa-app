import { apiFetch } from "../utils/apiFetch.js";

const API_HOST = window.location.hostname;
const BASE_URL = `http://${API_HOST}:3000`;


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