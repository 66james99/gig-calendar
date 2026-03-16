export interface SortState<T extends string> {
    column: T;
    direction: 'asc' | 'desc';
}