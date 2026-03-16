export interface Promoter {
    ID: number;
    Uuid: string;
    Created: string;
    Updated: string;
    Name: string;
}

export interface PromoterPayload {
    name: string;
}

export type SortableColumn = 'ID' | 'Name' | 'Uuid' | 'Created' | 'Updated';

export interface SortState {
    column: SortableColumn;
    direction: 'asc' | 'desc';
}

export interface Filters {
    id: string;
    name: string;
    uuid: string;
}