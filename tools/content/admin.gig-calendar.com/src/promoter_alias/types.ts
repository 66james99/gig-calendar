export interface PromoterAlias {
    ID: number;
    Promoter: number;
    Alias: string;
    Uuid: string;
    Created: string;
    Updated: string;
}

export interface Promoter {
    ID: number;
    Name: string;
}

export interface PromoterAliasPayload {
    promoter_id: number;
    alias: string;
}

export type PromoterAliasSortableColumn = 'ID' | 'Promoter' | 'Alias' | 'Uuid' | 'Created' | 'Updated';

export type SortDirection = 'asc' | 'desc';