'use client';

import { useState } from 'react';
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
import { ChevronLeft, ChevronRight, Clock, Pencil, Trash2 } from 'lucide-react';

interface WeeklyPattern {
  id: number;
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  slotDuration: number;
  isWorkday: boolean;
}

interface Slot {
  id: number;
  startAt: string;
  endAt: string;
  isBooked: boolean;
  isWorkday?: boolean;
  visit?: {
    id: number;
    parcel: { id: string; address: string };
    setter: { id: number; name: string };
    projects?: { projectType: { id: number; name: string } }[];
  };
}

interface VisualCalendarProps {
  slots: Slot[];
  onSlotSelect?: (slot: Slot) => void;
  selectedSlotId?: number;
  onSlotEdit?: (slot: Slot) => void;
  onSlotDelete?: (slot: Slot) => void;
  patterns?: WeeklyPattern[];
}

export function VisualCalendar({ slots, onSlotSelect, selectedSlotId, onSlotEdit, onSlotDelete, patterns }: VisualCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSlotsForDate = (date: Date) => {
    return slots.filter((slot) => isSameDay(new Date(slot.startAt), date));
  };

  const getPatternsForDay = (date: Date) => {
    if (!patterns || patterns.length === 0) return [];
    return patterns.filter((p) => p.dayOfWeek === date.getDay());
  };

  const handleDayClick = (day: Date) => {
    if (isSameMonth(day, currentMonth)) {
      setSelectedDate(day);
    }
  };

  const handleSlotClick = (slot: Slot) => {
    if (onSlotSelect && !slot.isBooked) {
      onSlotSelect(slot);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header del Calendario */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Días de la Semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del Mes */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const daySlots = getSlotsForDate(day);
          const dayPatterns = getPatternsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasAvailableSlots = daySlots.some((slot) => !slot.isBooked);
          const hasPatterns = dayPatterns.length > 0;

          return (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[80px] p-2 rounded-lg border-2 cursor-pointer transition-all
                ${
                  !isCurrentMonth
                    ? 'border-transparent opacity-30 cursor-default'
                    : isSelected
                    ? 'border-primary bg-primary/10'
                    : hasAvailableSlots
                    ? 'border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              {hasPatterns && (
                <div className="space-y-0.5 mb-1">
                  {dayPatterns.map((p) => {
                    const wInt = Math.max(0, p.endHour - p.startHour);
                    const width = Math.min(100, wInt * 100 / 14);
                    return (
                      <div
                        key={p.id}
                        className="h-1 rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: p.isWorkday ? "#f48221" : "#9CA3AF",
                          opacity: 0.8,
                        }}
                        title={`${p.startHour}:00 - ${p.endHour}:00 (${p.slotDuration}min)`}
                      />
                    );
                  })}
                </div>
              )}
              {daySlots.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {daySlots.filter((s) => !s.isBooked).length} disp.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Slots del Día Seleccionado */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4">
            Horarios disponibles para el {format(selectedDate, 'd de MMMM', { locale: es })}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {getSlotsForDate(selectedDate).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-4">
                No hay horarios disponibles para este día
              </p>
            ) : (
              getSlotsForDate(selectedDate).map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => handleSlotClick(slot)}
                    disabled={slot.isBooked}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-center
                      ${
                        slot.isBooked
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50'
                          : isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">
                        {format(new Date(slot.startAt), 'HH:mm')}
                      </span>
                    </div>
                    <div className="text-xs">
                      {slot.isBooked ? 'Reservado' : 'Disponible'}
                    </div>
                    {(onSlotEdit || onSlotDelete) && !slot.isBooked && (
                      <div className="flex gap-1 mt-2 justify-center">
                        {onSlotEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSlotEdit(slot);
                            }}
                            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onSlotDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSlotDelete(slot);
                            }}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
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
