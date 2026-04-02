export type TableName = 
    | 'image_locations' | 'venues' | 'venue_aliases' | 'promoters' |'promoter_aliases'
    | 'performers' | 'performer_aliases' | 'festivals' | 'festival_aliases' | 'event_types'
    | 'stage_roles'

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