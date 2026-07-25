'use client';

import { useState, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

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
}

export function SlotPicker({ closerId, selectedSlotId, onSlotSelect }: SlotPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    fetchSlots();
  }, [closerId]);

  const fetchSlots = async () => {
    try {
      const res = await fetch(`/api/slots?closerId=${closerId}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSlotsForDate = (date: Date) => {
    return slots.filter((slot) => isSameDay(new Date(slot.startAt), date) && !slot.isBooked);
  };

  const handleDayClick = (day: Date) => {
    if (isSameMonth(day, currentMonth)) {
      setSelectedDate(day);
    }
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-4">
      {/* Header del Calendario */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Días de la Semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-on-surface-variant py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del Mes */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map((day, index) => {
          const daySlots = getSlotsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasAvailableSlots = daySlots.length > 0;

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={!isCurrentMonth || !hasAvailableSlots}
              className={`
                min-h-[40px] p-1 rounded-lg border text-sm transition-all
                ${
                  !isCurrentMonth
                    ? 'border-transparent opacity-30 cursor-default'
                    : !hasAvailableSlots
                    ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 cursor-pointer'
                }
              `}
            >
              {format(day, 'd')}
              {hasAvailableSlots && (
                <div className="text-[8px] text-primary font-bold">
                  {daySlots.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Slots del Día Seleccionado */}
      {selectedDate && (
        <div className="pt-4 border-t border-outline-variant/30">
          <h4 className="text-sm font-bold mb-3">
            Horarios disponibles para el {format(selectedDate, 'd de MMMM', { locale: es })}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {getSlotsForDate(selectedDate).length === 0 ? (
              <p className="text-on-surface-variant col-span-full text-center py-4 text-sm">
                No hay horarios disponibles para este día
              </p>
            ) : (
              getSlotsForDate(selectedDate).map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => onSlotSelect(slot.id)}
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
