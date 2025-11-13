import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type { Employee } from '@/types/scheduling';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface EmployeeScheduleCalendarProps {
  employee: Employee;
}

export const EmployeeScheduleCalendar = ({ employee }: EmployeeScheduleCalendarProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScheduleData();
  }, [employee]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      
      // Load shifts for this employee
      const { data: shifts } = await supabase
        .from('shifts')
        .select(`
          *,
          assignments!inner (
            id,
            employee_id,
            status
          ),
          sites (name)
        `)
        .eq('assignments.employee_id', employee.id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
        .lte('date', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Next 60 days

      // Load leaves
      const { data: leaves } = await supabase
        .from('employee_leaves')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('start_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('end_date', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Load exam periods if student
      let examPeriods: any[] = [];
      if (employee.status.isStudent) {
        const { data: exams } = await supabase
          .from('exam_periods')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('start_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .lte('end_date', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        examPeriods = exams || [];
      }

      // Transform data to calendar events
      const calendarEvents = [
        // Shifts
        ...(shifts || []).map(shift => ({
          id: shift.id,
          title: `Shift - ${shift.sites?.name || 'Site'}`,
          start: new Date(`${shift.date}T${shift.start_time}`),
          end: new Date(`${shift.date}T${shift.end_time}`),
          resource: { type: 'shift', data: shift },
          style: { backgroundColor: '#3b82f6' }
        })),
        
        // Leaves
        ...(leaves || []).map(leave => ({
          id: leave.id,
          title: `Congé - ${leave.leave_type}`,
          start: new Date(leave.start_date),
          end: new Date(leave.end_date),
          allDay: true,
          resource: { type: 'leave', data: leave },
          style: { backgroundColor: '#ef4444' }
        })),
        
        // Exam periods
        ...examPeriods.map(exam => ({
          id: exam.id,
          title: `Examens - ${exam.description || 'Période d\'examens'}`,
          start: new Date(exam.start_date),
          end: new Date(exam.end_date),
          allDay: true,
          resource: { type: 'exam', data: exam },
          style: { backgroundColor: '#f59e0b' }
        }))
      ];

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event: any) => {
    return {
      style: event.style
    };
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Chargement du planning...</div>;
  }

  return (
    <div className="h-96">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        eventPropGetter={eventStyleGetter}
        culture="fr"
        messages={{
          today: "Aujourd'hui",
          previous: "Précédent",
          next: "Suivant",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          agenda: "Agenda",
          noEventsInRange: "Aucun événement dans cette période"
        }}
      />
    </div>
  );
};