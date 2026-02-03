import { apiFetch } from "../utils/apiFetch.js";

const BASE_URL = "http://localhost:3000";

export function createComment(data) {
  return apiFetch(`${BASE_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
