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
        const method = data.id ? 'PUT' : 'POST';
        const url = data.id ? `${BASE_URL}/${tableName}/${data.id}` : `${BASE_URL}/${tableName}`;
        const response = await fetch(url, { method, body: JSON.stringify(data) });
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