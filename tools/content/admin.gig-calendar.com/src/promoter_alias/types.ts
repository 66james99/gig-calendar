export interface PromoterAlias {
    ID: number;
    Promoter: number;
    Uuid: string;
    Alias: string;
    Created: string;
    Updated: string;
}

export interface PromoterAliasPayload {
    promoter_id: number;
    alias: string;
}

export type PromoterAliasSortableColumn = 'ID' | 'Promoter' | 'Uuid' | 'Alias' | 'Created' | 'Updated';

export interface Filters {
    id: string;
    promoter: string;
    uuid: string;
    alias: string;
    created: string;
    updated: string;
}

export interface Promoter {
    ID: number;
    Name: string;
}