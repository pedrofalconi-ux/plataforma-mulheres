import { createClient } from '@/lib/supabase/server';
import type { UpdateProfile } from '@/lib/schemas';

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*, regions(*), profile_skills(skills(*))')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: UpdateProfile) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addSkillToProfile(profileId: string, skillId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('profile_skills')
    .insert({ profile_id: profileId, skill_id: skillId });

  if (error) throw error;
}

export async function removeSkillFromProfile(profileId: string, skillId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('profile_skills')
    .delete()
    .eq('profile_id', profileId)
    .eq('skill_id', skillId);

  if (error) throw error;
}

export async function getAllSkills() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}
