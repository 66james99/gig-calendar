export interface FestivalAlias {
    ID: number;
    Festival: number;
    Alias: string;
    Uuid: string;
    Created: string;
    Updated: string;
}

export interface Festival {
    ID: number;
    Promoter: number;
    Description: string;
    StartDate: string;
}

export interface Promoter {
    ID: number;
    Name: string;
}

export interface FestivalAliasPayload {
    festival_id: number;
    alias: string;
}

export type FestivalAliasSortableColumn = 'ID' | 'Festival' | 'Alias' | 'Uuid' | 'Created' | 'Updated';
export type SortDirection = 'asc' | 'desc';