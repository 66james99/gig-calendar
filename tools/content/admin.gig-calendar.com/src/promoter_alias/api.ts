import type { PromoterAlias, Promoter, PromoterAliasPayload } from './types.js';

const API_BASE = '/api/v1';

export async function fetchPromoterAliases(): Promise<PromoterAlias[]> {
    const response = await fetch(`${API_BASE}/promoter_aliases`);
    if (!response.ok) {
        throw new Error(`Failed to fetch promoter aliases: ${response.statusText}`);
    }
    return response.json();
}

export async function fetchPromoters(): Promise<Promoter[]> {
    const response = await fetch(`${API_BASE}/promoters`);
    if (!response.ok) {
        throw new Error(`Failed to fetch promoters: ${response.statusText}`);
    }
    return response.json();
}

export async function createPromoterAlias(payload: PromoterAliasPayload): Promise<PromoterAlias> {
    const response = await fetch(`${API_BASE}/promoter_aliases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create promoter alias: ${response.statusText}`);
    }
    return response.json();
}

export async function updatePromoterAlias(id: number, payload: PromoterAliasPayload): Promise<PromoterAlias> {
    const response = await fetch(`${API_BASE}/promoter_aliases/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update promoter alias: ${response.statusText}`);
    }
    return response.json();
}

export async function deletePromoterAlias(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/promoter_aliases/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete promoter alias: ${response.statusText}`);
    }
}