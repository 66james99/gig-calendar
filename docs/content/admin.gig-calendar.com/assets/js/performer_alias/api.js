const API_PREFIX = '/api/v1';
export async function fetchPerformerAliases() {
    const response = await fetch(`${API_PREFIX}/performer_aliases`);
    if (!response.ok) {
        throw new Error(`Failed to fetch performer aliases: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}
export async function fetchPerformers() {
    const response = await fetch(`${API_PREFIX}/performers`);
    if (!response.ok) {
        throw new Error(`Failed to fetch performers: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}
export async function createPerformerAlias(payload) {
    const response = await fetch(`${API_PREFIX}/performer_aliases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create performer alias: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}
export async function updatePerformerAlias(id, payload) {
    const response = await fetch(`${API_PREFIX}/performer_aliases/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update performer alias: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}
export async function deletePerformerAlias(id) {
    const response = await fetch(`${API_PREFIX}/performer_aliases/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete performer alias: ${errorData.error || response.statusText}`);
    }
}
