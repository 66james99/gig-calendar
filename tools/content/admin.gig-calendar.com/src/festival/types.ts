export interface Festival {
    ID: number;
    Name: string;
    Promoter: number;
    StartDate: string;
    EndDate: string;
    Description: string;
    Uuid: string;
}

export interface Promoter {
    ID: number;
    Name: string;
}

export interface FestivalPayload {
    name: string;
    promoter_id: number;
    start_date: string;
    end_date: string;
    description: string;
}

export type FestivalSortableColumn = 'ID' | 'Name' | 'Promoter' | 'StartDate' | 'EndDate' | 'Description' | 'Uuid';
export type SortDirection = 'asc' | 'desc';