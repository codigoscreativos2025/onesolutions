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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from "@/lib/locale-context";

interface CalendarVisit {
  id: number;
  scheduledAt: string;
  parcel: { id: string; address: string; ownerName: string | null };
  setter: { id: number; name: string };
  closer?: { id: number; name: string } | null;
  stage: string;
  projects?: { projectType: { id: number; name: string } }[];
  bill?: { clientName: string | null } | null;
}

interface VisualCalendarProps {
  visits: CalendarVisit[];
  onDayClick?: (date: string, dayVisits: CalendarVisit[]) => void;
  dayAvailability?: Record<string, { available: boolean; ranges: { start: string; end: string }[] }>;
  onMonthChange?: (date: Date) => void;
}

function formatTimeAMPM(dateStr: string): string {
  const d = new Date(dateStr);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function VisualCalendar({ visits, onDayClick, dayAvailability, onMonthChange }: VisualCalendarProps) {
  const { t } = useLocale();
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
        onDayClick(format(day, "yyyy-MM-dd"), dayVisits);
      }
    }
  };

  const getAvailabilityForDate = (date: Date): boolean | null => {
    if (!dayAvailability || !isSameMonth(date, currentMonth)) return null;
    const key = format(date, 'yyyy-MM-dd');
    const val = dayAvailability[key];
    if (typeof val === 'boolean') return val;
    if (val && typeof val === 'object') return val.available;
    return null;
  };

  const stageColors: Record<string, string> = {
    IN_PROGRESS: '#3b82f6',
    PROPOSAL_ACCEPTED: '#22c55e',
    PROJECT: '#eab308',
    CLOSED: '#8b5cf6',
    CANCELLED: '#ef4444',
  };

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => handleMonthChange(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <button
          onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
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
          const avail = getAvailabilityForDate(day);
          const isAvailable = avail !== false;

          return (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[90px] p-2 rounded-lg border-2 cursor-pointer transition-all relative
                ${
                  !isCurrentMonth
                    ? 'border-transparent opacity-30 cursor-default'
                    : isSelected
                    ? 'border-primary bg-primary/10'
                    : hasVisits
                    ? 'border-yellow-300 bg-yellow-100 hover:border-yellow-400'
                    : avail === true
                    ? 'border-green-200 bg-green-50 hover:border-green-300'
                    : avail === false
                    ? 'border-red-200 bg-red-50 hover:border-red-300'
                    : isToday
                    ? 'border-gray-300 dark:border-gray-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`text-sm font-medium ${isToday ? 'bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
                  {format(day, 'd')}
                </div>
                {isCurrentMonth && avail !== null && (
                  <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} title={isAvailable ? t.map.available : t.visit.notAvailable} />
                )}
              </div>
              <div className="flex items-center gap-1">
                {isCurrentMonth && avail !== null && (
                  <span className={`text-[10px] leading-tight ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {isAvailable ? 'Disp.' : 'No Disp.'}
                  </span>
                )}
              </div>
              {hasVisits && (
                <div className="space-y-0.5">
                  {dayVisits.slice(0, 3).map((v) => {
                    const ownerName = v.bill?.clientName || v.parcel.ownerName || v.parcel.address;
                    return (
                      <div
                        key={v.id}
                        className="text-xs truncate px-1 py-0.5 rounded"
                        style={{
                          backgroundColor: (stageColors[v.stage] || '#6b7280') + '20',
                          color: stageColors[v.stage] || '#6b7280',
                          borderLeft: `2px solid ${stageColors[v.stage] || '#6b7280'}`,
                        }}
                        title={`${ownerName} - ${v.setter.name} - ${formatTimeAMPM(v.scheduledAt)}`}
                      >
                        {formatTimeAMPM(v.scheduledAt)} {ownerName.split(',')[0].split(' ').slice(0, 2).join(' ')}
                      </div>
                    );
                  })}
                  {dayVisits.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                      +{dayVisits.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
