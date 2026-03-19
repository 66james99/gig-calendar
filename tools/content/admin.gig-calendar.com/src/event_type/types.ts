export interface EventType {
    ID: number;
    Uuid: string;
    Name: string;
}

export type EventTypeSortableColumn = 'ID' | 'Uuid' | 'Name';
export type SortDirection = 'asc' | 'desc';