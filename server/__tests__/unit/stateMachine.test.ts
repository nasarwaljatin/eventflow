import { describe, it, expect } from 'vitest';
import { isValidTransition } from '../../src/lib/stateMachine.js';

describe('Registration State Machine', () => {
  it('allows reserved → confirmed', () => {
    expect(isValidTransition('reserved', 'confirmed')).toBe(true);
  });
  
  it('allows reserved → cancelled', () => {
    expect(isValidTransition('reserved', 'cancelled')).toBe(true);
  });
  
  it('allows confirmed → checked_in', () => {
    expect(isValidTransition('confirmed', 'checked-in')).toBe(true);
  });
  
  it('allows confirmed → cancelled', () => {
    expect(isValidTransition('confirmed', 'cancelled')).toBe(true);
  });
  
  it('rejects checked_in → cancelled', () => {
    expect(isValidTransition('checked-in', 'cancelled')).toBe(false);
  });
  
  it('rejects expired → any transition', () => {
    expect(isValidTransition('expired', 'confirmed')).toBe(false);
  });
  
  it('rejects cancelled → any transition', () => {
    expect(isValidTransition('cancelled', 'confirmed')).toBe(false);
  });
  
  it('rejects reserved → checked_in (must confirm first)', () => {
    expect(isValidTransition('reserved', 'checked-in')).toBe(false);
  });
});
