import { apiFetch } from "../utils/apiFetch.js";
import { mockPosts } from "../mocks/mockPosts.js";

const API_HOST = window.location.hostname;
const BASE_URL = `http://${API_HOST}:3000`;

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
    || window.location.hostname.includes('github.io');

export function getPosts() {
    if (USE_MOCK) {
        return Promise.resolve([...mockPosts]);
    }
    return apiFetch(`${BASE_URL}/posts`);
}

export function createPost(data) {
    if (USE_MOCK) {
        console.warn("Read-only läge: kan inte skapa inlägg");
        return Promise.resolve({
            ...data,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            _mock: true
        });
    }
    return apiFetch(`${BASE_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export function deletePost(id) {
    if (USE_MOCK) {
        console.warn("Read-only läge: kan inte ta bort inlägg");
        return Promise.resolve({ _mock: true });
    }
    return apiFetch(`${BASE_URL}/posts/${id}`, {
        method: "DELETE",
    });
}