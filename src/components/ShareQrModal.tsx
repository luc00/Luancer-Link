import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Mail,
  Upload,
  X,
} from 'lucide-react';
import type { BioProfile } from '../types/profile';
import { calculateProfileStats } from '../utils/profileLogic';

interface ShareQrModalProps {
  profile: BioProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenPublicPage: () => void;
  onImportProfileJson: (imported: BioProfile) => void;
}

export function ShareQrModal({
  profile,
  isOpen,
  onClose,
  onOpenPublicPage,
  onImportProfileJson,
}: ShareQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?u=${encodeURIComponent(profile.handle)}`
      : `https://filobio.app/?u=${encodeURIComponent(profile.handle)}`;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(publicUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#09090B',
        light: '#FFFFFF',
      },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));

    QRCode.toString(publicUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#09090B',
        light: '#FFFFFF',
      },
    })
      .then(setQrSvg)
      .catch(() => setQrSvg(''));
  }, [isOpen, publicUrl]);

  if (!isOpen) return null;

  const stats = calculateProfileStats(profile);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `filobio-${profile.handle}-qr.png`;
    a.click();
  };

  const handleDownloadQrSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filobio-${profile.handle}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profilo-${profile.handle}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as BioProfile;
        if (!parsed.handle || !parsed.blocks || !parsed.theme) {
          setImportError('Il file JSON non contiene un profilo FiloBio valido.');
          return;
        }
        setImportError('');
        onImportProfileJson(parsed);
        onClose();
      } catch {
        setImportError('Errore di lettura del file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between gap-4">
          <div>
            <h2
              id="share-modal-title"
              className="text-lg font-bold text-zinc-900"
            >
              Condividi @{profile.handle}
            </h2>
            <p className="text-xs text-zinc-500">
              Link pubblico, codice QR scaricabile, statistiche e backup JSON.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi finestra condivisione"
            className="p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Copyable Link */}
          <div className="space-y-2">
            <label
              htmlFor="public-share-url"
              className="block text-xs font-medium text-zinc-700"
            >
              URL Pubblico del Profilo
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="public-share-url"
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copiato</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copia Link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPublicPage();
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Apri Pagina</span>
                </button>
              </div>
            </div>
          </div>

          {/* QR Code & Analytics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            <div className="sm:col-span-5 p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center gap-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code per @${profile.handle}`}
                  className="w-40 h-40 rounded-lg border border-zinc-200 bg-white p-1"
                />
              ) : (
                <div className="w-40 h-40 rounded-lg bg-zinc-200 animate-pulse" />
              )}
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>PNG</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQrSvg}
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>SVG</span>
                </button>
              </div>
            </div>

            <div className="sm:col-span-7 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 mb-2.5">
                  Rendimento Profilo
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="text-xs text-zinc-500">Visite Pagina</div>
                    <div className="text-lg font-bold text-zinc-900 tabular-nums mt-0.5">
                      {profile.views}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="text-xs text-zinc-500">Clic Totali</div>
                    <div className="text-lg font-bold text-zinc-900 tabular-nums mt-0.5">
                      {stats.totalClicks}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="text-xs text-zinc-500">Tasso Clic (CTR)</div>
                    <div className="text-lg font-bold text-zinc-900 tabular-nums mt-0.5">
                      {stats.ctrEstimate}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="text-xs text-zinc-500">Blocchi Attivi</div>
                    <div className="text-lg font-bold text-zinc-900 tabular-nums mt-0.5">
                      {stats.activeLinks}
                    </div>
                  </div>
                </div>
              </div>

              {/* Export / Import */}
              <div className="pt-2 border-t border-zinc-200 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Esporta JSON</span>
                </button>
                <label className="px-3 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Importa JSON</span>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportFile}
                    className="sr-only"
                  />
                </label>
              </div>
              {importError && (
                <p className="text-xs text-red-600 font-medium">{importError}</p>
              )}
            </div>
          </div>

          {/* Messages Inbox from Contact Blocks */}
          <div className="pt-4 border-t border-zinc-200 space-y-2.5">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-600" aria-hidden="true" />
              <h3 className="text-xs font-semibold text-zinc-900">
                Messaggi Ricevuti ({profile.messages?.length || 0})
              </h3>
            </div>
            {!profile.messages || profile.messages.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Nessun messaggio ancora inviato dai visitatori tramite i moduli contatto.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {profile.messages.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
                      <span>
                        {m.senderName} · {m.senderEmail}
                      </span>
                      <span className="text-[11px] font-normal text-zinc-500 tabular-nums">
                        {new Date(m.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <p className="text-zinc-700 mt-1">{m.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
