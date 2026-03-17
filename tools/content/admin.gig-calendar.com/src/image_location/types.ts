export interface ImageLocation {
    ID: number;
    Root: string;
    Pattern: string;
    DateFromExif: boolean;
    IncludeParent: boolean;
    IgnoreDirs: string[] | null;
    Active: boolean;
    Created: string;
    Updated: string;
}

export interface ImageLocationPayload {
    root: string;
    pattern: string;
    date_from_exif: boolean;
    include_parent: boolean;
    ignore_dirs: string[];
    active: boolean;
}

export interface MatchedVenue {
    name: string;
    match: string;
    confidence: number;
}

export interface ParsedResult {
    directory: string;
    year?: number;
    month?: number;
    day?: number;
    performers?: string[];
    venue?: MatchedVenue;
    promoters?: string[];
    consistent: boolean;
}

export interface ScanResult {
    directories: string[];
    successes?: ParsedResult[];
    success_count: number;
    inconsistent_count: number;
    error_count: number;
    ignored_count: number;
    parse_errors?: string[];
}

export type ImageLocationSortableColumn = 'ID' | 'Root' | 'Pattern' | 'DateFromExif' | 'IncludeParent' | 'Active' | 'Created' | 'Updated';

export interface Filters {
    id: string;
    root: string;
    pattern: string;
    dateFromExif: string;
    includeParent: string;
    ignoreDirs: string;
    active: string;
}