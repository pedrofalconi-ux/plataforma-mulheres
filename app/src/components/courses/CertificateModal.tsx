'use client';

import React, { useState } from 'react';
import { Award, X, Download, Loader2, CheckCircle2 } from 'lucide-react';

interface CertificateModalProps {
  courseId: string;
  courseTitle: string;
  userName: string;
  onClose: () => void;
}

export default function CertificateModal({
  courseId,
  courseTitle,
  userName,
  onClose,
}: CertificateModalProps) {
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState(false);
  const [certData, setCertData] = useState<any>(null);

  const verificationUrl =
    certData?.id && typeof window !== 'undefined'
      ? `${window.location.origin}/api/certificates/verify?id=${certData.id}`
      : '';
  const qrCodeUrl = verificationUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verificationUrl)}`
    : '';

  const issueCertificate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCertData(data.certificate);
        setIssued(true);
      } else {
        alert(data.error || 'Erro ao emitir certificado.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 p-4">
          <h2 className="flex items-center gap-2 font-bold text-stone-800">
            <Award className="text-amber-500" /> Emissão de Certificado
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-y-auto bg-stone-100 p-8">
          {!issued ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Award size={40} />
              </div>
              <h3 className="mb-4 text-2xl font-serif font-bold text-stone-900">Parabéns pela conclusão!</h3>
              <p className="mb-8 leading-relaxed text-stone-600">
                Você concluiu 100% das aulas da trilha <strong>{courseTitle}</strong>. Clique no botão abaixo para
                gerar sua credencial oficial do Ecossistema da Dignidade.
              </p>
              <button
                onClick={issueCertificate}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                Gerar Meu Certificado
              </button>
            </div>
          ) : (
            <div
              className="relative flex aspect-[1.414/1] w-full flex-col border-[12px] border-double border-stone-300 bg-white p-12 text-center shadow-lg"
              id="print-certificate"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-50/50 via-transparent to-transparent" />

              <div className="relative z-10 flex flex-1 flex-col items-center justify-center border border-stone-200 p-8 pb-16 pt-12">
                <div className="mb-8">
                  <h1 className="mb-2 text-4xl font-serif font-bold uppercase tracking-wider text-primary-900">
                    Certificado de Conclusão
                  </h1>
                  <div className="mx-auto h-0.5 w-32 bg-amber-500" />
                </div>

                <p className="mb-4 text-lg font-medium italic text-stone-600">Certificamos que</p>

                <h2 className="mb-8 inline-block border-b-2 border-stone-300 px-12 py-2 text-5xl font-bold text-stone-900">
                  {userName}
                </h2>

                <p className="mb-4 max-w-2xl text-lg leading-relaxed text-stone-600">
                  concluiu com êxito todos os requisitos da trilha educacional <br />
                  <strong className="mt-2 block text-xl text-stone-900">{courseTitle}</strong>
                </p>

                <div className="mt-12 flex w-full items-end justify-between px-12">
                  <div className="text-center">
                    <div className="mb-2 w-48 border-b border-stone-400" />
                    <p className="text-sm font-bold text-stone-700">Ecossistema da Dignidade</p>
                    <p className="text-xs text-stone-500">Direção Acadêmica</p>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-500">
                      <div className="absolute inset-2 rounded-full border-2 border-amber-400" />
                      <Award size={40} className="text-amber-500" />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="mb-2 w-48 border-b border-stone-400 pt-6 text-lg italic text-stone-700">
                      {new Date(certData?.issued_at || Date.now()).toLocaleDateString('pt-BR')}
                    </div>
                    <p className="text-sm font-bold text-stone-700">Data de Emissão</p>
                    <p className="text-xs text-stone-400">ID: {certData?.id?.split('-')[0]}</p>
                  </div>
                </div>

                {qrCodeUrl && (
                  <div className="mt-6 flex items-center justify-center gap-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code de autenticação do certificado"
                      className="h-20 w-20 rounded border border-stone-200 bg-white p-1"
                    />
                    <div className="max-w-md text-left">
                      <p className="text-xs font-bold uppercase tracking-wide text-stone-600">Autenticação</p>
                      <p className="text-xs text-stone-500">
                        Escaneie o QR Code para validar a autenticidade deste certificado.
                      </p>
                      <a
                        href={verificationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-xs font-semibold text-primary-700 hover:underline"
                      >
                        Validar certificado
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {issued && (
          <div className="flex justify-end border-t border-stone-200 bg-white p-4">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg bg-stone-900 px-6 py-2 font-bold text-white transition-colors hover:bg-stone-800"
            >
              <Download size={18} /> Salvar PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
