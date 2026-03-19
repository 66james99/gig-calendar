import type { EventType } from './types.js';

const API_BASE = '/api/v1';

export async function fetchEventTypes(): Promise<EventType[]> {
    const response = await fetch(`${API_BASE}/event_types`);
    if (!response.ok) {
        throw new Error(`Failed to fetch event types: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}

export async function createEventType(payload: { name: string }): Promise<EventType> {
    const response = await fetch(`${API_BASE}/event_types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create event type: ${response.statusText}`);
    }
    return response.json();
}

export async function updateEventType(id: number, payload: { name: string }): Promise<EventType> {
    const response = await fetch(`${API_BASE}/event_types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update event type: ${response.statusText}`);
    }
    return response.json();
}

export async function deleteEventType(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/event_types/${id}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete event type: ${response.statusText}`);
    }
}