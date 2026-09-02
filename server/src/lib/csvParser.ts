import { parse } from 'csv-parse/sync';

export interface CsvParseResult {
  records: any[];
  errors: any[];
}

export const parseCsvAndValidate = (csvContent: string): CsvParseResult => {
  let rawRecords;
  try {
    rawRecords = parse(csvContent, { columns: true, skip_empty_lines: true });
  } catch (err) {
    throw new Error('Invalid CSV format');
  }

  const records = [];
  const errors = [];
  let rowNumber = 1;

  for (const record of rawRecords) {
    rowNumber++;
    const row: any = record;
    
    // Allow for some missing columns or extra whitespace
    const name = (row.name || row.attendee_name || row.attendeeName || '').trim();
    const email = (row.email || row.attendee_email || row.attendeeEmail || '').trim();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
      errors.push({ row: rowNumber, status: 'rejected', reason: 'Invalid email format', data: row });
      continue;
    }
    
    if (!name) {
      errors.push({ row: rowNumber, status: 'rejected', reason: 'Name is required', data: row });
      continue;
    }

    records.push({
      row: rowNumber,
      name,
      email: email.toLowerCase()
    });
  }

  return { records, errors };
};
