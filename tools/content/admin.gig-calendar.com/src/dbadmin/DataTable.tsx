import React from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    getSortedRowModel,
    SortingState,
    ColumnFiltersState,
    getFilteredRowModel,
} from '@tanstack/react-table';
import { TableName, ScanResult } from './types';
import { api } from './api';

interface DataTableProps {
    data: any[];
    tableName: TableName;
    onRefresh: () => void;
    onPreview?: (id: number, data: ScanResult) => void;
    debugMode?: boolean;
    onScanStateChange?: (scanning: boolean) => void;
    prefillName?: string | null;
    lookupRegistry?: Record<TableName, Map<number | string, any>>;
}
// These are the names of the REST endpoints rather than the tables - the endpoints are plural while the underlying table names are singluar
const TABLES_LIST: TableName[] = [
    'image_locations', 'venues', 'venue_aliases', 'promoters', 'promoter_aliases', 
    'performers', 'performer_aliases', 'festivals', 'festival_aliases', 'event_types',
    'stage_roles'
];

const getRowName = (row: any, includeId = false): string => {
    if (!row) return '';
    const name = String(
        row.name || row.Name || row.alias || row.Alias || 
        (row.root ? `${row.root}${row.pattern || ''}` : '') || 
        row.id || row.ID || ''
    );
    return includeId ? `${name} [ID: ${row.id ?? row.ID}]` : name;
};

