import { CLOUDINARY_CONFIG, buildCloudinaryPictureHTML } from "../config/cloudinary.js";

// Laddar upp bild till Cloudinary
export async function uploadImage(file) {
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

// Laddar upp och returnerar picture HTML
export async function uploadAndGetPictureHTML(file) {
    const result = await uploadImage(file);
    return buildCloudinaryPictureHTML(result.publicId);
}