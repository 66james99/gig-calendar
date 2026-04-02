import React from 'react';
import { flexRender, Header, Table } from '@tanstack/react-table';

interface SortableHeaderProps {
    header: Header<any, any>;
    table: Table<any>;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({ header, table }) => {
    const isFiltered = header.column.getIsFiltered();
    const columnFilters = table.getState().columnFilters;

    return (
        <div 
            onClick={header.column.getToggleSortingHandler()}
            style={{ cursor: 'pointer', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
            <span>
                {flexRender(header.column.columnDef.header, header.getContext())}
                {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
            </span>
            {isFiltered && (
                <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '8px', fontWeight: 'normal', whiteSpace: 'nowrap' }}>
                    {(() => {
                        const allMatches = table.getFilteredRowModel().rows.length;
                        const totalRows = table.getCoreRowModel().rows.length;
                        const filterValue = header.column.getFilterValue();

                        if (columnFilters.length <= 1) return `[${allMatches} / ${totalRows}]`;

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
    );
};