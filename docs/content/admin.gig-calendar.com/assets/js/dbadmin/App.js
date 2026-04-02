import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { DataTable } from './DataTable';
const TABLES = [
    'festivals', 'festival_promoters', 'festival_venues', 'stage_roles',
    'promoters', 'venues', 'festival_aliases', 'performers', 'gigs',
    'tickets', 'artists', 'locations', 'events'
];
export const App = () => {
    const [activeTable, setActiveTable] = React.useState(TABLES[0]);
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['tableData', activeTable],
        queryFn: () => api.fetchTableData(activeTable),
    });
    return (_jsxs("div", { className: "admin-app", children: [_jsxs("header", { children: [_jsx("h1", { children: "Gig Calendar Admin" }), _jsxs("div", { className: "selector-container", children: [_jsx("label", { htmlFor: "table-select", children: "Select Table: " }), _jsx("select", { id: "table-select", value: activeTable, onChange: (e) => setActiveTable(e.target.value), children: TABLES.map(t => (_jsx("option", { value: t, children: t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ') }, t))) })] })] }), _jsxs("main", { children: [isLoading && _jsx("div", { children: "Loading data..." }), error && _jsxs("div", { className: "error", children: ["Error fetching data: ", error.message] }), data && (_jsx(DataTable, { data: data, tableName: activeTable, onRefresh: refetch }))] })] }));
};
