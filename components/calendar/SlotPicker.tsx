'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isBefore,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DayData {
  available: boolean;
  ranges: { start: string; end: string }[];
}

interface SlotPickerProps {
  userId: number;
  selectedDate?: string;
  selectedTime?: string;
  onSelect: (date: string, time: string) => void;
}

function generateSlotsFromRanges(ranges: { start: string; end: string }[]): { display: string; value: string }[] {
  const slots: { display: string; value: string }[] = [];
  for (const range of ranges) {
    if (!range.start || !range.end) continue;
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    if (isNaN(startH) || isNaN(endH) || isNaN(startM) || isNaN(endM)) continue;
    const startMinutes = startH * 60 + (isNaN(startM) ? 0 : startM);
    const endMinutes = endH * 60 + (isNaN(endM) ? 0 : endM);
    if (endMinutes <= startMinutes) continue;
    for (let m = startMinutes; m < endMinutes; m += 60) {
      const h24 = Math.floor(m / 60);
      const min = (m % 60).toString().padStart(2, '0');
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      const value = `${h24.toString().padStart(2, '0')}:${min}`;
      slots.push({ display: `${h12}:${min} ${ampm}`, value });
    }
  }
  return slots;
}

export function SlotPicker({ userId, selectedDate, selectedTime, onSelect }: SlotPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayAvailability, setDayAvailability] = useState<Record<string, DayData>>({});
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(null);
  const [loadingAvail, setLoadingAvail] = useState(false);

  const fetchAvailability = useCallback(async (month: Date) => {
    setLoadingAvail(true);
    try {
      const m = (month.getMonth() + 1).toString();
      const y = month.getFullYear().toString();
      const res = await fetch(`/api/profile/availability?userId=${userId}&month=${m}&year=${y}`);
      if (res.ok) {
        const data = await res.json();
        if (data.availability) {
          setDayAvailability(data.availability);
        }
        if (data.bookedSlots) {
          setBookedSlots(data.bookedSlots);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingAvail(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAvailability(currentMonth);
  }, [fetchAvailability, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAvailabilityForDate = (date: Date): DayData | undefined => {
    const key = format(date, 'yyyy-MM-dd');
    return dayAvailability[key];
  };

  const isDayAvailable = (date: Date): boolean => {
    const avail = getAvailabilityForDate(date);
    if (!avail) return false;
    return avail.available === true;
  };

  const getDayRanges = (date: Date): { start: string; end: string }[] => {
    return getAvailabilityForDate(date)?.ranges || [];
  };

  const today = startOfDay(new Date());

  const handleDayClick = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return;
    
    if (isBefore(day, today)) {
      toast.error("No se pueden agendar visitas en fechas pasadas.");
      return;
    }

    if (isDayAvailable(day)) {
      setInternalSelectedDate(day);
    }
  };

  const handleMonthChange = (next: Date) => {
    setCurrentMonth(next);
    fetchAvailability(next);
  };

  const handleTimeSelect = (time: { display: string; value: string }) => {
    if (internalSelectedDate) {
      const dateKey = format(internalSelectedDate, 'yyyy-MM-dd');
      onSelect(dateKey, time.value);
    }
  };

  const isSlotBooked = (dateKey: string, timeValue: string) => {
    const slotDate = new Date(`${dateKey}T${timeValue}:00`);
    return bookedSlots.some(bookedIso => {
      const bookedDate = new Date(bookedIso);
      return bookedDate.getTime() === slotDate.getTime();
    });
  };

  const slots = internalSelectedDate 
    ? generateSlotsFromRanges(getDayRanges(internalSelectedDate)).filter(
        slot => !isSlotBooked(format(internalSelectedDate, 'yyyy-MM-dd'), slot.value)
      )
    : [];

  return (
    <div className="bg-surface-container-low rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button type="button"
          onClick={() => handleMonthChange(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <button
          onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loadingAvail && (
        <div className="flex justify-center mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-on-surface-variant" />
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-on-surface-variant py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = internalSelectedDate ? isSameDay(day, internalSelectedDate) : false;
          const available = isCurrentMonth && isDayAvailable(day);
          const isPastDate = isBefore(day, today);

          return (
            <button
              type="button"
              key={index}
              onClick={() => handleDayClick(day)}
              className={`min-h-[40px] p-1 rounded-lg border text-sm transition-all ${
                !isCurrentMonth
                  ? 'border-transparent opacity-30 cursor-default'
                  : isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : isPastDate
                  ? 'border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                  : !available
                  ? 'border-red-200 bg-red-50 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  : 'border-green-300 bg-green-50 text-green-800 hover:border-green-400 cursor-pointer'
              }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {internalSelectedDate && (
        <div className="pt-4 border-t border-outline-variant/30">
          <h4 className="text-sm font-bold mb-3">
            Horarios disponibles para el {format(internalSelectedDate, "d 'de' MMMM", { locale: es })}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {slots.length === 0 ? (
              <p className="text-on-surface-variant col-span-full text-center py-4 text-sm">
                No hay horarios disponibles para este dia
              </p>
            ) : (
              slots.map((time) => {
                const isTimeSelected =
                  selectedDate &&
                  selectedTime &&
                  isSameDay(internalSelectedDate, new Date(selectedDate + 'T12:00:00')) &&
                  selectedTime === time.value;
                return (
                  <button
                    type="button"
                    key={time.value}
                    onClick={() => handleTimeSelect(time)}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      isTimeSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-semibold">{time.display}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
