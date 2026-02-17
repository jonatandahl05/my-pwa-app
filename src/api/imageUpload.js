import { CLOUDINARY_CONFIG, buildCloudinaryPictureHTML } from "../config/cloudinary.js";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
    || window.location.hostname.includes('github.io');

export async function uploadImage(file) {
    if (USE_MOCK) {
        console.warn("Read-only läge: bilduppladdning simulerad");
        return {
            publicId: "mock/demo-image",
            url: "https://placehold.co/800x600?text=Mock+Image",
            width: 800,
            height: 600,
        };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

    const response = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cloudinary error:", errorData);
        throw new Error("Bilduppladdning misslyckades");
    }

    const data = await response.json();

    return {
        publicId: data.public_id,
        url: data.secure_url,
        width: data.width,
        height: data.height,
    };
}

export async function uploadAndGetPictureHTML(file) {
    const result = await uploadImage(file);
    return buildCloudinaryPictureHTML(result.publicId);
}