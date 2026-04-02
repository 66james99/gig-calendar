import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { TableName } from './types';
import { DataTable } from './DataTable';

const TABLES: TableName[] = [
    'festivals', 'festival_promoters', 'festival_venues', 'stage_roles', 
    'promoters', 'venues', 'festival_aliases', 'performers', 'gigs', 
    'tickets', 'artists', 'image_locations', 'events'
];

export const App = () => {
    const [activeTable, setActiveTable] = React.useState<TableName>(TABLES[0]);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['tableData', activeTable],
        queryFn: () => api.fetchTableData(activeTable),
    });

    return (
        <div className="admin-app">
            <header>
                <h1>Gig Calendar Admin</h1>
                <div className="selector-container">
                    <label htmlFor="table-select">Select Table: </label>
                    <select 
                        id="table-select" 
                        value={activeTable} 
                        onChange={(e) => setActiveTable(e.target.value as TableName)}
                    >
                        {TABLES.map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
            </header>

            <main>
                {isLoading && <div>Loading data...</div>}
                {error && <div className="error">Error fetching data: {(error as Error).message}</div>}
                {data && (
                    <DataTable data={data} tableName={activeTable} onRefresh={refetch} />
                )}
            </main>
        </div>
    );
};