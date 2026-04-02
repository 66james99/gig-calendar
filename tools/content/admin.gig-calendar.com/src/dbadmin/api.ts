import { TableName } from './types';

const BASE_URL = '/api/v1'; // Adjusted based on internal/apiHandler structure

export const api = {
    fetchTableData: async (tableName: TableName) => {
        const response = await fetch(`${BASE_URL}/${tableName}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    },
    
    deleteRow: async (tableName: TableName, id: string | number) => {
        const response = await fetch(`${BASE_URL}/${tableName}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Delete failed');
        return true;
    },

    // Placeholder for other CRUD actions (Create, Update, Duplicate)
    saveRow: async (tableName: TableName, data: any) => {
        // Support both lowercase 'id' and uppercase 'ID' from backend schema
        const rowId = data.id ?? data.ID;
        const method = rowId ? 'PUT' : 'POST';
        const url = rowId ? `${BASE_URL}/${tableName}/${rowId}` : `${BASE_URL}/${tableName}`;

        // Strip ID from the body as it's provided in the URL for PUT, and not needed for POST
        const { id, ID, ...bodyData } = data;

        const response = await fetch(url, { 
            method, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData) 
        });
        return response.json();
    },

    previewScan: async (id: number, debug: boolean) => {
        const response = await fetch(`${BASE_URL}/image_locations/${id}/preview_scan?debug=${debug}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to run preview scan');
        }
        return response.json();
    },
};