export interface UrlActionConfig<T> {
    nameField: keyof T;
    onNew: (name: string) => void;
    onEdit: (item: T) => void;
    onNotFound: (name: string) => void;
}

export function handleUrlActions<T>(items: T[], config: UrlActionConfig<T>) {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const name = params.get('name');

    if (!action || !name) return;

    const item = items.find(i => String(i[config.nameField]) === name);

    if (action === 'new') {
        if (item) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('action', 'edit');
            window.history.replaceState({}, '', newUrl.toString());
            config.onEdit(item);
        } else {
            config.onNew(name);
        }
    } else if (action === 'edit') {
        if (item) {
            config.onEdit(item);
        } else {
            config.onNotFound(name);
        }
    }
}