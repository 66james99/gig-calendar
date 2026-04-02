import React from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    getSortedRowModel,
    SortingState,
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
}

export const DataTable: React.FC<DataTableProps> = ({ data, tableName, onRefresh, onPreview, debugMode }) => {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [scanningId, setScanningId] = React.useState<number | null>(null);

    const columnHelper = createColumnHelper<any>();

    // Dynamic columns based on the first data object
    const columns = React.useMemo(() => {
        if (!data || data.length === 0) return [];
        const baseCols = Object.keys(data[0]).map(key => 
            columnHelper.accessor(key, {
                header: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
                cell: info => info.getValue(),
            })
        );

        const handlePreview = async (id: number) => {
            if (!onPreview) return;
            setScanningId(id);
            try {
                const result = await api.previewScan(id, !!debugMode);
                onPreview(id, result);
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Scan failed');
            } finally {
                setScanningId(null);
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
                        <button title="Edit" onClick={() => console.log('Edit', props.row.original)}>✏️</button>
                        <button title="Duplicate" onClick={() => console.log('Duplicate', props.row.original)}>📋</button>
                        <button title="Delete" onClick={() => {
                            if (window.confirm('Are you sure you want to delete this row?')) {
                                console.log('Delete', props.row.original);
                            }
                        }}>🗑️</button>
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
    }, [data]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="spa-container">
            <div className="table-controls">
                <input 
                    value={globalFilter ?? ''} 
                    onChange={e => setGlobalFilter(e.target.value)} 
                    placeholder="Filter table..." 
                />
                <button onClick={() => console.log('New row')}>New</button>
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
                                    <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.column.getIsSorted() === 'asc' ? ' 🔼' : header.column.getIsSorted() === 'desc' ? ' 🔽' : ''}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};