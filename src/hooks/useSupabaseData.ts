import { useState, useEffect } from 'react';
import type { Employee, Site, Shift, Assignment, EmployeeStatus, ContractType, EmployeeLeave } from '@/types/scheduling';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [
          employeeStatusesRes,
          sitesRes,
          employeesRes,
          shiftsRes,
          leavesRes
        ] = await Promise.all([
          supabase.from('employee_statuses').select('*'),
          supabase.from('sites').select('*').eq('active', true),
          supabase.from('employees').select(`
            *,
            employee_statuses (*)
          `).eq('active', true).eq('archived', false),
          supabase.from('shifts').select(`
            *,
            assignments (
              *,
              employees (*)
            )
          `),
          supabase.from('employee_leaves').select('*')
        ]);

        if (employeeStatusesRes.error) throw employeeStatusesRes.error;
        if (sitesRes.error) throw sitesRes.error;
        if (employeesRes.error) throw employeesRes.error;
        if (shiftsRes.error) throw shiftsRes.error;
        if (leavesRes.error) throw leavesRes.error;

        // Transform employee statuses
        const transformedStatuses: EmployeeStatus[] = employeeStatusesRes.data?.map(status => ({
          id: status.id,
          code: status.code,
          label: status.label,
          hoursLimits: status.hours_limits as { weekly: number; monthly: number; yearly: number; },
          isStudent: status.is_student,
          color: status.color
        })) || [];

        // Transform sites
        const transformedSites: Site[] = sitesRes.data?.map(site => ({
          id: site.id,
          code: site.code,
          name: site.name,
          address: site.address,
          contactInfo: site.contact_info as { phone?: string; email?: string; },
          openingHours: site.opening_hours as { [day: string]: { start: string; end: string } },
          managerId: site.manager_id,
          capacity: site.capacity,
          active: site.active
        })) || [];

        // Transform employees
        const transformedEmployees: Employee[] = employeesRes.data?.map(emp => ({
          id: emp.id,
          employeeNumber: emp.employee_number,
          firstName: emp.first_name,
          lastName: emp.last_name,
          email: emp.email,
          phone: emp.phone || '',
          birthDate: emp.birth_date,
          status: transformedStatuses.find(s => s.id === emp.status_id) || transformedStatuses[0],
          contractType: emp.contract_type as ContractType,
          hourlyRate: parseFloat(emp.hourly_rate?.toString() || '0') || 0,
          weeklyHours: emp.weekly_hours || 0,
          photoUrl: emp.photo_url,
          color: emp.color || '#3B82F6',
          active: emp.active,
          language: emp.language as 'FR' | 'NL' | 'EN',
          experience_level: emp.experience_level as 'NOUVEAU' | 'VETERANE' | 'MANAGER' || 'NOUVEAU',
          hire_date: emp.hire_date,
          annualLeaveDays: emp.annual_leave_days || 25,
          sickLeaveDays: emp.sick_leave_days || 10,
          currentYear: emp.current_year || new Date().getFullYear()
        })) || [];

        // Transform shifts
        const transformedShifts: Shift[] = shiftsRes.data?.map(shift => ({
          id: shift.id,
          siteId: shift.site_id,
          date: shift.date,
          startTime: shift.start_time,
          endTime: shift.end_time,
          requirements: shift.requirements as { minEmployees: number; maxEmployees: number; requiredSkills?: string[]; } || { minEmployees: 1, maxEmployees: 5 },
          status: shift.status as 'DRAFT' | 'OPEN' | 'CLOSED' | 'PUBLISHED' | 'COMPLETED',
          assignments: shift.assignments?.map((assignment: any) => ({
            id: assignment.id,
            shiftId: shift.id,
            employeeId: assignment.employee_id,
            status: assignment.status as 'PROPOSED' | 'CONFIRMED' | 'DECLINED',
            role: assignment.role || 'Associate',
            score: assignment.score || 0
          })) || []
        })) || [];

        // Transform leaves
        const transformedLeaves: EmployeeLeave[] = leavesRes.data?.map(leave => ({
          id: leave.id,
          employeeId: leave.employee_id,
          leaveType: leave.leave_type as EmployeeLeave['leaveType'],
          startDate: leave.start_date,
          endDate: leave.end_date,
          daysCount: leave.days_count,
          status: leave.status as EmployeeLeave['status'],
          reason: leave.reason,
          approvedBy: leave.approved_by,
          approvedAt: leave.approved_at,
          createdAt: leave.created_at,
          updatedAt: leave.updated_at
        })) || [];

        setEmployeeStatuses(transformedStatuses);
        setSites(transformedSites);
        setEmployees(transformedEmployees);
        setShifts(transformedShifts);
        setLeaves(transformedLeaves);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [user]);

  const findOrCreateDraftShift = async (date: string, startTime: string = '09:00', siteId?: string) => {
    try {
      // Chercher un shift DRAFT existant pour cette date
      const existingDraft = shifts.find(shift => 
        shift.date === date && shift.status === 'DRAFT'
      );

      if (existingDraft) {
        return existingDraft;
      }

      // Si pas de site spécifié, prendre le premier site disponible
      const targetSiteId = siteId || (sites.length > 0 ? sites[0].id : '');
      if (!targetSiteId) {
        throw new Error('Aucun site disponible');
      }

      // Créer un nouveau shift DRAFT
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          site_id: targetSiteId,
          date: date,
          start_time: startTime,
          end_time: '18:00', // Heure de fin par défaut
          requirements: { minEmployees: 1, maxEmployees: 10 },
          status: 'DRAFT'
        })
        .select()
        .single();

      if (error) throw error;

      const newShift: Shift = {
        id: data.id,
        siteId: targetSiteId,
        date: date,
        startTime: startTime,
        endTime: '18:00',
        requirements: { minEmployees: 1, maxEmployees: 10 },
        status: 'DRAFT',
        assignments: []
      };

      setShifts(prev => [...prev, newShift]);
      return newShift;
    } catch (err) {
      console.error('Error finding or creating draft shift:', err);
      throw err;
    }
  };

  const addShift = async (newShift: Omit<Shift, 'id' | 'assignments'>) => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          site_id: newShift.siteId,
          date: newShift.date,
          start_time: newShift.startTime,
          end_time: newShift.endTime,
          requirements: newShift.requirements,
          status: newShift.status
        })
        .select()
        .single();

      if (error) throw error;

      const transformedShift: Shift = {
        ...newShift,
        id: data.id,
        assignments: []
      };

      setShifts(prev => [...prev, transformedShift]);
      return transformedShift;
    } catch (err) {
      console.error('Error adding shift:', err);
      throw err;
    }
  };

  const assignEmployeeToShift = async (shiftId: string, employeeId: string) => {
    try {
      // Vérifier si l'employé est déjà assigné à ce shift
      const existingAssignment = shifts
        .find(s => s.id === shiftId)
        ?.assignments.find(a => a.employeeId === employeeId);

      if (existingAssignment) {
        console.log('Employee already assigned to this shift');
        return existingAssignment;
      }

      const { data, error } = await supabase
        .from('assignments')
        .insert({
          shift_id: shiftId,
          employee_id: employeeId,
          status: 'CONFIRMED',
          role: 'Associate'
        })
        .select()
        .single();

      if (error) throw error;

      const newAssignment: Assignment = {
        id: data.id,
        shiftId,
        employeeId,
        status: 'CONFIRMED',
        role: 'Associate',
        score: 0
      };

      setShifts(prev => prev.map(shift => 
        shift.id === shiftId 
          ? { ...shift, assignments: [...shift.assignments, newAssignment] }
          : shift
      ));

      return newAssignment;
    } catch (err) {
      console.error('Error assigning employee:', err);
      throw err;
    }
  };

  const removeEmployeeFromShift = async (shiftId: string, employeeId: string) => {
    try {
      // Trouver l'assignment à supprimer
      const shift = shifts.find(s => s.id === shiftId);
      const assignment = shift?.assignments.find(a => a.employeeId === employeeId);
      
      if (!assignment) {
        console.log('Assignment not found');
        return;
      }

      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setShifts(prev => prev.map(s => 
        s.id === shiftId 
          ? { ...s, assignments: s.assignments.filter(a => a.employeeId !== employeeId) }
          : s
      ));

      console.log('Employee removed from shift successfully');
    } catch (err) {
      console.error('Error removing employee from shift:', err);
      throw err;
    }
  };

  const addEmployeeToDraft = async (date: string, employeeId: string, startTime?: string) => {
    try {
      const draftShift = await findOrCreateDraftShift(date, startTime);
      return await assignEmployeeToShift(draftShift.id, employeeId);
    } catch (err) {
      console.error('Error adding employee to draft:', err);
      throw err;
    }
  };

  const refreshData = async () => {
    if (!user) return;
    
    // Re-fetch all data
    setLoading(true);
    try {
        const [
          employeeStatusesRes,
          sitesRes,
          employeesRes,
          shiftsRes,
          leavesRes
        ] = await Promise.all([
          supabase.from('employee_statuses').select('*'),
          supabase.from('sites').select('*').eq('active', true),
          supabase.from('employees').select(`
            *,
            employee_statuses (*)
          `).eq('active', true).eq('archived', false),
          supabase.from('shifts').select(`
            *,
            assignments (
              *,
              employees (*)
            )
          `),
          supabase.from('employee_leaves').select('*')
        ]);

      if (employeeStatusesRes.error) throw employeeStatusesRes.error;
      if (sitesRes.error) throw sitesRes.error;
      if (employeesRes.error) throw employeesRes.error;
      if (shiftsRes.error) throw shiftsRes.error;
      if (leavesRes.error) throw leavesRes.error;

      // Transform employee statuses
      const transformedStatuses: EmployeeStatus[] = employeeStatusesRes.data?.map(status => ({
        id: status.id,
        code: status.code,
        label: status.label,
        hoursLimits: status.hours_limits as { weekly: number; monthly: number; yearly: number; },
        isStudent: status.is_student,
        color: status.color
      })) || [];

      // Transform leaves
      const transformedLeaves: EmployeeLeave[] = leavesRes.data?.map(leave => ({
        id: leave.id,
        employeeId: leave.employee_id,
        leaveType: leave.leave_type as EmployeeLeave['leaveType'],
        startDate: leave.start_date,
        endDate: leave.end_date,
        daysCount: leave.days_count,
        status: leave.status as EmployeeLeave['status'],
        reason: leave.reason,
        approvedBy: leave.approved_by,
        approvedAt: leave.approved_at,
        createdAt: leave.created_at,
        updatedAt: leave.updated_at
      })) || [];

      // Transform sites
      const transformedSites: Site[] = sitesRes.data?.map(site => ({
        id: site.id,
        code: site.code,
        name: site.name,
        address: site.address,
        contactInfo: site.contact_info as { phone?: string; email?: string; },
        openingHours: site.opening_hours as { [day: string]: { start: string; end: string } },
        managerId: site.manager_id,
        capacity: site.capacity,
        active: site.active
      })) || [];

      // Transform employees
      const transformedEmployees: Employee[] = employeesRes.data?.map(emp => ({
        id: emp.id,
        employeeNumber: emp.employee_number,
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.email,
        phone: emp.phone || '',
        birthDate: emp.birth_date,
        status: transformedStatuses.find(s => s.id === emp.status_id) || transformedStatuses[0],
        contractType: emp.contract_type as ContractType,
        hourlyRate: parseFloat(emp.hourly_rate?.toString() || '0') || 0,
        weeklyHours: emp.weekly_hours || 0,
        photoUrl: emp.photo_url,
        color: emp.color || '#3B82F6',
        active: emp.active,
        language: emp.language as 'FR' | 'NL' | 'EN',
        experience_level: emp.experience_level as 'NOUVEAU' | 'VETERANE' | 'MANAGER' || 'NOUVEAU',
        hire_date: emp.hire_date,
        annualLeaveDays: emp.annual_leave_days || 25,
        sickLeaveDays: emp.sick_leave_days || 10,
        currentYear: emp.current_year || new Date().getFullYear()
      })) || [];

      // Transform shifts
      const transformedShifts: Shift[] = shiftsRes.data?.map(shift => ({
        id: shift.id,
        siteId: shift.site_id,
        date: shift.date,
        startTime: shift.start_time,
        endTime: shift.end_time,
        requirements: shift.requirements as { minEmployees: number; maxEmployees: number; requiredSkills?: string[]; } || { minEmployees: 1, maxEmployees: 5 },
        status: shift.status as 'DRAFT' | 'OPEN' | 'CLOSED' | 'PUBLISHED' | 'COMPLETED',
        assignments: shift.assignments?.map((assignment: any) => ({
          id: assignment.id,
          shiftId: shift.id,
          employeeId: assignment.employee_id,
          status: assignment.status as 'PROPOSED' | 'CONFIRMED' | 'DECLINED',
          role: assignment.role || 'Associate',
          score: assignment.score || 0
        })) || []
      })) || [];

      setEmployeeStatuses(transformedStatuses);
      setSites(transformedSites);
      setEmployees(transformedEmployees);
      setShifts(transformedShifts);
      setLeaves(transformedLeaves);
      
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour les horaires d'un shift
  const updateShiftTime = async (shiftId: string, startTime: string, endTime: string) => {
    try {
      const { error } = await supabase
        .from('shifts')
        .update({ 
          start_time: startTime, 
          end_time: endTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId);

      if (error) throw error;

      // Mettre à jour localement
      setShifts(prev => prev.map(shift => 
        shift.id === shiftId 
          ? { ...shift, startTime, endTime }
          : shift
      ));

      console.log('Shift time updated successfully');
    } catch (error) {
      console.error('Error updating shift time:', error);
      throw error;
    }
  };

  // Fonction pour archiver un employé
  const archiveEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase.rpc('archive_employee', {
        employee_id: employeeId
      });

      if (error) throw error;

      // Retirer l'employé de la liste locale
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));

      console.log('Employee archived successfully');
    } catch (error) {
      console.error('Error archiving employee:', error);
      throw error;
    }
  };

  return {
    employees,
    sites,
    shifts,
    employeeStatuses,
    leaves,
    loading,
    error,
    addShift,
    assignEmployeeToShift,
    removeEmployeeFromShift,
    addEmployeeToDraft,
    updateShiftTime,
    archiveEmployee,
    refreshData
  };
};