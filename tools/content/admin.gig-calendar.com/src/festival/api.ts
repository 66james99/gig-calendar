import type { Festival, FestivalPayload, Promoter } from './types.js';

const API_BASE = '/api/v1';

export async function fetchFestivals(): Promise<Festival[]> {
    const response = await fetch(`${API_BASE}/festivals`);
    if (!response.ok) {
        throw new Error(`Failed to fetch festivals: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}

export async function fetchPromoters(): Promise<Promoter[]> {
    const response = await fetch(`${API_BASE}/promoters`);
    if (!response.ok) {
        throw new Error(`Failed to fetch promoters: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}

export async function createFestival(payload: FestivalPayload): Promise<Festival> {
    const response = await fetch(`${API_BASE}/festivals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create festival: ${response.statusText}`);
    }
    return response.json();
}

export async function updateFestival(id: number, payload: FestivalPayload): Promise<Festival> {
    const response = await fetch(`${API_BASE}/festivals/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update festival: ${response.statusText}`);
    }
    return response.json();
}

export async function deleteFestival(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/festivals/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete festival: ${response.statusText}`);
    }
}