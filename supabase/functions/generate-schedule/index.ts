import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationRequest {
  siteId: string;
  startDate: string;
  endDate: string;
  period: 'week' | 'biweek' | 'month';
  prioritizeVeterans: boolean;
  respectConflicts: boolean;
  maxHoursPerDay: number;
  minRestBetweenShifts: number;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  experience_level: 'NOUVEAU' | 'VETERANE' | 'MANAGER';
  weekly_hours: number;
  active: boolean;
}

interface OpeningHours {
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
}

interface WorkPreference {
  employee_id: string;
  day_of_week: number;
  preference: 'AVAILABLE' | 'PREFERRED' | 'UNAVAILABLE';
  preferred_start_time?: string;
  preferred_end_time?: string;
  max_hours_per_day: number;
}

interface Relationship {
  employee_1_id: string;
  employee_2_id: string;
  relationship_type: 'CONFLICT' | 'PREFERENCE' | 'MENTOR_MENTEE';
}

Deno.serve(async (req) => {
  console.log('Schedule generation function invoked');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Parse request body
    const body: GenerationRequest = await req.json();
    console.log('Generation request:', body);

    // Fetch required data
    const [employeesRes, openingHoursRes, preferencesRes, relationshipsRes] = await Promise.all([
      supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true),
      supabase
        .from('site_opening_hours')
        .select('*')
        .eq('site_id', body.siteId),
      supabase
        .from('employee_work_preferences')
        .select('*'),
      supabase
        .from('employee_relationships')
        .select('*')
    ]);

    if (employeesRes.error) throw employeesRes.error;
    if (openingHoursRes.error) throw openingHoursRes.error;
    if (preferencesRes.error) throw preferencesRes.error;
    if (relationshipsRes.error) throw relationshipsRes.error;

    const employees: Employee[] = employeesRes.data || [];
    const openingHours: OpeningHours[] = openingHoursRes.data || [];
    const preferences: WorkPreference[] = preferencesRes.data || [];
    const relationships: Relationship[] = relationshipsRes.data || [];

    console.log(`Found ${employees.length} employees, ${openingHours.length} opening hours, ${preferences.length} preferences, ${relationships.length} relationships`);

    // Generate optimized schedule
    const schedule = generateOptimizedSchedule({
      employees,
      openingHours,
      preferences,
      relationships,
      ...body
    });

    // Save generated shifts to database
    const shiftsToCreate = schedule.map(shift => ({
      site_id: body.siteId,
      date: shift.date,
      start_time: shift.startTime,
      end_time: shift.endTime,
      requirements: {
        minEmployees: shift.minEmployees,
        maxEmployees: shift.maxEmployees,
        requiredSkills: []
      },
      status: 'DRAFT'
    }));

    if (shiftsToCreate.length > 0) {
      const { data: createdShifts, error: shiftsError } = await supabase
        .from('shifts')
        .insert(shiftsToCreate)
        .select();

      if (shiftsError) throw shiftsError;

      // Create assignments
      const assignmentsToCreate = [];
      for (let i = 0; i < schedule.length; i++) {
        const shift = schedule[i];
        const createdShift = createdShifts[i];
        
        for (const employeeId of shift.assignedEmployees) {
          assignmentsToCreate.push({
            shift_id: createdShift.id,
            employee_id: employeeId,
            status: 'CONFIRMED',
            role: 'Associate'
          });
        }
      }

      if (assignmentsToCreate.length > 0) {
        const { error: assignmentsError } = await supabase
          .from('assignments')
          .insert(assignmentsToCreate);

        if (assignmentsError) throw assignmentsError;
      }
    }

    // Log generation request
    await supabase
      .from('schedule_generation_requests')
      .insert({
        site_id: body.siteId,
        start_date: body.startDate,
        end_date: body.endDate,
        status: 'COMPLETED',
        generated_by: user.id,
        generation_parameters: body
      });

    console.log(`Generated ${schedule.length} shifts with ${schedule.reduce((sum, s) => sum + s.assignedEmployees.length, 0)} total assignments`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        shiftsCreated: schedule.length,
        assignmentsCreated: schedule.reduce((sum, s) => sum + s.assignedEmployees.length, 0)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Schedule generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateOptimizedSchedule(data: {
  employees: Employee[];
  openingHours: OpeningHours[];
  preferences: WorkPreference[];
  relationships: Relationship[];
  siteId: string;
  startDate: string;
  endDate: string;
  prioritizeVeterans: boolean;
  respectConflicts: boolean;
  maxHoursPerDay: number;
}): any[] {
  const shifts = [];
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  
  // Get conflicts for quick lookup
  const conflicts = new Set();
  data.relationships
    .filter(r => r.relationship_type === 'CONFLICT')
    .forEach(r => {
      conflicts.add(`${r.employee_1_id}-${r.employee_2_id}`);
      conflicts.add(`${r.employee_2_id}-${r.employee_1_id}`);
    });

  // Get mentor relationships
  const mentorRelations = new Map();
  data.relationships
    .filter(r => r.relationship_type === 'MENTOR_MENTEE')
    .forEach(r => {
      if (!mentorRelations.has(r.employee_1_id)) {
        mentorRelations.set(r.employee_1_id, []);
      }
      mentorRelations.get(r.employee_1_id).push(r.employee_2_id);
    });

  // Categorize employees
  const nouveaux = data.employees.filter(e => e.experience_level === 'NOUVEAU');
  const veterans = data.employees.filter(e => e.experience_level === 'VETERANE');
  const managers = data.employees.filter(e => e.experience_level === 'MANAGER');

  console.log(`Employee distribution: ${nouveaux.length} nouveaux, ${veterans.length} vétérans, ${managers.length} managers`);

  // Generate shifts for each day
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const dateStr = d.toISOString().split('T')[0];
    
    const openingHour = data.openingHours.find(h => h.day_of_week === dayOfWeek);
    if (!openingHour || openingHour.is_closed) {
      continue;
    }

    // Calculate shift requirements
    const openTime = openingHour.opening_time;
    const closeTime = openingHour.closing_time;
    const shiftDuration = 8; // 8 hour shifts
    
    // Create morning and afternoon shifts if needed
    const openHour = parseInt(openTime.split(':')[0]);
    const closeHour = parseInt(closeTime.split(':')[0]);
    const totalHours = closeHour - openHour;
    
    if (totalHours >= shiftDuration) {
      // Morning shift
      const morningEndHour = Math.min(openHour + shiftDuration, closeHour);
      const morningShift = createOptimalShift({
        date: dateStr,
        startTime: openTime,
        endTime: `${morningEndHour.toString().padStart(2, '0')}:00`,
        dayOfWeek,
        employees: data.employees,
        nouveaux,
        veterans,
        managers,
        conflicts,
        mentorRelations,
        preferences: data.preferences,
        prioritizeVeterans: data.prioritizeVeterans,
        respectConflicts: data.respectConflicts
      });
      
      if (morningShift) {
        shifts.push(morningShift);
      }

      // Afternoon shift if there's enough time
      if (totalHours >= shiftDuration * 1.5) {
        const afternoonStartHour = Math.max(openHour + 4, morningEndHour - 2); // 2h overlap
        const afternoonShift = createOptimalShift({
          date: dateStr,
          startTime: `${afternoonStartHour.toString().padStart(2, '0')}:00`,
          endTime: closeTime,
          dayOfWeek,
          employees: data.employees,
          nouveaux,
          veterans,
          managers,
          conflicts,
          mentorRelations,
          preferences: data.preferences,
          prioritizeVeterans: data.prioritizeVeterans,
          respectConflicts: data.respectConflicts
        });
        
        if (afternoonShift) {
          shifts.push(afternoonShift);
        }
      }
    }
  }

  return shifts;
}

function createOptimalShift(params: {
  date: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  employees: Employee[];
  nouveaux: Employee[];
  veterans: Employee[];
  managers: Employee[];
  conflicts: Set<string>;
  mentorRelations: Map<string, string[]>;
  preferences: WorkPreference[];
  prioritizeVeterans: boolean;
  respectConflicts: boolean;
}): any | null {
  const assignedEmployees = [];
  const minEmployees = 2;
  const maxEmployees = 4;

  // Filter available employees for this day
  const availableEmployees = params.employees.filter(emp => {
    const pref = params.preferences.find(p => 
      p.employee_id === emp.id && p.day_of_week === params.dayOfWeek
    );
    return !pref || pref.preference !== 'UNAVAILABLE';
  });

  if (availableEmployees.length < minEmployees) {
    console.log(`Not enough available employees for ${params.date} ${params.startTime}`);
    return null;
  }

  // Prioritize assignment strategy
  if (params.prioritizeVeterans) {
    // Try to assign veterans with nouveaux
    const availableVeterans = params.veterans.filter(v => availableEmployees.includes(v));
    const availableNouveaux = params.nouveaux.filter(n => availableEmployees.includes(n));
    const availableManagers = params.managers.filter(m => availableEmployees.includes(m));

    // Assign pairs: veteran + nouveau
    const pairs = [];
    for (let i = 0; i < Math.min(availableVeterans.length, availableNouveaux.length); i++) {
      const veteran = availableVeterans[i];
      const nouveau = availableNouveaux[i];
      
      // Check for conflicts
      if (params.respectConflicts && params.conflicts.has(`${veteran.id}-${nouveau.id}`)) {
        continue;
      }
      
      pairs.push([veteran, nouveau]);
    }

    // Add pairs to assignment
    for (const pair of pairs) {
      if (assignedEmployees.length + 2 <= maxEmployees) {
        assignedEmployees.push(...pair);
      }
    }

    // Fill remaining slots with managers or other veterans
    const remaining = [...availableManagers, ...availableVeterans].filter(emp => 
      !assignedEmployees.includes(emp)
    );
    
    for (const emp of remaining) {
      if (assignedEmployees.length >= maxEmployees) break;
      
      // Check conflicts with already assigned employees
      const hasConflict = params.respectConflicts && assignedEmployees.some(assigned => 
        params.conflicts.has(`${emp.id}-${assigned.id}`)
      );
      
      if (!hasConflict) {
        assignedEmployees.push(emp);
      }
    }
  } else {
    // Simple assignment by preference
    const preferredEmployees = availableEmployees.filter(emp => {
      const pref = params.preferences.find(p => 
        p.employee_id === emp.id && p.day_of_week === params.dayOfWeek
      );
      return pref && pref.preference === 'PREFERRED';
    });

    // Start with preferred employees
    for (const emp of preferredEmployees) {
      if (assignedEmployees.length >= maxEmployees) break;
      
      const hasConflict = params.respectConflicts && assignedEmployees.some(assigned => 
        params.conflicts.has(`${emp.id}-${assigned.id}`)
      );
      
      if (!hasConflict) {
        assignedEmployees.push(emp);
      }
    }

    // Fill with other available employees
    for (const emp of availableEmployees) {
      if (assignedEmployees.length >= maxEmployees) break;
      if (assignedEmployees.includes(emp)) continue;
      
      const hasConflict = params.respectConflicts && assignedEmployees.some(assigned => 
        params.conflicts.has(`${emp.id}-${assigned.id}`)
      );
      
      if (!hasConflict) {
        assignedEmployees.push(emp);
      }
    }
  }

  if (assignedEmployees.length < minEmployees) {
    console.log(`Not enough employees assigned for ${params.date} ${params.startTime}: ${assignedEmployees.length}`);
    return null;
  }

  return {
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
    minEmployees,
    maxEmployees,
    assignedEmployees: assignedEmployees.map(e => e.id)
  };
}