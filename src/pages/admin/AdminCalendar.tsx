import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EVENT_COLORS: Record<string, string> = {
  filing_target: 'bg-blue-500',
  opposition_deadline: 'bg-red-500',
  office_action_response: 'bg-orange-500',
  renewal_deadline: 'bg-purple-500',
  registration_date: 'bg-green-500',
  custom: 'bg-gray-500',
  impi_publication: 'bg-teal-500',
};

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deadlines, setDeadlines] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('docket_deadlines')
      .select('*, applications(case_number)')
      .neq('status', 'cancelled')
      .then(({ data }) => setDeadlines(data || []));
  }, []);

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const getDeadlinesForDay = (day: Date) =>
    deadlines.filter(d => isSameDay(parseISO(d.due_date), day));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold text-navy-900 text-sm">{format(currentDate, 'MMMM yyyy')}</span>
          <button
            onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(EVENT_COLORS).slice(0, 5).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-gray-500">{type.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells before start */}
          {Array.from({ length: start.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-gray-100 min-h-24 p-1 bg-gray-50/50" />
          ))}
          {days.map(day => {
            const events = getDeadlinesForDay(day);
            const inMonth = isSameMonth(day, currentDate);
            return (
              <div
                key={day.toISOString()}
                className={`border-b border-r border-gray-100 min-h-24 p-1.5 ${
                  !inMonth ? 'bg-gray-50/50' :
                  isToday(day) ? 'bg-gold-50' : 'bg-white'
                }`}
              >
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday(day) ? 'bg-gold-500 text-white' : 'text-gray-600'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {events.slice(0, 3).map(e => (
                    <div
                      key={e.id}
                      title={`${e.applications?.case_number}: ${e.title}`}
                      className={`text-white text-xs px-1.5 py-0.5 rounded truncate ${EVENT_COLORS[e.deadline_type] || 'bg-gray-500'}`}
                    >
                      {e.title.length > 12 ? e.title.slice(0, 12) + '…' : e.title}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-gray-400 pl-1">+{events.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
