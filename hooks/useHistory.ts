
import { useState, useEffect, useCallback } from 'react';
import { Booking, HousekeepingStatus, RestorePoint } from '../types';

export const useHistory = (bookings: Booking[], housekeeping: Record<string, HousekeepingStatus>) => {
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('restore_points');
    if (saved) {
      setRestorePoints(JSON.parse(saved));
    }
  }, []);

  const createRestorePoint = useCallback((label: string) => {
    const newPoint: RestorePoint = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      label,
      data: {
        bookings: JSON.parse(JSON.stringify(bookings)),
        housekeeping: JSON.parse(JSON.stringify(housekeeping))
      }
    };

    setRestorePoints(prev => {
      const next = [newPoint, ...prev].slice(0, 50); // Keep last 50 points
      localStorage.setItem('restore_points', JSON.stringify(next));
      return next;
    });
  }, [bookings, housekeeping]);

  const restoreToPoint = (point: RestorePoint) => {
    if (confirm(`RESTORE POINT: Revert system to state: "${point.label}" from ${new Date(point.timestamp).toLocaleString()}?`)) {
      localStorage.setItem('bookings', JSON.stringify(point.data.bookings));
      localStorage.setItem('housekeeping', JSON.stringify(point.data.housekeeping));
      window.location.reload();
    }
  };

  const clearHistory = () => {
    if (confirm("Clear all previous restore points? This cannot be undone.")) {
      localStorage.removeItem('restore_points');
      setRestorePoints([]);
    }
  };

  return { restorePoints, createRestorePoint, restoreToPoint, clearHistory };
};