export const DataTable: React.FC<DataTableProps> = ({ 
    data, 
    tableName, 
    onRefresh, 
    onPreview, 
    debugMode, 
    onScanStateChange, 
    prefillName,
    lookupRegistry 
}) => {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [scanningId, setScanningId] = React.useState<number | null>(null);
    const [isAdding, setIsAdding] = React.useState(false);
    const [newRowData, setNewRowData] = React.useState<any>({});
    const [editingId, setEditingId] = React.useState<number | string | null>(null);
    const [editRowData, setEditRowData] = React.useState<any>(null);

    const columnHelper = createColumnHelper<any>();

    const getFkTable = (columnId: string): TableName | null => {
        const lower = columnId.toLowerCase();
        
        // Explicit schema mappings for columns that don't match table names directly
        const schemaMap: Record<string, TableName> = {
            'location': 'image_locations',
            'source': 'image_locations',
            'event_type': 'event_types',
            'venue': 'venues',
            'promoter': 'promoters',
            'performer': 'performers',
            'festival': 'festivals'
        };

        if (schemaMap[lower]) return schemaMap[lower];

        let entityName = '';
        
        if (lower.endsWith('_id')) {
            entityName = lower.replace('_id', '');
        } else if (lower.endsWith('id') && lower !== 'id') {
            entityName = lower.replace('id', '');
        } else {
            entityName = lower;
        }

        if (entityName === 'id') return null;

        const plural = entityName.endsWith('s') ? entityName : entityName + 's';
        return TABLES_LIST.find(t => {
            const tLower = t.toLowerCase();
            return tLower === entityName || tLower === plural || tLower.replace('_', '') === entityName;
        }) || null;
    };

    const preparePayload = (rowData: any) => {
        const payload: any = {};
        Object.keys(rowData).forEach(key => {
            const lowerKey = key.toLowerCase();
            // Strip DB-managed fields
            if (['id', 'uuid', 'created', 'updated'].includes(lowerKey)) return;

            const fkTable = getFkTable(key);
            // Convert key to snake_case for the Go API
            let apiKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
            
            // Ensure foreign keys have the _id suffix expected by the API payloads
            if (fkTable && !apiKey.endsWith('_id')) {
                apiKey = `${apiKey}_id`;
            }

            payload[apiKey] = rowData[key];
        });
        return payload;
    };

    // Dynamic columns based on the first data object
    const columns = React.useMemo(() => {
        if (!data || data.length === 0) return [];

        const keys = Object.keys(data[0]);
        const nameKeyIndex = keys.findIndex(k => k.toLowerCase() === 'name');
        if (nameKeyIndex > -1) {
            keys.unshift(keys.splice(nameKeyIndex, 1)[0]);
        }

        const baseCols = keys.map(key => 
            columnHelper.accessor(key, {
                header: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
                cell: info => {
                    const val = info.getValue();
                    if (val === null || val === undefined) return '';
                    const fkTable = getFkTable(key);
                    if (fkTable && lookupRegistry?.[fkTable]) {
                        const relatedRow = lookupRegistry[fkTable].get(val);
                        return relatedRow ? getRowName(relatedRow) : val;
                    }
                    return val;
                },
                filterFn: typeof data[0][key] === 'boolean' ? 'equals' : 'auto',
            })
        );

        const handleEdit = (rowId: string, rowData: any) => {
            setEditingId(rowId);
            setEditRowData({ ...rowData });
        };

        const handleSaveEdit = async () => {
            try {
                const payload = preparePayload(editRowData);
                await api.saveRow(tableName, { ...payload, id: editingId });
                setEditingId(null);
                setEditRowData(null);
                onRefresh();
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Update failed');
            }
        };

        const handleDelete = async (row: any) => {
            const id = row.id ?? row.ID;
            if (window.confirm('Do you really want to delete this row?')) {
                try {
                    await api.deleteRow(tableName, id);
                    onRefresh();
                } catch (err) {
                    alert(err instanceof Error ? err.message : 'Delete failed');
                }
            }
        };

        const handlePreview = async (id: number) => {
            if (!onPreview) return;
            setScanningId(id);
            onScanStateChange?.(true);
            try {
                const result = await api.previewScan(id, !!debugMode);
                onPreview(id, result);
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Scan failed');
            } finally {
                setScanningId(null);
                onScanStateChange?.(false);
            }
        };

        // Add the required Action buttons as per README
        return [
            ...baseCols,
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: props => (
                    <div className="action-buttons">
                        {editingId === props.row.id ? (
                            <>
                                <button title="Save" onClick={handleSaveEdit}>💾</button>
                                <button title="Cancel" onClick={() => {
                                    setEditingId(null);
                                    setEditRowData(null);
                                }}>❌</button>
                            </>
                        ) : (
                            <>
                                <button title="Edit" onClick={() => handleEdit(props.row.id, props.row.original)}>✏️</button>
                                <button title="Duplicate" onClick={() => {
                                    const { id, ID, uuid, Uuid, created, Created, updated, Updated, ...dup } = props.row.original;
                                    setIsAdding(true);
                                    setNewRowData(dup);
                                }}>📋</button>
                            </>
                        )}
                        <button title="Delete" onClick={() => handleDelete(props.row.original)}>🗑️</button>
                        {tableName === 'image_locations' && (
                            <button 
                                title="Preview Scan" 
                                onClick={() => handlePreview(props.row.original.ID)}
                                disabled={scanningId === props.row.original.ID}
                            >
                                {scanningId === props.row.original.ID ? '⌛' : '🔬'}
                            </button>
                        )}
                    </div>
                )
            })
        ];
    }, [data, tableName, debugMode, onPreview, onScanStateChange, scanningId, lookupRegistry, editingId, editRowData, preparePayload]);

    const handleNewRow = (prefill?: string) => {
        setIsAdding(true);
        const initialData: any = {};
        if (prefill && data.length > 0) {
            // Check for 'name' or 'alias' columns to support both primary and alias tables
            const nameKey = Object.keys(data[0]).find(k => 
                ['name', 'alias'].includes(k.toLowerCase())
            ) || 'name';
            initialData[nameKey] = prefill;
        }
        setNewRowData(initialData);
    };

    React.useEffect(() => {
        if (prefillName) {
            handleNewRow(prefillName);
        }
    }, [prefillName]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const handleSaveNew = async () => {
        try {
            const payload = preparePayload(newRowData);
            await api.saveRow(tableName, payload);
            setIsAdding(false);
            onRefresh();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Save failed');
        }
    };

    const renderCellInput = (columnId: string, rowData: any, setRowData: (d: any) => void, isNew: boolean) => {
        const lowerId = columnId.toLowerCase();
        const value = rowData[columnId];

        if (lowerId === 'id') {
            return isNew ? 'New' : value;
        }

        if (['uuid', 'created'].includes(lowerId)) {
            return isNew ? 'N/A' : value;
        }

        if (lowerId === 'updated') {
            return 'N/A';
        }

        const fkTable = getFkTable(columnId);
        const isBool = typeof data[0]?.[columnId] === 'boolean';

        if (isBool) {
            return (
                <input 
                    type="checkbox" 
                    checked={!!value}
                    onChange={e => setRowData({ ...rowData, [columnId]: e.target.checked })}
                />
            );
        }

        if (fkTable && lookupRegistry?.[fkTable]) {
            return (
                <>
                    <input 
                        type="text" 
                        autoComplete="off"
                        list={`list-${columnId}-${isNew ? 'new' : 'edit'}`}
                        placeholder="Select or type..."
                        defaultValue={value ? getRowName(lookupRegistry[fkTable].get(value), true) : ''}
                        // The key must include the value to ensure the input remounts and populates 
                        // when duplicating a row or switching edit targets.
                        key={`${columnId}-${isNew ? 'new' : editingId}-${value || 'empty'}-${lookupRegistry[fkTable].size}`}
                        onFocus={e => {
                            // Clearing the value on focus bypasses browser datalist filtering, 
                            // ensuring the "full list" is shown immediately.
                            e.currentTarget.value = '';
                        }}
                        onBlur={e => {
                            // Restore the display name on blur if no selection was made
                            if (!e.currentTarget.value && value) {
                                e.currentTarget.value = getRowName(lookupRegistry[fkTable].get(value), true);
                            }
                        }}
                        onChange={e => {
                            const val = e.target.value;
                            // We still need to search the values of the Map for the string match
                            const list = Array.from(lookupRegistry?.[fkTable]?.values() || []);
                            const selected = list.find(r => getRowName(r, true) === val);
                            if (selected) {
                                setRowData({ ...rowData, [columnId]: selected.id ?? selected.ID });
                            } else if (!val) {
                                setRowData({ ...rowData, [columnId]: null });
                            }
                        }}
                        style={{ width: '100%' }}
                    />
                    <datalist id={`list-${columnId}-${isNew ? 'new' : 'edit'}`}>
                        {Array.from(lookupRegistry?.[fkTable]?.values() || []).map(r => (
                            <option key={r.id || r.ID} value={getRowName(r, true)} />
                        ))}
                    </datalist>
                </>
            );
        }

        return (
            <input 
                type="text" 
                value={value || ''} 
                onChange={e => setRowData({ ...rowData, [columnId]: e.target.value })} 
                style={{ width: '100%' }}
            />
        );
    };

    return (
        <div className="spa-container">
            <div className="table-controls">
                <button onClick={() => handleNewRow()}>New</button>
                <button onClick={onRefresh}>Refresh Table</button>
            </div>

            {data.length === 0 ? (
                <div className="empty-state">The {tableName} table is currently empty.</div>
            ) : (
                <table>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} style={{ 
                                        verticalAlign: 'top',
                                        width: header.id.toLowerCase() === 'id' ? '80px' : undefined
                                    }}>
                                        <div 
                                            onClick={header.column.getToggleSortingHandler()}
                                            style={{ cursor: 'pointer', marginBottom: '4px' }}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                                        </div>
                                        {header.column.getCanFilter() && (() => {
                                            const firstValue = data[0]?.[header.column.id];
                                            if (typeof firstValue === 'boolean') {
                                                return (
                                                    <select
                                                        value={String(header.column.getFilterValue() ?? '')}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            header.column.setFilterValue(val === '' ? undefined : val === 'true');
                                                        }}
                                                        style={{ width: '100%', fontSize: '0.8rem', padding: '2px' }}
                                                    >
                                                        <option value="">All</option>
                                                        <option value="true">True</option>
                                                        <option value="false">False</option>
                                                    </select>
                                                );
                                            }
                                            return (
                                                <input
                                                    type="text"
                                                    placeholder="Filter..."
                                                    value={(header.column.getFilterValue() ?? '') as string}
                                                    onChange={e => header.column.setFilterValue(e.target.value)}
                                                    style={{ width: '100%', fontSize: '0.8rem', padding: '2px' }}
                                                />
                                            );
                                        })()}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {isAdding && (
                            <tr className="adding-row" style={{ backgroundColor: '#fff9db' }}>
                                {table.getHeaderGroups()[0].headers.map(header => {
                                    const columnId = header.column.id;
                                    const lowerId = columnId.toLowerCase();
                                    if (columnId === 'actions') {
                                        return (
                                            <td key={columnId}>
                                                <button onClick={handleSaveNew}>💾</button>
                                                <button onClick={() => setIsAdding(false)}>❌</button>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={columnId} style={{ 
                                            padding: '6px',
                                            width: lowerId === 'id' ? '80px' : undefined
                                        }}>
                                            {renderCellInput(columnId, newRowData, setNewRowData, true)}
                                        </td>
                                    );
                                })}
                            </tr>
                        )}
                        {table.getRowModel().rows.map(row => {
                            const isEditing = editingId === row.id;
                            return (
                                <tr key={row.id} style={isEditing ? { backgroundColor: '#e7f5ff' } : {}}>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} style={{ 
                                            padding: '6px',
                                            width: cell.column.id.toLowerCase() === 'id' ? '80px' : undefined
                                        }}>
                                            {isEditing && cell.column.id !== 'actions' 
                                                ? renderCellInput(cell.column.id, editRowData, setEditRowData, false)
                                                : flexRender(cell.column.columnDef.cell, cell.getContext())
                                            }
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};