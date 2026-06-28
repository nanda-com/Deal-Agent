import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Check, X, Sparkles, ChevronRight, Users, Phone, Video } from 'lucide-react';
import { Badge, GlassCard } from '@/components/ui-kit/Card';
import { toast } from 'sonner';
import { useAppointmentsContext } from '@/contexts/AppointmentsContext';
import type { Appointment } from '@/types';

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM',
];

const appointmentTypes = [
  { value: 'demo' as const, label: 'Product Demo', icon: <Video className="w-4 h-4" />, duration: '30 min' },
  { value: 'meeting' as const, label: 'Meeting', icon: <Users className="w-4 h-4" />, duration: '45 min' },
  { value: 'call' as const, label: 'Phone Call', icon: <Phone className="w-4 h-4" />, duration: '20 min' },
];

export function AppointmentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const { addAppointment } = useAppointmentsContext();

  const handleBook = () => {
    addAppointment({
      leadName: 'New Lead',
      leadCompany: 'Nimbus Labs',
      type: (selectedType?.toLowerCase().includes('demo') ? 'demo' : selectedType?.toLowerCase().includes('call') ? 'call' : 'meeting') as 'demo' | 'meeting' | 'call',
      time: selectedSlot ?? '3:00 PM',
      date: selectedDate,
      duration: '30 min',
      status: 'scheduled',
      assignedTo: 'You',
    });
    toast.success('📅 Appointment booked!', {
      description: `${selectedType} scheduled for ${selectedDate} at ${selectedSlot}. Calendar invite sent.`,
    });
    setStep(0);
    setSelectedType(null);
    setSelectedSlot(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#0f172a] text-white rounded-[16px] p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold">Book Appointment</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Progress */}
            <div className="flex items-center gap-2 mb-6">
              {[0, 1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold transition ${step >= s ? 'grad-primary text-white' : 'glass text-muted-foreground'}`}>
                    {step > s ? <Check className="w-3 h-3" /> : s + 1}
                  </div>
                  {s < 2 && <div className={`flex-1 h-0.5 transition ${step > s ? 'grad-primary' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>

            {step === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-2">Select appointment type</p>
                {appointmentTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setSelectedType(t.label); setStep(1); }}
                    className="w-full flex items-center gap-4 glass rounded-xl p-4 hover:bg-white/10 transition text-left"
                  >
                    <div className="w-10 h-10 rounded-xl grad-primary grid place-items-center text-white">
                      {t.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.duration}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-2">Select date & time</p>
                <div className="flex gap-2 mb-3">
                  {['Today', 'Tomorrow', 'Thu 5', 'Fri 6'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${selectedDate === d ? 'grad-primary text-white' : 'glass hover:bg-white/10'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => { setSelectedSlot(slot); setStep(2); }}
                      className={`py-2 rounded-xl text-xs font-medium transition ${selectedSlot === slot ? 'grad-primary text-white' : 'glass hover:bg-white/10'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">Confirm booking</p>
                <div className="glass rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{selectedType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedSlot}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl glass hover:bg-white/10 text-sm font-medium">
                    Back
                  </button>
                  <button onClick={handleBook} className="flex-1 h-11 rounded-xl grad-primary text-white text-sm font-semibold hover:opacity-90 transition">
                    Confirm Booking
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function UpcomingMeetings() {
  const { appointments } = useAppointmentsContext();
  const todayAppts = appointments.filter((a) => a.date === 'Today' && a.status === 'scheduled');
  return (
    <div className="space-y-2">
      {todayAppts.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No meetings scheduled for today</p>
      ) : (
        todayAppts.map((appt) => (
          <div key={appt.id} className="flex items-center gap-3 glass rounded-lg p-2.5">
            <div className="w-8 h-8 rounded-lg grad-primary grid place-items-center text-xs font-bold text-white">
              {appt.leadName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{appt.leadName}</div>
              <div className="text-[10px] text-muted-foreground">{appt.leadCompany} · {appt.type}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-semibold">{appt.time}</div>
              <div className="text-[10px] text-muted-foreground">{appt.duration}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function AppointmentStats() {
  const { appointments } = useAppointmentsContext();
  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const scheduled = appointments.filter((a) => a.status === 'scheduled').length;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="glass rounded-xl p-3 text-center">
        <div className="text-lg font-bold">{total}</div>
        <div className="text-[10px] text-muted-foreground">Total</div>
      </div>
      <div className="glass rounded-xl p-3 text-center">
        <div className="text-lg font-bold text-emerald-400">{completed}</div>
        <div className="text-[10px] text-muted-foreground">Completed</div>
      </div>
      <div className="glass rounded-xl p-3 text-center">
        <div className="text-lg font-bold text-accent">{scheduled}</div>
        <div className="text-[10px] text-muted-foreground">Upcoming</div>
      </div>
    </div>
  );
}
