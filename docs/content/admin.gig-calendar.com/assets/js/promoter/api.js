const API_PREFIX = '/api/v1';
export async function fetchPromoters() {
    const response = await fetch(`${API_PREFIX}/promoters`);
    if (!response.ok) {
        throw new Error(`Failed to fetch promoters: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}
export async function createPromoter(payload) {
    const response = await fetch(`${API_PREFIX}/promoters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create promoter: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}
export async function getPromoter(id) {
    const response = await fetch(`${API_PREFIX}/promoters/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch promoter: ${response.statusText}`);
    }
    return await response.json();
}
export async function updatePromoter(id, payload) {
    const response = await fetch(`${API_PREFIX}/promoters/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update promoter: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}
export async function deletePromoter(id) {
    const response = await fetch(`${API_PREFIX}/promoters/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete promoter: ${errorData.error || response.statusText}`);
    }
}
