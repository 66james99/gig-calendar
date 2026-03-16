import type { VenueAlias, VenueAliasPayload, Venue } from './types.js';

const API_PREFIX = '/api/v1';

export async function fetchVenueAliases(): Promise<VenueAlias[]> {
    const response = await fetch(`${API_PREFIX}/venue_aliases`);
    if (!response.ok) {
        throw new Error(`Failed to fetch venue aliases: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}

export async function fetchVenues(): Promise<Venue[]> {
    const response = await fetch(`${API_PREFIX}/venues`);
    if (!response.ok) {
        throw new Error(`Failed to fetch venues: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}

export async function createVenueAlias(payload: VenueAliasPayload): Promise<VenueAlias> {
    const response = await fetch(`${API_PREFIX}/venue_aliases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create venue alias: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}

export async function updateVenueAlias(id: number, payload: VenueAliasPayload): Promise<VenueAlias> {
    const response = await fetch(`${API_PREFIX}/venue_aliases/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update venue alias: ${errorData.error || response.statusText}`);
    }
    return await response.json();
}

export async function deleteVenueAlias(id: number): Promise<void> {
    const response = await fetch(`${API_PREFIX}/venue_aliases/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete venue alias: ${errorData.error || response.statusText}`);
    }
}