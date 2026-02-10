//commentsApi.js
import { apiFetch } from "../utils/apiFetch.js";

const BASE_URL = "http://localhost:3000";

export async function getCommentsByPost(postId) {
    try {
        const comments = await apiFetch(`${BASE_URL}/comments?postId=${postId}`);
        localStorage.setItem(`comments-${postId}`, JSON.stringify(comments));
        return comments;
    } catch (err) {
        const cached = localStorage.getItem(`comments-${postId}`);
        if (cached) {
            return JSON.parse(cached);
        }
        throw err;
    }
}

export function createComment(data) {
    return apiFetch(`${BASE_URL}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export function deleteComment(id) {
    return apiFetch(`${BASE_URL}/comments/${id}`, {
        method: "DELETE",
    });
}

export function flagComment(id, flagged = true) {
    return apiFetch(`${BASE_URL}/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged }),
    });
}