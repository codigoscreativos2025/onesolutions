'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'date' | 'daterange';
  options?: FilterOption[];
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string>;
  onFilterChange: (filterId: string, value: string) => void;
  onClearAll: () => void;
}

export function AdvancedFilters({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Object.values(activeFilters).some((v) => v && v !== 'all');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filtros Avanzados
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                {Object.values(activeFilters).filter((v) => v && v !== 'all').length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {isOpen && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.id}>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  {filter.label}
                </label>
                {filter.type === 'select' && filter.options && (
                  <select
                    value={activeFilters[filter.id] || 'all'}
                    onChange={(e) => onFilterChange(filter.id, e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                  >
                    <option value="all">Todos</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={activeFilters[filter.id] || ''}
                    onChange={(e) => onFilterChange(filter.id, e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                  />
                )}
                {filter.type === 'daterange' && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      placeholder="Desde"
                      value={activeFilters[`${filter.id}_from`] || ''}
                      onChange={(e) => onFilterChange(`${filter.id}_from`, e.target.value)}
                      className="flex-1 h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                    />
                    <input
                      type="date"
                      placeholder="Hasta"
                      value={activeFilters[`${filter.id}_to`] || ''}
                      onChange={(e) => onFilterChange(`${filter.id}_to`, e.target.value)}
                      className="flex-1 h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
