'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, MapPin, Edit3, Trash2 } from 'lucide-react';

export default function AdminObservatorioPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/admin/observatorio');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Tem certeza que deseja ${action === 'approve' ? 'aprovar' : 'rejeitar'} este projeto?`)) return;
    
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/observatorio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      
      if (!res.ok) throw new Error('Erro ao processar ação');
      
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      setProjects(projects.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ATENÇÃO: Deseja excluir permanentemente este projeto? Esta ação não pode ser desfeita.')) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/observatorio?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir projeto');
      setProjects(projects.filter(p => p.id !== id));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setEditLoading(true);
    try {
      const res = await fetch('/api/admin/observatorio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProject.id, updates: editingProject })
      });
      if (!res.ok) throw new Error('Erro ao salvar projeto');
      
      const updated = await res.json();
      setProjects(projects.map(p => p.id === updated.id ? updated : p));
      setEditingProject(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900">Gestão do Observatório</h1>
        <p className="text-stone-500">Revise, gerencie e edite as iniciativas sociais cadastradas.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-stone-400"><Loader2 className="animate-spin" size={32} /></div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-4"><MapPin size={32} /></div>
            <h3 className="text-lg font-bold text-stone-800 mb-1">Nenhum projeto cadastrado</h3>
            <p className="text-stone-500 max-w-sm">O observatório ainda não possui iniciativas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-max">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4">Iniciativa</th>
                  <th className="px-6 py-4">Status & Categoria</th>
                  <th className="px-6 py-4">Endereço / Contato</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-800">{project.name}</div>
                      <div className="text-xs text-stone-500 line-clamp-1 max-w-xs mt-1">{project.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {project.status === 'pending' && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">Pendente</span>}
                        {project.status === 'approved' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Aprovado</span>}
                        {project.status === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">Rejeitado</span>}
                        <span className="text-stone-500 text-xs font-medium capitalize mt-1 border border-stone-200 px-2 py-0.5 rounded">{project.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      <div className="flex items-center gap-1"><MapPin size={14} className="text-stone-400 min-w-max"/> <span className="line-clamp-1 max-w-[200px]">{project.address}</span></div>
                      {project.contact && <div className="mt-1 text-xs text-stone-500 truncate max-w-[200px]">{project.contact}</div>}
                      <div className="mt-1 text-xs text-stone-400">
                        {typeof project.lat === 'number' && typeof project.lng === 'number'
                          ? `${project.lat.toFixed(5)}, ${project.lng.toFixed(5)}`
                          : 'Sem coordenadas'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {project.status === 'pending' && (
                          <>
                            <button 
                              disabled={actionLoading === project.id}
                              onClick={() => handleAction(project.id, 'reject')} 
                              className="text-amber-500 hover:text-amber-700 p-1.5 hover:bg-amber-50 rounded transition disabled:opacity-50"
                              title="Rejeitar"
                            >
                             {actionLoading === project.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                            </button>
                            <button 
                              disabled={actionLoading === project.id}
                              onClick={() => handleAction(project.id, 'approve')} 
                              className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition disabled:opacity-50"
                              title="Aprovar"
                            >
                               {actionLoading === project.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                            </button>
                          </>
                        )}
                        <button 
                          disabled={actionLoading === project.id}
                          onClick={() => setEditingProject(project)} 
                          className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition disabled:opacity-50 ml-2"
                          title="Editar"
                        >
                           <Edit3 size={18} />
                        </button>
                        <button 
                          disabled={actionLoading === project.id}
                          onClick={() => handleDelete(project.id)} 
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition disabled:opacity-50"
                          title="Excluir"
                        >
                           {actionLoading === project.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
             <button onClick={() => setEditingProject(null)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">X</button>
             <h3 className="text-xl font-bold font-serif mb-4 text-primary-900">Editar Iniciativa</h3>
             
             <form onSubmit={handleSaveEdit} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                 <input required type="text" value={editingProject.name} onChange={e => setEditingProject({...editingProject, name: e.target.value})} className="w-full p-2 border border-stone-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
                   <select value={editingProject.category} onChange={e => setEditingProject({...editingProject, category: e.target.value})} className="w-full p-2 border border-stone-300 rounded outline-none">
                     <option value="alimentacao">Alimentação</option>
                     <option value="saude">Saúde</option>
                     <option value="moradia">Moradia</option>
                     <option value="educacao">Educação</option>
                     <option value="espiritualidade">Espiritualidade</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
                   <select value={editingProject.status} onChange={e => setEditingProject({...editingProject, status: e.target.value})} className="w-full p-2 border border-stone-300 rounded outline-none">
                     <option value="pending">Pendente</option>
                     <option value="approved">Aprovado</option>
                     <option value="rejected">Rejeitado</option>
                   </select>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-stone-700 mb-1">Contato</label>
                 <input type="text" value={editingProject.contact || ''} onChange={e => setEditingProject({...editingProject, contact: e.target.value})} className="w-full p-2 border border-stone-300 rounded outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-stone-700 mb-1">Endereço</label>
                 <input required type="text" value={editingProject.address || ''} onChange={e => setEditingProject({...editingProject, address: e.target.value})} className="w-full p-2 border border-stone-300 rounded outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-stone-700 mb-1">Descrição</label>
                 <textarea rows={3} value={editingProject.description || ''} onChange={e => setEditingProject({...editingProject, description: e.target.value})} className="w-full p-2 border border-stone-300 rounded outline-none"></textarea>
               </div>
               <div className="pt-2 flex justify-end gap-2">
                 <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 border border-stone-300 rounded text-stone-700 hover:bg-stone-50">Cancelar</button>
                 <button type="submit" disabled={editLoading} className="px-4 py-2 bg-primary-600 text-white rounded font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                   {editLoading && <Loader2 size={16} className="animate-spin"/>} Salvar Alterações
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
