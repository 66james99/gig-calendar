import type { SortState } from './types.js';

type Sortable = string | number | boolean | null | undefined;

// A sorter function takes an item and returns a value that can be sorted.
type Sorter<T> = (item: T) => Sortable;

// A map of column names to their specific sorter functions.
export type SorterMap<T> = {
    [key in keyof T]?: Sorter<T>;
};

export function applySort<T>(
    items: T[],
    sortState: SortState<keyof T & string>,
    sorters?: SorterMap<T>
): T[] {
    const { column, direction } = sortState;
    const modifier = direction === 'asc' ? 1 : -1;

    const getSortValue = (item: T): Sortable => {
        // If a custom sorter is provided for the column, use it.
        if (sorters && sorters[column]) {
            return sorters[column]!(item);
        }
        // Otherwise, access the property directly.
        const value = item[column];
        if (typeof value === 'string') {
            return value.toLowerCase();
        }
        return value as Sortable;
    };

    return [...items].sort((a, b) => {
        const valA = getSortValue(a);
        const valB = getSortValue(b);

        // Always sort null/undefined values to the end of the list.
        if (valA == null && valB != null) return 1;
        if (valA != null && valB == null) return -1;
        if (valA == null && valB == null) return 0;

        // At this point, neither valA nor valB is null or undefined.
        // We handle booleans separately as they don't sort with < or >.
        if (typeof valA === 'boolean' && typeof valB === 'boolean') {
            return (Number(valA) - Number(valB)) * modifier;
        }

        // The remaining types are string or number, which can be compared directly.
        // We can assert the types to satisfy the compiler.
        const comparableA = valA as string | number;
        const comparableB = valB as string | number;

        if (comparableA < comparableB) return -1 * modifier;
        if (comparableA > comparableB) return 1 * modifier;
        return 0;
    });
}