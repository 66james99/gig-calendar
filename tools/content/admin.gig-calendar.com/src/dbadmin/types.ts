export type TableName = 
    | 'image_locations' | 'venues' | 'venue_aliases' | 'promoters' |'promoter_aliases'
    | 'performers' | 'performer_aliases' | 'festivals' | 'festival_aliases' | 'event_types'
    | 'stage_roles';

export const TABLES: TableName[] = [
    'image_locations', 'venues', 'venue_aliases', 'promoters', 'promoter_aliases', 
    'performers', 'performer_aliases', 'festivals', 'festival_aliases', 'event_types',
    'stage_roles'
];

export const getFkTable = (columnId: string): TableName | null => {
    const lower = columnId.toLowerCase();
    const schemaMap: Record<string, TableName> = {
        'location': 'image_locations', 'source': 'image_locations', 'event_type': 'event_types',
        'venue': 'venues', 'promoter': 'promoters', 'performer': 'performers', 'festival': 'festivals'
    };
    if (schemaMap[lower]) return schemaMap[lower];
    let entityName = lower.endsWith('_id') ? lower.replace('_id', '') : (lower.endsWith('id') && lower !== 'id' ? lower.replace('id', '') : lower);
    if (entityName === 'id') return null;
    const plural = entityName.endsWith('s') ? entityName : entityName + 's';
    return TABLES.find(t => {
        const tLower = t.toLowerCase();
        return tLower === entityName || tLower === plural || tLower.replace('_', '') === entityName;
    }) || null;
};

export const getRowName = (row: any, includeId = false): string => {
    if (!row) return '';
    const name = String(
        row.name || row.Name || row.alias || row.Alias || 
        (row.root ? `${row.root}${row.pattern || ''}` : '') || 
        row.id || row.ID || ''
    );
    return includeId ? `${name} [ID: ${row.id ?? row.ID}]` : name;
};

export const preparePayload = (rowData: any) => {
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

export interface ColumnConfig {
    header: string;
    accessorKey: string;
    type: 'text' | 'number' | 'date' | 'boolean';
}

export interface PerformerMatchResult {
    name: string;
    match?: string;
    confidence: number;
    pattern?: string;
}

export interface MatchedVenue {
    name: string;
    match: string;
    confidence: number;
}

export interface PromoterMatchResult {
    name: string;
    match: string;
    confidence: number;
    festival?: boolean;
}

export interface MatchedResult {
    directory: string;
    year?: number;
    month?: number;
    day?: number;
    performers?: PerformerMatchResult[][];
    venue?: MatchedVenue;
    promoters?: PromoterMatchResult[];
    consistent: boolean;
}

export interface ScanResult {
    directories: string[];
    successes?: MatchedResult[];
    success_count: number;
    inconsistent_count: number;
    error_count: number;
    ignored_count: number;
    parse_errors?: string[];
}