import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Video, Users, Phone, X, Clock, MapPin, CalendarDays } from 'lucide-react';
import { GlassCard } from '@/components/ui-kit/Card';
import { useAppointmentsContext } from '@/contexts/AppointmentsContext';
import type { Appointment } from '@/types';

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDayHeader(date: Date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  return {
    dayName: days[date.getDay()],
    dateNum: date.getDate(),
    month: date.toLocaleString('default', { month: 'short' }),
    isToday,
    isPast: date < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  };
}

function formatWeekRange(dates: Date[]): string {
  const start = dates[0];
  const end = dates[6];
  const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  return `${fmt(start)} - ${fmt(end)} ${end.getFullYear()}`;
}

function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function weekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

function parseAppointmentDate(dateStr: string, referenceDate: Date): Date {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dayMap: Record<string, number> = {
    today: today.getTime(),
    tomorrow: tomorrow.getTime(),
    yesterday: yesterday.getTime(),
  };

  const lower = dateStr.toLowerCase().trim();
  if (dayMap[lower] !== undefined) return new Date(dayMap[lower]);

  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const match = lower.match(/^(mon|tue|wed|thu|fri|sat|sun)(?:day)?\s*(\d+)?$/i);
  if (match) {
    const targetDayIndex = days.indexOf(match[1].toLowerCase());
    const currentDayIndex = referenceDate.getDay();
    let diff = targetDayIndex - currentDayIndex;
    if (diff <= 0) diff += 7;
    const d = new Date(today);
    d.setDate(today.getDate() + diff);
    if (match[2]) {
      const dayNum = parseInt(match[2], 10);
      d.setDate(dayNum);
    }
    return d;
  }
  return today;
}

function timeToMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 540;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

const typeStyles: Record<string, { bg: string; dot: string; label: string }> = {
  demo: { bg: 'border-l-accent bg-accent/10', dot: 'bg-accent', label: 'Demo' },
  meeting: { bg: 'border-l-emerald-400 bg-emerald-500/10', dot: 'bg-emerald-400', label: 'Meeting' },
  call: { bg: 'border-l-amber-400 bg-amber-500/10', dot: 'bg-amber-400', label: 'Call' },
};

const statusStyles: Record<string, string> = {
  scheduled: 'text-accent',
  completed: 'text-emerald-400',
  cancelled: 'text-rose-400',
};

const typeIcons: Record<string, React.ReactNode> = {
  demo: <Video className="w-3 h-3" />,
  meeting: <Users className="w-3 h-3" />,
  call: <Phone className="w-3 h-3" />,
};

const typeIconsLarge: Record<string, React.ReactNode> = {
  demo: <Video className="w-5 h-5" />,
  meeting: <Users className="w-5 h-5" />,
  call: <Phone className="w-5 h-5" />,
};

