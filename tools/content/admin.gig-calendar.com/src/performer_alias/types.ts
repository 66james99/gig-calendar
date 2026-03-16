export interface PerformerAlias {
    ID: number;
    Performer: number;
    Uuid: string;
    Alias: string;
    Created: string;
    Updated: string;
}

export interface PerformerAliasPayload {
    performer_id: number;
    alias: string;
}

export type PerformerAliasSortableColumn = 'ID' | 'Performer' | 'Uuid' | 'Alias' | 'Created' | 'Updated';

export interface Filters {
    id: string;
    performer: string;
    uuid: string;
    alias: string;
    created: string;
    updated: string;
}

export interface Performer {
    ID: number;
    Name: string;
}