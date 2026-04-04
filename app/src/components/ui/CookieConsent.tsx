'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lgpd-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('lgpd-consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-full duration-500">
      <div className="mx-auto max-w-4xl rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary-600/20 p-2 text-primary-500 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">Respeitamos sua privacidade</h4>
              <p className="text-sm text-stone-400 leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o tráfego 
                e garantir a segurança da nossa plataforma conforme a LGPD. Ao continuar, você concorda com nossa 
                <a href="/privacidade" className="text-primary-400 hover:underline mx-1">Política de Privacidade</a> e 
                <a href="/termos" className="text-primary-400 hover:underline ml-1">Termos de Uso</a>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleAccept}
              className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg active:scale-95"
            >
              Aceitar e Continuar
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 transition-colors"
              aria-label="Fecar"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
