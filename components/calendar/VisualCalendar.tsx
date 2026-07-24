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
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

interface CalendarVisit {
  id: number;
  scheduledAt: string;
  parcel: { id: string; address: string };
  setter: { id: number; name: string };
  closer?: { id: number; name: string } | null;
  stage: string;
  projects?: { projectType: { id: number; name: string } }[];
}

interface VisualCalendarProps {
  visits: CalendarVisit[];
  onVisitSelect?: (visit: CalendarVisit) => void;
  onDayClick?: (date: Date, visits: CalendarVisit[]) => void;
}

export function VisualCalendar({ visits, onVisitSelect, onDayClick }: VisualCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getVisitsForDate = (date: Date) => {
    return visits.filter((v) => v.scheduledAt && isSameDay(new Date(v.scheduledAt), date));
  };

  const handleDayClick = (day: Date) => {
    if (isSameMonth(day, currentMonth)) {
      setSelectedDate(day);
      const dayVisits = getVisitsForDate(day);
      if (onDayClick) {
        onDayClick(day, dayVisits);
      }
    }
  };

  const stageColors: Record<string, string> = {
    IN_PROGRESS: '#3b82f6',
    PROPOSAL_ACCEPTED: '#22c55e',
    PROJECT: '#eab308',
    CLOSED: '#8b5cf6',
    CANCELLED: '#ef4444',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dayVisits = getVisitsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const hasVisits = dayVisits.length > 0;

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
                    : hasVisits
                    ? 'border-primary/40 bg-primary/5 hover:border-primary/60'
                    : isToday
                    ? 'border-gray-300 dark:border-gray-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
                {format(day, 'd')}
              </div>
              {hasVisits && (
                <div className="space-y-0.5">
                  {dayVisits.slice(0, 3).map((v) => (
                    <div
                      key={v.id}
                      className="text-xs truncate px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: (stageColors[v.stage] || '#6b7280') + '20',
                        color: stageColors[v.stage] || '#6b7280',
                        borderLeft: `2px solid ${stageColors[v.stage] || '#6b7280'}`,
                      }}
                      title={`${v.parcel.address} - ${v.setter.name}`}
                    >
                      {v.parcel.address.split(',').slice(0, 2).join(',')}
                    </div>
                  ))}
                  {dayVisits.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                      +{dayVisits.length - 3} más
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4">
            Visitas del {format(selectedDate, 'd de MMMM', { locale: es })}
          </h3>
          <div className="space-y-2">
            {getVisitsForDate(selectedDate).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No hay visitas para este día
              </p>
            ) : (
              getVisitsForDate(selectedDate).map((visit) => (
                <button
                  key={visit.id}
                  onClick={() => onVisitSelect?.(visit)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: stageColors[visit.stage] || '#6b7280' }}
                    />
                    <div>
                      <p className="font-medium text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {visit.parcel.address}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(visit.scheduledAt), 'HH:mm')} — {visit.setter.name}
                        {visit.closer ? ` / ${visit.closer.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: (stageColors[visit.stage] || '#6b7280') + '20',
                      color: stageColors[visit.stage] || '#6b7280',
                    }}
                  >
                    {visit.stage === 'IN_PROGRESS' ? 'Puerta' :
                     visit.stage === 'PROPOSAL_ACCEPTED' ? 'Lead' :
                     visit.stage === 'PROJECT' ? 'Proyecto' :
                     visit.stage === 'CLOSED' ? 'Cerrado' :
                     visit.stage === 'CANCELLED' ? 'Cancelado' : visit.stage}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
