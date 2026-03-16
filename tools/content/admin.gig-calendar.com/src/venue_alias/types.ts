export interface VenueAlias {
    ID: number;
    Venue: number; // Corresponds to the Venue ID
    Alias: string;
    Created: string;
    Updated: string;
}

export interface VenueAliasPayload {
    venue_id: number;
    alias: string;
}

export type VenueAliasSortableColumn = 'ID' | 'Venue' | 'Alias' | 'Created' | 'Updated';

export interface Filters {
    id: string;
    venue: string;
    alias: string;
    created: string;
    updated: string;
}

// This is a simplified Venue interface for display purposes in the alias table
export interface Venue {
    ID: number;
    Name: string;
}