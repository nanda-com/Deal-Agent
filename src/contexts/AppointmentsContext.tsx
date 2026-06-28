import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { appointments as mockAppointments } from '@/lib/mockData';
import type { Appointment } from '@/types';

interface AppointmentsContextValue {
  appointments: Appointment[];
  addAppointment: (input: Omit<Appointment, 'id'>) => Appointment;
  loading: boolean;
}

const AppointmentsContext = createContext<AppointmentsContextValue | null>(null);

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAppointments(mockAppointments as Appointment[]);
    setLoading(false);
  }, []);

  const addAppointment = useCallback((input: Omit<Appointment, 'id'>): Appointment => {
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      ...input,
    };
    setAppointments((prev) => [newAppointment, ...prev]);
    return newAppointment;
  }, []);

  return (
    <AppointmentsContext.Provider
      value={{ appointments, addAppointment, loading }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointmentsContext() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error('useAppointmentsContext must be used within AppointmentsProvider');
  return ctx;
}
