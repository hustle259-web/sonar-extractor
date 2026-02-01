import Papa from 'papaparse';
import type { LeadItem } from '@/types/leads';

export function exportLeadsToCSV(leads: LeadItem[]): string {
  const rows = leads.map((l) => ({
    name: l.name,
    address: l.address,
    phone: l.phone,
    site: l.site,
    category: l.category,
    rating: l.rating,
  }));
  return Papa.unparse(rows, { header: true });
}

export function downloadCSV(leads: LeadItem[], filename = 'leads.csv') {
  const csv = exportLeadsToCSV(leads);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
