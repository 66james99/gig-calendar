export interface Performer {
    ID: number;
    Uuid: string;
    Created: string;
    Updated: string;
    Name: string;
}

export interface PerformerPayload {
    name: string;
}

export type PerformerSortableColumn = 'ID' | 'Name' | 'Uuid' | 'Created' | 'Updated';

export interface Filters {
    id: string;
    name: string;
    uuid: string;
}