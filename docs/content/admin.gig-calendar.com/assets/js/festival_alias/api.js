const API_BASE = '/api/v1';
export async function fetchFestivalAliases() {
    const response = await fetch(`${API_BASE}/festival_aliases`);
    if (!response.ok) {
        throw new Error(`Failed to fetch festival aliases: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}
export async function fetchFestivals() {
    const response = await fetch(`${API_BASE}/festivals`);
    if (!response.ok) {
        throw new Error(`Failed to fetch festivals: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}
export async function fetchPromoters() {
    const response = await fetch(`${API_BASE}/promoters`);
    if (!response.ok) {
        throw new Error(`Failed to fetch promoters: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}
export async function createFestivalAlias(payload) {
    const response = await fetch(`${API_BASE}/festival_aliases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create festival alias: ${response.statusText}`);
    }
    return response.json();
}
export async function updateFestivalAlias(id, payload) {
    const response = await fetch(`${API_BASE}/festival_aliases/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update festival alias: ${response.statusText}`);
    }
    return response.json();
}
export async function deleteFestivalAlias(id) {
    const response = await fetch(`${API_BASE}/festival_aliases/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete festival alias: ${response.statusText}`);
    }
}
