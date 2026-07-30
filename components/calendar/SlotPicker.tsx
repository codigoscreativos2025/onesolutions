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

interface Slot {
  id: number;
  startAt: string;
  endAt: string;
  isBooked: boolean;
}

interface SlotPickerProps {
  closerId: number;
  selectedSlotId?: number;
  onSlotSelect: (slotId: number) => void;
  onSlotSelectWithDate?: (slot: Slot) => void;
}

export function SlotPicker({ closerId, selectedSlotId, onSlotSelect, onSlotSelectWithDate }: SlotPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dayAvailability, setDayAvailability] = useState<Record<string, { available: boolean }>>({});
  const [loadingAvail, setLoadingAvail] = useState(false);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch(`/api/slots?closerId=${closerId}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch {
      // ignore
    }
  }, [closerId]);

  const fetchAvailability = useCallback(async () => {
    setLoadingAvail(true);
    try {
      const now = new Date();
      const month = (now.getMonth() + 1).toString();
      const year = now.getFullYear().toString();
      const res = await fetch(`/api/profile/availability?userId=${closerId}&month=${month}&year=${year}`);
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
  }, [closerId]);

  useEffect(() => {
    fetchSlots();
    fetchAvailability();
  }, [fetchSlots, fetchAvailability]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSlotsForDate = (date: Date) => {
    return slots.filter((slot) => isSameDay(new Date(slot.startAt), date) && !slot.isBooked);
  };

  const isDayAvailable = (date: Date): boolean => {
    const key = format(date, 'yyyy-MM-dd');
    const avail = dayAvailability[key];
    if (avail !== undefined) {
      return avail.available === true;
    }
    const daySlots = getSlotsForDate(date);
    return daySlots.length > 0;
  };

  const handleDayClick = (day: Date) => {
    if (isSameMonth(day, currentMonth) && isDayAvailable(day)) {
      setSelectedDate(day);
    }
  };

  const handleMonthChange = (next: Date) => {
    setCurrentMonth(next);
    const month = (next.getMonth() + 1).toString();
    const year = next.getFullYear().toString();
    setLoadingAvail(true);
    fetch(`/api/profile/availability?userId=${closerId}&month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.availability) setDayAvailability(data.availability);
      })
      .catch(() => {})
      .finally(() => setLoadingAvail(false));
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button
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
          <div
            key={day}
            className="text-center text-xs font-semibold text-on-surface-variant py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map((day, index) => {
          const daySlots = getSlotsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const available = isDayAvailable(day);

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={!isCurrentMonth || !available}
              className={`
                min-h-[40px] p-1 rounded-lg border text-sm transition-all
                ${
                  !isCurrentMonth
                    ? 'border-transparent opacity-30 cursor-default'
                    : !available
                    ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 cursor-pointer'
                }
              `}
            >
              {format(day, 'd')}
              {!loadingAvail && available && (
                <div className="text-[8px] text-primary font-bold">
                  {daySlots.length > 0 ? daySlots.length : ''}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="pt-4 border-t border-outline-variant/30">
          <h4 className="text-sm font-bold mb-3">
            Horarios disponibles para el {format(selectedDate, 'd de MMMM', { locale: es })}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {getSlotsForDate(selectedDate).length === 0 ? (
              <p className="text-on-surface-variant col-span-full text-center py-4 text-sm">
                No hay horarios disponibles para este dia
              </p>
            ) : (
              getSlotsForDate(selectedDate).map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      onSlotSelect(slot.id);
                      if (onSlotSelectWithDate) onSlotSelectWithDate(slot);
                    }}
                    className={`
                      p-2 rounded-lg border text-sm transition-all
                      ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-semibold">
                        {format(new Date(slot.startAt), 'HH:mm')}
                      </span>
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
