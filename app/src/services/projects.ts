import { createClient, createAdminClient } from '@/lib/supabase/server';
import { type Project } from '@/lib/schemas';
import { geocodeAddress } from './geocoding';

async function hydrateProjectCoordinates<T extends { id: string; address?: string | null; lat?: number | null; lng?: number | null }>(projects: T[]) {
  const adminClient = await createAdminClient();

  const hydrated = await Promise.all(
    projects.map(async (project) => {
      if (typeof project.lat === 'number' && typeof project.lng === 'number') {
        return project;
      }

      if (!project.address) {
        return project;
      }

      const coordinates = await geocodeAddress(project.address);
      if (coordinates.lat === null || coordinates.lng === null) {
        return project;
      }

      await adminClient
        .from('observatory_projects')
        .update({ lat: coordinates.lat, lng: coordinates.lng })
        .eq('id', project.id);

      return {
        ...project,
        lat: coordinates.lat,
        lng: coordinates.lng,
      };
    })
  );

  return hydrated;
}

export async function getProjects(status: string = 'approved') {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('observatory_projects')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return hydrateProjectCoordinates(data || []);
}

export async function getProjectById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('observatory_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  const [hydrated] = await hydrateProjectCoordinates(data ? [data] : []);
  return hydrated;
}

export async function submitProject(projectData: Omit<Project, 'id' | 'status'>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const coordinates = projectData.address ? await geocodeAddress(projectData.address) : { lat: null, lng: null };

  const adminClient = await createAdminClient();
  const { data, error } = await adminClient
    .from('observatory_projects')
    .insert({ ...projectData, ...coordinates, submitted_by: user.id })
    .select()
    .single();

  if (error) {
    console.error('Supabase Insert Error:', error);
    throw error;
  }
  return data;
}

export async function approveProject(id: string) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  const adminClient = await createAdminClient();
  const { data, error } = await adminClient
    .from('observatory_projects')
    .update({ status: 'approved', approved_by: user?.id || null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rejectProject(id: string) {
  const adminClient = await createAdminClient();
  const { error } = await adminClient
    .from('observatory_projects')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) throw error;
}

export async function getAllObservatoryProjects() {
  const adminClient = await createAdminClient();
  const { data, error } = await adminClient
    .from('observatory_projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPendingProjects() {
  const adminClient = await createAdminClient();
  const { data, error } = await adminClient
    .from('observatory_projects')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const hasManualCoordinates = typeof updates.lat === 'number' && typeof updates.lng === 'number';
  const coordinates: { lat?: number | null; lng?: number | null } =
    !hasManualCoordinates && updates.address ? await geocodeAddress(updates.address) : {};
  const payload = !hasManualCoordinates && updates.address
    ? {
        ...updates,
        lat: coordinates.lat,
        lng: coordinates.lng,
      }
    : updates;

  const adminClient = await createAdminClient();
  const { data, error } = await adminClient
    .from('observatory_projects')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const adminClient = await createAdminClient();
  const { error } = await adminClient
    .from('observatory_projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
