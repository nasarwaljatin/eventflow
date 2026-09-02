export const isValidTransition = (currentStatus: string, targetStatus: string): boolean => {
  if (currentStatus === 'cancelled' || currentStatus === 'expired') return false;

  if (targetStatus === 'confirmed') {
    return currentStatus === 'reserved';
  }
  if (targetStatus === 'checked-in' || targetStatus === 'checkedIn') {
    return currentStatus === 'confirmed';
  }
  if (targetStatus === 'cancelled') {
    return currentStatus === 'reserved' || currentStatus === 'confirmed';
  }
  return false;
};
