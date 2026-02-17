// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest"

// Mocka window innan API-filen importeras
global.window = {
    location: {
        hostname: "localhost"
    }
}

// Mocka apiFetch
vi.mock("../utils/apiFetch.js", () => ({
    apiFetch: vi.fn()
}))

import { apiFetch } from "../utils/apiFetch.js"
import { getPosts, createPost, deletePost } from "../api/postsApi.js"

beforeEach(() => {
    vi.clearAllMocks()
})

describe("postsApi – API mock tests", () => {

    it("getPosts() ska anropa rätt URL", async () => {
        apiFetch.mockResolvedValue([{ id: 1, title: "Mock post" }])

        const posts = await getPosts()

        expect(apiFetch).toHaveBeenCalledWith(
            "http://localhost:3000/posts"
        )
        expect(posts.length).toBe(1)
    })

    it("createPost() ska skicka POST med rätt data", async () => {
        const mockData = { title: "Ny titel", content: "Text" }

        apiFetch.mockResolvedValue({ id: 1, ...mockData })

        const result = await createPost(mockData)

        expect(apiFetch).toHaveBeenCalledWith(
            "http://localhost:3000/posts",
            expect.objectContaining({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mockData)
            })
        )

        expect(result.title).toBe("Ny titel")
    })

    it("deletePost() ska anropa rätt URL med DELETE", async () => {
        apiFetch.mockResolvedValue({ success: true })

        const result = await deletePost(5)

        expect(apiFetch).toHaveBeenCalledWith(
            "http://localhost:3000/posts/5",
            expect.objectContaining({
                method: "DELETE"
            })
        )

        expect(result.success).toBe(true)
    })

    it("ska hantera apiFetch-fel korrekt", async () => {
        apiFetch.mockRejectedValue(new Error("Network error"))

        await expect(getPosts()).rejects.toThrow("Network error")
    })

})
