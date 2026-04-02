const BASE_URL = '/api/v1'; // Adjusted based on internal/apiHandler structure
export const api = {
    fetchTableData: async (tableName) => {
        const response = await fetch(`${BASE_URL}/${tableName}`);
        if (!response.ok)
            throw new Error('Network response was not ok');
        return response.json();
    },
    deleteRow: async (tableName, id) => {
        const response = await fetch(`${BASE_URL}/${tableName}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok)
            throw new Error('Delete failed');
        return true;
    },
    // Placeholder for other CRUD actions (Create, Update, Duplicate)
    saveRow: async (tableName, data) => {
        const method = data.id ? 'PUT' : 'POST';
        const url = data.id ? `${BASE_URL}/${tableName}/${data.id}` : `${BASE_URL}/${tableName}`;
        const response = await fetch(url, { method, body: JSON.stringify(data) });
        return response.json();
    }
};
