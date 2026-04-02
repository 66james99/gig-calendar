import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, } from '@tanstack/react-table';
export const DataTable = ({ data, tableName, onRefresh }) => {
    const [sorting, setSorting] = React.useState([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const columnHelper = createColumnHelper();
    // Dynamic columns based on the first data object
    const columns = React.useMemo(() => {
        if (!data || data.length === 0)
            return [];
        const baseCols = Object.keys(data[0]).map(key => columnHelper.accessor(key, {
            header: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
            cell: info => info.getValue(),
        }));
        // Add the required Action buttons as per README
        return [
            ...baseCols,
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: props => (_jsxs("div", { className: "action-buttons", children: [_jsx("button", { title: "Edit", onClick: () => console.log('Edit', props.row.original), children: "\u270F\uFE0F" }), _jsx("button", { title: "Duplicate", onClick: () => console.log('Duplicate', props.row.original), children: "\uD83D\uDCCB" }), _jsx("button", { title: "Delete", onClick: () => {
                                if (window.confirm('Are you sure you want to delete this row?')) {
                                    console.log('Delete', props.row.original);
                                }
                            }, children: "\uD83D\uDDD1\uFE0F" })] }))
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
    return (_jsxs("div", { className: "spa-container", children: [_jsxs("div", { className: "table-controls", children: [_jsx("input", { value: globalFilter ?? '', onChange: e => setGlobalFilter(e.target.value), placeholder: "Filter table..." }), _jsx("button", { onClick: () => console.log('New row'), children: "New" }), _jsx("button", { onClick: onRefresh, children: "Refresh Table" })] }), data.length === 0 ? (_jsxs("div", { className: "empty-state", children: ["The ", tableName, " table is currently empty."] })) : (_jsxs("table", { children: [_jsx("thead", { children: table.getHeaderGroups().map(headerGroup => (_jsx("tr", { children: headerGroup.headers.map(header => (_jsxs("th", { onClick: header.column.getToggleSortingHandler(), children: [flexRender(header.column.columnDef.header, header.getContext()), header.column.getIsSorted() === 'asc' ? ' 🔼' : header.column.getIsSorted() === 'desc' ? ' 🔽' : ''] }, header.id))) }, headerGroup.id))) }), _jsx("tbody", { children: table.getRowModel().rows.map(row => (_jsx("tr", { children: row.getVisibleCells().map(cell => (_jsx("td", { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] }))] }));
};
