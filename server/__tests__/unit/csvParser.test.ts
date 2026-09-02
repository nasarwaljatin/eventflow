import { describe, it, expect } from 'vitest';
import { parseCsvAndValidate } from '../../src/lib/csvParser.js';

describe('CSV Import Parser', () => {
  it('parses valid rows', () => {
    const csv = `name,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com`;
    const result = parseCsvAndValidate(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.records).toHaveLength(2);
    expect(result.records[0].name).toBe('John Doe');
  });
  
  it('rejects rows with invalid email', () => {
    const csv = `name,email\nJohn Doe,johnexample.com`;
    const result = parseCsvAndValidate(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.records).toHaveLength(0);
    expect(result.errors[0].reason).toBe('Invalid email format');
  });
  
  it('rejects rows with empty name', () => {
    const csv = `name,email\n,john@example.com`;
    const result = parseCsvAndValidate(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.records).toHaveLength(0);
    expect(result.errors[0].reason).toBe('Name is required');
  });
  
  it('handles extra/missing columns gracefully', () => {
    const csv = `attendee_name,attendee_email,extra\nJohn Doe,john@example.com,ignoreme`;
    const result = parseCsvAndValidate(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.records[0].name).toBe('John Doe');
  });
  
  it('trims whitespace from fields', () => {
    const csv = `name,email\n  John Doe  ,  john@example.com  `;
    const result = parseCsvAndValidate(csv);
    expect(result.records[0].name).toBe('John Doe');
    expect(result.records[0].email).toBe('john@example.com');
  });
});
