import type { VenueAlias, Venue } from './types.js';
import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml, formatDateTime } from '../shared/ui.js';

export function renderTable(tbody: HTMLTableSectionElement, aliases: VenueAlias[], venues: Venue[]) {
    tbody.innerHTML = ''; // Clear existing rows
    if (aliases.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(7, 'No venue aliases found.');
        return;
    }
    aliases.forEach(alias => renderDisplayRow(tbody, alias, venues));
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, alias: VenueAlias, venues: Venue[]) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${alias.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = alias.ID.toString();
    }
    row.innerHTML = `
        <td>${alias.ID}</td>
        <td>${getVenueName(alias.Venue, venues)}</td>
        <td>${alias.Uuid}</td>
        <td>${alias.Alias}</td>
        <td>${formatDateTime(alias.Created)}</td>
        <td>${formatDateTime(alias.Updated)}</td>
        <td class="actions">${getActionButtonsHtml()}</td>
    `;
}

export function renderEditRow(tbody: HTMLTableSectionElement, alias: Partial<VenueAlias>, isNew: boolean, venues: Venue[]) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${alias.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = alias.ID ? alias.ID.toString() : 'new';
    } else if (!row) {
        return; // Should not happen for existing rows
    }

    const venueOptions = venues.map(v => 
        `<option value="${v.ID}" ${alias.Venue === v.ID ? 'selected' : ''}>${v.Name}</option>`
    ).join('');

    row.innerHTML = `
        <td>${alias.ID || 'New'}</td>
        <td>
            <select class="edit-venue_id" style="width: 100%;">
                ${venueOptions}
            </select>
        </td>
        <td>${alias.Uuid || 'N/A'}</td>
        <td><input type="text" class="edit-alias" value="${alias.Alias || ''}" style="width: 100%;"></td>
        <td>${formatDateTime(alias.Created)}</td>
        <td>${formatDateTime(alias.Updated)}</td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;
}

function getVenueName(venueID: number, venues: Venue[]): string {
    const venue = venues.find(v => v.ID === venueID);
    return venue ? venue.Name : `Unknown Venue (${venueID})`;
}