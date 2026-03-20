export interface StageRole {
    ID: number;
    Uuid: string;
    Pattern: string;
    Created: string;
    Updated: string;
}

export type StageRoleSortableColumn = 'ID' | 'Uuid' | 'Pattern' | 'Created' | 'Updated';
export type SortDirection = 'asc' | 'desc';