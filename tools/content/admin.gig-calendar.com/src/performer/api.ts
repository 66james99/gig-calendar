import type { Performer, PerformerPayload } from './types.js';

const API_PREFIX = '/api/v1';

export async function fetchPerformers(): Promise<Performer[]> {
    const response = await fetch(`${API_PREFIX}/performers`);
    if (!response.ok) {
        throw new Error(`Failed to fetch performers: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}

export async function createPerformer(payload: PerformerPayload): Promise<Performer> {
    const response = await fetch(`${API_PREFIX}/performers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create performer: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}

export async function getPerformer(id: number): Promise<Performer> {
    const response = await fetch(`${API_PREFIX}/performers/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch performer: ${response.statusText}`);
    }
    return await response.json();
}

export async function updatePerformer(id: number, payload: PerformerPayload): Promise<Performer> {
    const response = await fetch(`${API_PREFIX}/performers/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update performer: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}

export async function deletePerformer(id: number): Promise<void> {
    const response = await fetch(`${API_PREFIX}/performers/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete performer: ${errorData.error || response.statusText}`);
    }
}