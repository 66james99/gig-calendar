import type { Venue, VenuePayload } from './types.js';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export async function fetchVenues(): Promise<Venue[]> {
    const response = await fetch(`${API_BASE_URL}/venues`);
    if (!response.ok) {
        throw new Error('Failed to fetch venues');
    }
    const data = await response.json();
    return data || [];
}

export async function createVenue(payload: VenuePayload): Promise<Venue> {
    const response = await fetch(`${API_BASE_URL}/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create venue');
    }
    return response.json();
}

export async function updateVenue(id: number, payload: VenuePayload): Promise<Venue> {
    const response = await fetch(`${API_BASE_URL}/venues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update venue');
    }
    return response.json();
}

export async function deleteVenue(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/venues/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        try {
            const err = await response.json();
            throw new Error(err.error || 'Failed to delete venue');
        } catch (e) {
             throw new Error('Failed to delete venue');
        }
    }
}