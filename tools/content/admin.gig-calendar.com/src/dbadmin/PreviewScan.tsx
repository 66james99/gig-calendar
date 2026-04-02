import React from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    getSortedRowModel,
    SortingState,
    ColumnFiltersState,
    getFilteredRowModel,
    createColumnHelper,
} from '@tanstack/react-table';
import { TableName, ScanResult, MatchedResult } from './types';

const getConfidenceStyle = (conf: number) => {
    let color = 'red';
    if (conf === 100) color = 'green';
    else if (conf === 75) color = 'blue';
    else if (conf === 50) color = 'orange';
    else if (conf === 25) color = 'gray';
    return { color, fontWeight: conf > 0 ? 'bold' : 'normal' as any, cursor: 'pointer', textDecoration: 'underline dotted' };
};

export const PreviewScan: React.FC<{ 
    result: ScanResult; 
    isDebug: boolean;
    onNavigate: (tableName: TableName, name: string) => void;
}> = ({ result, isDebug, onNavigate }) => {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

    const columnHelper = createColumnHelper<MatchedResult>();

    const columns = React.useMemo(() => [
        columnHelper.accessor(row => `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`, {
            id: 'date',
            header: 'Date',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor(row => row.performers?.flat().map(p => p.match || p.name).join(' ') || '', {
            id: 'performers',
            header: 'Performers',
            cell: info => {
                const performers = info.row.original.performers;
                return performers?.map((group, gIdx) => (
                    <span key={gIdx}>
                        {group.map((p, pIdx) => {
                            const conf = p.confidence || 0;
                            const display = conf > 0 ? p.match : p.name;
                            return (
                                <span key={pIdx}>
                                    {p.pattern && <span> {p.pattern} </span>}
                                    <span 
                                        style={getConfidenceStyle(conf)} 
                                        title={conf !== 100 ? `Original: ${p.name}` : ''}
                                        onClick={() => onNavigate('performers', p.name)}
                                    >
                                        {display}
                                    </span>
                                </span>
                            );
                        })}
                        {gIdx < (performers?.length || 0) - 1 ? ', ' : ''}
                    </span>
                ));
            }
        }),
        columnHelper.accessor(row => row.venue ? (row.venue.match || row.venue.name) : '', {
            id: 'venue',
            header: 'Venue',
            cell: info => {
                const venue = info.row.original.venue;
                if (!venue) return null;
                return (
                    <span 
                        style={getConfidenceStyle(venue.confidence)}
                        title={venue.confidence !== 100 ? `Original: ${venue.name}` : ''}
                        onClick={() => onNavigate('venues', venue.name)}
                    >
                        {venue.confidence > 0 ? venue.match : venue.name}
                    </span>
                );
            }
        }),
        columnHelper.accessor(row => row.promoters?.map(p => p.match || p.name).join(' ') || '', {
            id: 'promoters',
            header: 'Promoters',
            cell: info => {
                const promoters = info.row.original.promoters;
                return promoters?.map((p, pIdx) => (
                    <span key={pIdx}>
                        <span 
                            style={{
                                ...getConfidenceStyle(p.confidence),
                                textDecoration: p.festival ? 'underline' : 'underline dotted'
                            }}
                            title={p.confidence !== 100 ? `Original: ${p.name}` : ''}
                            onClick={() => onNavigate('promoters', p.name)}
                        >
                            {p.confidence > 0 ? p.match : p.name}
                        </span>
                        {pIdx < (promoters?.length || 0) - 1 ? ', ' : ''}
                    </span>
                ));
            }
        }),
        columnHelper.accessor('consistent', {
            id: 'consistent',
            header: 'OK',
            filterFn: 'equals',
            cell: info => (
                <div style={{ textAlign: 'center', color: info.getValue() ? 'green' : 'red', fontWeight: 'bold' }}>
                    {info.getValue() ? '✓' : '✗'}
                </div>
            )
        }),
    ], [columnHelper]);

    const data = React.useMemo(() => result.successes || [], [result.successes]);

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

    return (
        <div className="preview-content">
            <h4>Summary</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <li><strong>Parsed:</strong> {result.success_count}</li>
                <li><strong>Inconsistent:</strong> {result.inconsistent_count}</li>
                <li><strong>Failed:</strong> {result.error_count}</li>
                <li><strong>Ignored:</strong> {result.ignored_count}</li>
            </ul>

            {isDebug && result.error_count > 0 && (
                <details>
                    <summary style={{ cursor: 'pointer', color: 'red' }}>Show Parse Errors ({result.error_count})</summary>
                    <pre style={{ maxHeight: '100px', overflowY: 'auto', background: '#fff0f0', padding: '10px', fontSize: '0.8em' }}>
                        {(result.parse_errors || []).join('\n')}
                    </pre>
                </details>
            )}

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px', border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '2px solid #ccc', zIndex: 1 }}>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} style={{ 
                                        padding: '8px', 
                                        textAlign: header.id === 'consistent' ? 'center' : 'left', 
                                        verticalAlign: 'top',
                                        width: header.id === 'date' ? '100px' : undefined
                                    }}>
                                        <div 
                                            onClick={header.column.getToggleSortingHandler()}
                                            style={{ cursor: 'pointer', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        >
                                            <span>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                                            </span>
                                            {header.column.getIsFiltered() && (
                                                <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '8px', fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                                                    {(() => {
                                                        const allMatches = table.getFilteredRowModel().rows.length;
                                                        const totalRows = table.getCoreRowModel().rows.length;
                                                        const otherFiltersActive = columnFilters.length > 1;

                                                        if (!otherFiltersActive) {
                                                            return `[${allMatches} / ${totalRows}]`;
                                                        }

                                                        const filterValue = header.column.getFilterValue();
                                                        const thisColMatches = table.getCoreRowModel().rows.filter(row => {
                                                            const val = row.getValue(header.column.id);
                                                            if (typeof val === 'boolean') return val === filterValue;
                                                            return String(val ?? '').toLowerCase().includes(String(filterValue).toLowerCase());
                                                        }).length;

                                                        return `[${allMatches} / ${thisColMatches} / ${totalRows}]`;
                                                    })()}
                                                </span>
                                            )}
                                        </div>
                                        {header.column.getCanFilter() && (
                                            header.column.id === 'consistent' ? (
                                                <select
                                                    value={String(header.column.getFilterValue() ?? '')}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        header.column.setFilterValue(val === '' ? undefined : val === 'true');
                                                    }}
                                                    style={{ width: '100%', fontSize: '0.8rem', padding: '2px' }}
                                                >
                                                    <option value="">All</option>
                                                    <option value="true">✓</option>
                                                    <option value="false">✗</option>
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Filter..."
                                                    value={(header.column.getFilterValue() ?? '') as string}
                                                    onChange={e => header.column.setFilterValue(e.target.value)}
                                                    style={{ width: '100%', fontSize: '0.8rem', padding: '2px' }}
                                                />
                                            )
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} style={{ 
                                        padding: '6px',
                                        whiteSpace: cell.column.id === 'date' ? 'nowrap' : undefined 
                                    }}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: '10px', textAlign: 'center' }}>No results found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};