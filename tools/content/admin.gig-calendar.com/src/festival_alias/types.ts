export interface FestivalAlias {
    ID: number;
    FestivalID: number;
    Alias: string;
    Uuid: string;
    Created: string;
    Updated: string;
}

export interface Festival {
    ID: number;
    PromoterID: number;
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

export type FestivalAliasSortableColumn = 'ID' | 'FestivalID' | 'Alias' | 'Uuid' | 'Created' | 'Updated';
export type SortDirection = 'asc' | 'desc';