export function CalendarView() {
  const { appointments } = useAppointmentsContext();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    weekDates.forEach((d) => map.set(dateToKey(d), []));
    appointments.forEach((appt) => {
      const parsed = parseAppointmentDate(appt.date, weekDates[0]);
      const key = dateToKey(parsed);
      if (map.has(key)) {
        map.get(key)!.push(appt);
      }
    });
    return map;
  }, [appointments, weekDates]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const scheduled = appointments.filter((a) => a.status === 'scheduled').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const thisWeek = weekDates.reduce((sum, d) => sum + (appointmentsByDay.get(dateToKey(d))?.length ?? 0), 0);
    return { total, completed, scheduled, cancelled, thisWeek };
  }, [appointments, appointmentsByDay, weekDates]);

  return (
    <>
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Calendar</h3>
            <span className="text-xs text-muted-foreground ml-1">{formatWeekRange(weekDates)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Week {weekNumber(weekDates[0])}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="p-1.5 rounded-lg glass hover:bg-white/10 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1.5 rounded-lg glass hover:bg-white/10 transition text-xs font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="p-1.5 rounded-lg glass hover:bg-white/10 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-muted-foreground">This week:</span>
            <span className="font-semibold">{stats.thisWeek} appointments</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <span className="text-emerald-400 font-medium">{stats.completed} completed</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-accent font-medium">{stats.scheduled} upcoming</span>
          {stats.cancelled > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-rose-400 font-medium">{stats.cancelled} cancelled</span>
            </>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="flex gap-0">
          {/* Time Column */}
          <div className="w-14 shrink-0 pt-[52px] space-y-[60px]">
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="text-[10px] text-muted-foreground font-mono text-right pr-2 leading-[60px]">
                {slot}
              </div>
            ))}
          </div>
          {/* 7-Day Grid */}
          <div className="flex-1 grid grid-cols-7 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
            {/* Day Headers */}
            {weekDates.map((date) => {
            const { dayName, dateNum, month, isToday, isPast } = formatDayHeader(date);
            return (
              <div
                key={dateToKey(date)}
                className={`px-2 py-2 text-center border-b border-white/5 ${isToday ? 'bg-accent/10' : isPast ? 'bg-white/2' : ''}`}
              >
                <div className={`text-[10px] font-medium uppercase tracking-wider ${isToday ? 'text-accent' : 'text-muted-foreground'}`}>
                  {dayName}
                </div>
                <div className={`text-lg font-bold mt-0.5 ${isToday ? 'text-accent' : ''}`}>
                  {dateNum}
                </div>
                <div className="text-[9px] text-muted-foreground">{month}</div>
              </div>
            );
          })}

          {/* Time Grid */}
          {TIME_SLOTS.map((slot, slotIndex) => (
            weekDates.map((date) => {
              const dayKey = dateToKey(date);
              const dayAppointments = appointmentsByDay.get(dayKey) ?? [];

              // Find appointments that fall within this hour slot
              const slotMinutes = timeToMinutes(slot);
              const slotAppts = dayAppointments.filter((appt) => {
                const apptMinutes = timeToMinutes(appt.time);
                return apptMinutes >= slotMinutes && apptMinutes < slotMinutes + 60;
              });              return (
                <div
                  key={`${dayKey}-${slotIndex}`}
                  className={`min-h-[60px] relative ${slotIndex % 2 === 0 ? 'bg-white/3' : 'bg-transparent'} hover:bg-white/5 transition-colors`}
                >

                  {/* Appointments in this slot */}
                  <div className="p-0.5 space-y-0.5">
                    {slotAppts.map((appt) => {
                      const style = typeStyles[appt.type] ?? typeStyles.meeting;
                      return (
                        <button
                          key={appt.id}
                          onClick={() => setSelectedAppointment(appt)}
                          className={`w-full text-left border-l-2 rounded-r-lg px-1.5 py-1 ${style.bg} hover:brightness-125 transition-all cursor-pointer`}
                        >
                          <div className="flex items-center gap-1">
                            {typeIcons[appt.type] ?? typeIcons.meeting}
                            <span className="text-[10px] font-medium truncate">{appt.leadName}</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground truncate mt-0.5">{appt.time}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>
      </GlassCard>

      {/* Appointment Detail Modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedAppointment(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0f172a] text-white rounded-[16px] p-6 w-full max-w-sm mx-4 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedAppointment(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl grad-primary grid place-items-center text-white">
                  {typeIconsLarge[selectedAppointment.type] ?? typeIconsLarge.meeting}
                </div>
                <div>
                  <h4 className="font-semibold">{selectedAppointment.leadName}</h4>
                  <span className={`text-xs font-medium ${statusStyles[selectedAppointment.status] ?? 'text-muted-foreground'}`}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5 glass rounded-lg p-2.5">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>{selectedAppointment.date}</span>
                </div>
                <div className="flex items-center gap-2.5 glass rounded-lg p-2.5">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>{selectedAppointment.time} · {selectedAppointment.duration}</span>
                </div>
                <div className="flex items-center gap-2.5 glass rounded-lg p-2.5">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{selectedAppointment.type === 'demo' ? 'Video Call' : selectedAppointment.type === 'call' ? 'Phone Call' : 'Conference Room'} · {selectedAppointment.leadCompany}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-medium glass">
                  {selectedAppointment.type.charAt(0).toUpperCase() + selectedAppointment.type.slice(1)}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                  selectedAppointment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                  selectedAppointment.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300' :
                  'bg-accent/20 text-accent'
                }`}>
                  {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                </span>
              </div>

              <button
                onClick={() => setSelectedAppointment(null)}
                className="mt-4 w-full h-10 rounded-xl glass text-sm font-medium hover:bg-white/10 transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
