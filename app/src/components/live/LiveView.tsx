'use client';

import React from 'react';
import { Video, User, Send } from 'lucide-react';

export default function LiveView() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-stone-900">
      <div className="flex-1 flex flex-col">
        {/* Video Area */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Video className="text-stone-500" size={40} />
            </div>
            <p className="text-stone-400">Transmissão ao vivo iniciará em breve...</p>
          </div>
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold uppercase animate-pulse">
            Ao Vivo
          </div>
          <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
            <User size={12} className="inline mr-1" /> 1,204 assistindo
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-full lg:w-80 bg-white flex flex-col border-l border-stone-800">
        <div className="p-4 bg-stone-100 border-b border-stone-200">
          <h3 className="font-bold text-stone-800">Chat ao Vivo</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">JO</div>
            <div>
              <span className="text-xs font-bold text-stone-500">João Oliveira</span>
              <p className="text-sm text-stone-800">Excelente ponto sobre a bioética personalista!</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">MA</div>
            <div>
              <span className="text-xs font-bold text-stone-500">Maria A.</span>
              <p className="text-sm text-stone-800">Como podemos aplicar isso na pastoral da saúde?</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 bg-primary-50 p-2 rounded">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">MOD</div>
            <div>
              <span className="text-xs font-bold text-primary-700">Moderador</span>
              <p className="text-sm text-stone-800">Pessoal, mandem suas perguntas para o final.</p>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-stone-200">
          <div className="relative">
            <input type="text" placeholder="Digite sua mensagem..." className="w-full pl-4 pr-10 py-2 border border-stone-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <button className="absolute right-2 top-1.5 text-primary-600 hover:text-primary-800">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
