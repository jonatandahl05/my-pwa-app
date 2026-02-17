import { describe, it, expect } from "vitest"
import {
    CLOUDINARY_CONFIG,
    getCloudinaryUrl,
    getResponsiveSrcset,
    buildCloudinaryPictureHTML
} from "../config/cloudinary.js"

describe("CLOUDINARY_CONFIG", () => {
    it("ska ha korrekt cloudName och uploadPreset", () => {
        expect(CLOUDINARY_CONFIG.cloudName).toBe("dxrbhsq0v")
        expect(CLOUDINARY_CONFIG.uploadPreset).toBe("blog_uploads")
    })
})

describe("getCloudinaryUrl()", () => {
    it("ska bygga korrekt URL med standardvärden", () => {
        const url = getCloudinaryUrl("test123")

        expect(url).toBe(
            "https://res.cloudinary.com/dxrbhsq0v/image/upload/f_auto,q_auto/test123"
        )
    })

    it("ska inkludera width om det anges", () => {
        const url = getCloudinaryUrl("test123", { width: 800 })

        expect(url).toBe(
            "https://res.cloudinary.com/dxrbhsq0v/image/upload/w_800,f_auto,q_auto/test123"
        )
    })

    it("ska använda angivet format och kvalitet", () => {
        const url = getCloudinaryUrl("test123", {
            width: 500,
            format: "webp",
            quality: "70"
        })

        expect(url).toBe(
            "https://res.cloudinary.com/dxrbhsq0v/image/upload/w_500,f_webp,q_70/test123"
        )
    })
})

describe("getResponsiveSrcset()", () => {
    it("ska generera korrekt srcset för standard-widths", () => {
        const srcset = getResponsiveSrcset("img123")

        const parts = srcset.split(", ")

        expect(parts.length).toBe(4)

        expect(parts[0]).toBe(
            "https://res.cloudinary.com/dxrbhsq0v/image/upload/w_320,f_auto,q_auto/img123 320w"
        )
        expect(parts[3]).toBe(
            "https://res.cloudinary.com/dxrbhsq0v/image/upload/w_1280,f_auto,q_auto/img123 1280w"
        )
    })

    it("ska fungera med egna widths", () => {
        const srcset = getResponsiveSrcset("img123", [100, 200])

        expect(srcset).toBe(
            "https://res.cloudinary.com/dxrbhsq0v/image/upload/w_100,f_auto,q_auto/img123 100w, " +
            "https://res.cloudinary.com/dxrbhsq0v/image/upload/w_200,f_auto,q_auto/img123 200w"
        )
    })
})

describe("buildCloudinaryPictureHTML()", () => {
    it("ska generera korrekt <picture>-HTML", () => {
        const html = buildCloudinaryPictureHTML("photo123")

        // Kontrollera att picture-taggen finns
        expect(html.startsWith("<picture>")).toBe(true)
        expect(html.endsWith("</picture>")).toBe(true)

        // Kontrollera att webp srcset finns
        expect(html).toContain("type=\"image/webp\"")
        expect(html).toContain("w_320,f_webp,q_auto/photo123 320w")

        // Kontrollera att jpg fallback finns
        expect(html).toContain("type=\"image/webp\"")
        expect(html).toContain("w_640,f_jpg,q_auto/photo123")

        // Kontrollera att <img> finns
        expect(html).toContain("<img")
        expect(html).toContain("loading=\"lazy\"")
        expect(html).toContain("decoding=\"async\"")
    })
})
