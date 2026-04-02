import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { TableName, ScanResult } from './types';
import { DataTable } from './DataTable';
import { PreviewScan } from './PreviewScan';

const TABLES: TableName[] = [
    'festivals', 'festival_promoters', 'festival_venues', 'stage_roles', 
    'promoters', 'venues', 'festival_aliases', 'performers', 'gigs', 
    'tickets', 'artists', 'image_locations', 'events'
];

export const App = () => {
    const [activeTable, setActiveTable] = React.useState<TableName>(TABLES[0]);
    const [debugMode, setDebugMode] = React.useState(false);
    const [preview, setPreview] = React.useState<{ id: number; data: ScanResult } | null>(null);

    const handleTableChange = (name: TableName) => {
        setActiveTable(name);
        setPreview(null);
    };

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
                        onChange={(e) => handleTableChange(e.target.value as TableName)}
                    >
                        {TABLES.map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                        ))}
                    </select>
                    {activeTable === 'image_locations' && (
                        <label style={{ marginLeft: '20px' }}>
                            <input type="checkbox" checked={debugMode} onChange={e => setDebugMode(e.target.checked)} />
                            Debug Mode
                        </label>
                    )}
                </div>
            </header>

            <main>
                {isLoading && <div>Loading data...</div>}
                {error && <div className="error">Error fetching data: {(error as Error).message}</div>}
                {data && (
                    <DataTable 
                        data={data} 
                        tableName={activeTable} 
                        onRefresh={refetch} 
                        debugMode={debugMode}
                        onPreview={(id, data) => setPreview({ id, data })}
                    />
                )}
                
                {preview && activeTable === 'image_locations' && (
                    <div className="preview-section">
                        <h2>Preview Scan for ID: {preview.id}</h2>
                        <PreviewScan result={preview.data} isDebug={debugMode} />
                    </div>
                )}
            </main>
        </div>
    );
};