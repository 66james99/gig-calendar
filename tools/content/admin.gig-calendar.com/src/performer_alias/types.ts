export interface PerformerAlias {
    ID: number;
    Performer: number;
    Alias: string;
    Created: string;
    Updated: string;
}

export interface PerformerAliasPayload {
    performer_id: number;
    alias: string;
}

export type PerformerAliasSortableColumn = 'ID' | 'Performer' | 'Alias' | 'Created' | 'Updated';

export interface Filters {
    id: string;
    performer: string;
    alias: string;
    created: string;
    updated: string;
}

export interface Performer {
    ID: number;
    Name: string;
}