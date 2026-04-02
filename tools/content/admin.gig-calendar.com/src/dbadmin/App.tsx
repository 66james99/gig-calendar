import React from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { api } from './api';
import { TableName, ScanResult } from './types';
import { DataTable } from './DataTable';
import { PreviewScan } from './PreviewScan';


// These are the names of the REST endpoints rather than the tables - the endpoints are plural while the underlying table names are singluar
const TABLES: TableName[] = [
    'image_locations', 'venues', 'venue_aliases', 'promoters', 'promoter_aliases', 
    'performers', 'performer_aliases', 'festivals', 'festival_aliases', 'event_types',
    'stage_roles'
];

export const App = () => {
    const [activeTable, setActiveTable] = React.useState<TableName>(TABLES[0]);
    const [debugMode, setDebugMode] = React.useState(false);
    const [preview, setPreview] = React.useState<{ id: number; data: ScanResult } | null>(null);
    const [isScanning, setIsScanning] = React.useState(false);
    const [prefillName, setPrefillName] = React.useState<string | null>(null);

    const handleTableChange = (name: TableName) => {
        setActiveTable(name);
        setPreview(null);
        setPrefillName(null);
    };

    const handleNavigate = (tableName: TableName, name: string) => {
        setActiveTable(tableName);
        setPreview(null);
        setPrefillName(name);
    };

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['tableData', activeTable],
        queryFn: () => api.fetchTableData(activeTable),
    });

    // Fetch all tables to serve as lookup data for foreign keys
    const lookupQueries = useQueries({
        queries: TABLES.map(table => ({
            queryKey: ['tableData', table],
            queryFn: () => api.fetchTableData(table),
        })),
    });

    // Memoize the registry and convert arrays to Maps for O(1) lookups
    const lookupRegistry = React.useMemo(() => {
        return TABLES.reduce((acc, table, index) => {
            const data = lookupQueries[index].data || [];
            // Create a Map keyed by ID for instant access
            acc[table] = new Map(data.map((item: any) => [item.id ?? item.ID, item]));
            return acc;
        }, {} as Record<TableName, Map<number | string, any>>);
    }, [lookupQueries]);

    return (
        <div className="admin-app">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>Gig Calendar Admin</h1>
                <div className="selector-container" style={{ display: 'flex', alignItems: 'center' }}>
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
                            <input 
                                type="checkbox" 
                                checked={debugMode} 
                                onChange={e => { setDebugMode(e.target.checked); setPreview(null); setIsScanning(false); }} 
                            />
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
                        key={activeTable}
                        data={data} 
                        tableName={activeTable} 
                        onRefresh={refetch} 
                        debugMode={debugMode}
                        onPreview={(id, data) => setPreview({ id, data })}
                        onScanStateChange={setIsScanning}
                        prefillName={prefillName}
                        lookupRegistry={lookupRegistry}
                    />
                )}
                
                {isScanning && (
                    <div className="preview-section">
                        <h2>Please Wait...</h2>
                    </div>
                )}

                {!isScanning && preview && activeTable === 'image_locations' && (
                    <div className="preview-section">
                        <h2>Preview Scan for ID: {preview.id}</h2>
                        <PreviewScan result={preview.data} isDebug={debugMode} onNavigate={handleNavigate} />
                    </div>
                )}
            </main>
        </div>
    );
};