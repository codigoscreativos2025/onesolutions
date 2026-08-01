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
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';

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

function generateSlotsFromRanges(ranges: { start: string; end: string }[]): string[] {
  const slots: string[] = [];
  for (const range of ranges) {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    for (let m = startMinutes; m < endMinutes; m += 60) {
      const h = Math.floor(m / 60).toString().padStart(2, '0');
      const min = (m % 60).toString().padStart(2, '0');
      slots.push(`${h}:${min}`);
    }
  }
  return slots;
}

export function SlotPicker({ userId, selectedDate, selectedTime, onSelect }: SlotPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayAvailability, setDayAvailability] = useState<Record<string, DayData>>({});
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
      }
    } catch {
      // ignore
    } finally {
      setLoadingAvail(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAvailability(currentMonth);
  }, []); // eslint-disable-line

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

  const handleDayClick = (day: Date) => {
    if (isSameMonth(day, currentMonth) && isDayAvailable(day)) {
      setInternalSelectedDate(day);
    }
  };

  const handleMonthChange = (next: Date) => {
    setCurrentMonth(next);
    fetchAvailability(next);
  };

  const handleTimeSelect = (time: string) => {
    if (internalSelectedDate) {
      const dateKey = format(internalSelectedDate, 'yyyy-MM-dd');
      onSelect(dateKey, time);
    }
  };

  const slots = internalSelectedDate ? generateSlotsFromRanges(getDayRanges(internalSelectedDate)) : [];

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
          const canClick = isCurrentMonth && available;

          return (
            <button
              type="button"
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={!canClick}
              className={`min-h-[40px] p-1 rounded-lg border text-sm transition-all ${
                !isCurrentMonth
                  ? 'border-transparent opacity-30 cursor-default'
                  : !available
                  ? 'border-red-200 bg-red-50 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  : isSelected
                  ? 'border-primary bg-primary/10 text-primary'
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
                  selectedTime === time;
                return (
                  <button
                    type="button"
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      isTimeSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-semibold">{time}</span>
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
