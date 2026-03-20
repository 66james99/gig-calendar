import { StageRole } from "./types.js";

const API_BASE = "/api/v1/stage_roles";

export async function fetchStageRoles(): Promise<StageRole[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
        throw new Error(`Failed to fetch stage roles: ${response.statusText}`);
    }
    const data = await response.json();
    return data || [];
}

export async function createStageRole(pattern: string): Promise<StageRole> {
    const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ pattern }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create stage role: ${response.statusText}`);
    }
    return await response.json();
}

export async function updateStageRole(id: number, pattern: string): Promise<StageRole> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ pattern }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update stage role: ${response.statusText}`);
    }
    return await response.json();
}

export async function deleteStageRole(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete stage role: ${response.statusText}`);
    }
}