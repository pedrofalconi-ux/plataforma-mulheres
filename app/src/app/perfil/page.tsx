'use client';

import React, { useState, useEffect, useEffectEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle2,
  Award,
  BookOpen,
  MapPin,
  Image as ImageIcon,
  Zap
} from 'lucide-react';
import ImageCropper from '@/components/admin/ImageCropper';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [regionId, setRegionId] = useState('');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  
  const [availableRegions, setAvailableRegions] = useState<any[]>([]);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({ courses: 0, certificates: 0 });

  const fetchProfileData = useEffectEvent(async () => {
    if (!user) return;

    const [
      { data: profile },
      { data: pSkills },
      optionsResponse,
      { count: coursesCount },
      { count: certsCount },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('phone, bio, avatar_url, region_id')
        .eq('id', user.id)
        .single(),
      supabase
        .from('profile_skills')
        .select('skill_id')
        .eq('profile_id', user.id),
      fetch('/api/profile/options', { cache: 'no-store' }),
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id),
      supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id),
    ]);

    if (profile) {
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setRegionId(profile.region_id || '');
    }

    if (pSkills) {
      setUserSkills(pSkills.map((s: any) => s.skill_id));
    }

    if (optionsResponse.ok) {
      const options = await optionsResponse.json();
      setAvailableRegions(options.regions || []);
      setAvailableSkills(options.skills || []);
    }

    setStats({
      courses: coursesCount || 0,
      certificates: certsCount || 0
    });
  });

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      fetchProfileData();
    }
  }, [user]);

  const parseResponse = async (response: Response) => {
    const rawText = await response.text();

    try {
      return rawText ? JSON.parse(rawText) : {};
    } catch {
      return { error: rawText || 'Resposta invalida da API.' };
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploadingAvatar(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await parseResponse(response);
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar foto de perfil.');
      }

      setAvatarUrl(result.url || '');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao enviar foto de perfil.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone,
          bio: bio,
          avatar_url: avatarUrl,
          region_id: regionId,
          skills: userSkills
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar perfil');
      }

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar perfil.' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    if (userSkills.includes(skillId)) {
      setUserSkills(userSkills.filter(id => id !== skillId));
    } else {
      setUserSkills([...userSkills, skillId]);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/export');
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao exportar dados');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ecossistema-dados-${user?.id || 'usuario'}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Seus dados foram exportados com sucesso.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao exportar dados.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Esta aÃ§Ã£o Ã© permanente. Deseja realmente excluir sua conta?')) return;

    setIsDeleting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/delete', { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir conta');
      }

      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao excluir conta.' });
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <UserIcon size={64} className="text-stone-300 mb-4" />
        <h1 className="text-2xl font-bold text-stone-800">Acesso Restrito</h1>
        <p className="text-stone-500 mt-2">Você precisa estar logado para ver esta página.</p>
        <a href="/login" className="mt-6 bg-primary-600 text-white px-6 py-2 rounded-lg font-bold">Ir para Login</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          {avatarUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-primary-200 shadow-sm">
              <Image src={avatarUrl} alt="Avatar" fill sizes="64px" className="object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center border-2 border-primary-200 shadow-sm">
              <UserIcon size={32} />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">Meu Perfil</h1>
            <p className="text-stone-500">Gerencie suas informações e acompanhe seu progresso</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stats Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">Seu Progresso</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-700">
                    <BookOpen size={18} className="text-primary-600" />
                    <span className="text-sm font-medium">Trilhas Iniciadas</span>
                  </div>
                  <span className="text-lg font-bold text-stone-900">{stats.courses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-700">
                    <Award size={18} className="text-primary-600" />
                    <span className="text-sm font-medium">Certificados</span>
                  </div>
                  <span className="text-lg font-bold text-stone-900">{stats.certificates}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary-900 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} /> Perfil {user.role?.toLowerCase() === 'admin' ? 'Administrador' : 'Estudante'}
              </h3>
              <p className="text-primary-100 text-xs">
                {user.role?.toLowerCase() === 'admin' 
                  ? 'Você tem acesso total ao Painel de Controle e gestão de cursos.' 
                  : 'Continue estudando para garantir seus certificados e expandir seus conhecimentos.'}
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200">
              <form onSubmit={handleSave} className="space-y-6">
                {message.text && (
                  <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Nome Completo</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="Seu nome"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">E-mail (Login)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Telefone (Opcional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-stone-400" size={18} />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Foto de Perfil</label>
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          {avatarUrl ? (
                            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-stone-200 bg-white">
                              <Image src={avatarUrl} alt="Preview do avatar" fill sizes="80px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-400">
                              <ImageIcon size={24} />
                            </div>
                          )}
                          <div className="text-sm text-stone-500">
                            Envie uma imagem e ajuste o enquadramento antes de salvar o perfil.
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700">
                            {isUploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                            {isUploadingAvatar ? 'Enviando...' : 'Enviar foto'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                if (file) {
                                  setPendingAvatar(file);
                                  setShowAvatarCropper(true);
                                }
                                event.currentTarget.value = '';
                              }}
                            />
                          </label>

                          {avatarUrl ? (
                            <button
                              type="button"
                              onClick={() => setAvatarUrl('')}
                              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:bg-stone-100"
                            >
                              Remover
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                       <MapPin size={16} /> Estado / Região
                    </label>
                    <select
                      value={regionId}
                      onChange={(e) => setRegionId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    >
                      <option value="">Selecione um estado...</option>
                      {availableRegions.map(region => (
                        <option key={region.id} value={region.id}>
                          {region.state ? `${region.state} - ${region.name}` : region.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
                    <Zap size={16} /> Minhas Habilidades Sociais
                  </label>
                  <p className="text-xs text-stone-500 mb-3">Selecione suas habilidades para nos ajudar a conectar talentos a iniciativas.</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                          userSkills.includes(skill.id)
                            ? 'bg-primary-100 text-primary-800 border-primary-300 font-bold'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {skill.name}
                      </button>
                    ))}
                    {availableSkills.length === 0 && (
                      <span className="text-sm text-stone-400">Nenhuma habilidade cadastrada no sistema.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Bio / Apresentação</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-700 shadow-lg shadow-primary-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 bg-white rounded-2xl p-8 shadow-sm border border-stone-200">
              <div className="flex flex-col gap-2 mb-6">
                <h2 className="text-xl font-serif font-bold text-stone-900">Privacidade e LGPD</h2>
                <p className="text-sm text-stone-500">
                  Baixe seus dados em formato JSON ou solicite a exclusÃ£o permanente da conta.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-5 py-3 font-bold text-stone-700 hover:bg-stone-100 transition disabled:opacity-50"
                >
                  {isExporting ? 'Exportando dados...' : 'Exportar Meus Dados'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeleting ? 'Excluindo conta...' : 'Excluir Conta Permanentemente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAvatarCropper && pendingAvatar ? (
        <ImageCropper
          imageFile={pendingAvatar}
          aspectRatio={1}
          maxWidth={800}
          onCrop={(croppedFile) => {
            setShowAvatarCropper(false);
            setPendingAvatar(null);
            void handleAvatarUpload(croppedFile);
          }}
          onCancel={() => {
            setShowAvatarCropper(false);
            setPendingAvatar(null);
          }}
        />
      ) : null}
    </div>
  );
}
