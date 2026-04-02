export type TableName = 
    | 'festivals' | 'festival_promoters' | 'festival_venues' | 'stage_roles' 
    | 'promoters' | 'venues' | 'festival_aliases' | 'performers' | 'gigs' 
    | 'tickets' | 'artists' | 'image_locations' | 'events';

export interface ColumnConfig {
    header: string;
    accessorKey: string;
    type: 'text' | 'number' | 'date' | 'boolean';
}