import type { PromoterAlias, PromoterAliasPayload, Promoter } from './types.js';

const API_PREFIX = '/api/v1';

export async function fetchPromoterAliases(): Promise<PromoterAlias[]> {
    const response = await fetch(`${API_PREFIX}/promoter_aliases`);
    if (!response.ok) {
        throw new Error(`Failed to fetch promoter aliases: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}

export async function fetchPromoters(): Promise<Promoter[]> {
    const response = await fetch(`${API_PREFIX}/promoters`);
    if (!response.ok) {
        throw new Error(`Failed to fetch promoters: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}

export async function createPromoterAlias(payload: PromoterAliasPayload): Promise<PromoterAlias> {
    const response = await fetch(`${API_PREFIX}/promoter_aliases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create promoter alias: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}

export async function updatePromoterAlias(id: number, payload: PromoterAliasPayload): Promise<PromoterAlias> {
    const response = await fetch(`${API_PREFIX}/promoter_aliases/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update promoter alias: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}

export async function deletePromoterAlias(id: number): Promise<void> {
    const response = await fetch(`${API_PREFIX}/promoter_aliases/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete promoter alias: ${errorData.error || response.statusText}`);
    }
}