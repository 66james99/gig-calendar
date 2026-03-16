const API_BASE_URL = 'http://localhost:8080/api/v1';
export async function fetchImageLocations() {
    const response = await fetch(`${API_BASE_URL}/image_locations`);
    if (!response.ok) {
        throw new Error('Failed to fetch image locations');
    }
    const data = await response.json();
    return data || [];
}
export async function createImageLocation(payload) {
    const response = await fetch(`${API_BASE_URL}/image_locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create image location');
    }
    return response.json();
}
export async function updateImageLocation(id, payload) {
    const response = await fetch(`${API_BASE_URL}/image_locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update image location');
    }
    return response.json();
}
export async function deleteImageLocation(id) {
    const response = await fetch(`${API_BASE_URL}/image_locations/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        try {
            const err = await response.json();
            throw new Error(err.error || 'Failed to delete image location');
        }
        catch (e) {
            throw new Error('Failed to delete image location');
        }
    }
}
export async function previewImageLocationScan(id) {
    // Add ?debug=true to get detailed parse errors
    const response = await fetch(`${API_BASE_URL}/image_locations/${id}/preview_scan?debug=true`);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to run preview scan');
    }
    return response.json();
}
