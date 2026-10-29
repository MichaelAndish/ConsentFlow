import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  ShieldCheck,
  Globe,
  Database,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { DEFAULT_GEMINI_MODEL, fetchGeminiStatus } from '../../services/geminiService';

export const SettingsView: React.FC = () => {
  const [geminiActive, setGeminiActive] = useState(false);
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_MODEL);

  useEffect(() => {
    let cancelled = false;
    fetchGeminiStatus().then((status) => {
      if (cancelled) return;
      setGeminiActive(status.configured);
      setGeminiModel(status.model);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hospitals = [
    { name: 'UZ Gent', city: 'Gent' },
    { name: 'UZ Leuven', city: 'Leuven' },
    { name: 'Saint-Luc', city: 'Brussels' },
    { name: 'HUDERF', city: 'Brussels' },
    { name: 'UZA', city: 'Edegem' },
    { name: 'CHC MontLégia', city: 'Liège' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-teal-600" />
          Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Demo environment reference — not live account settings</p>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
        <span className="font-bold">Demo Mode.</span> Three sample studies seed this walkthrough. Status badges are
        not Ethics Committee approval or proof of a live backend. All investigator names and site contacts are
        synthetic demonstration cast — not operational hospital lines.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Who this is for
          </div>
          <ul className="space-y-2 text-slate-600">
            <li>
              <strong className="text-slate-800">BSPHO coordinators</strong> — prepare paediatric consent packages
            </li>
            <li>
              <strong className="text-slate-800">Investigators</strong> — review English clinical content
            </li>
            <li>
              <strong className="text-slate-800">Sites</strong> — local annexes and insurance evidence
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Globe className="w-4 h-4 text-teal-600" />
            Languages
          </div>
          <p className="text-slate-600 leading-relaxed">
            English is the working master. Dutch and French are the Belgian submission languages. Official legal
            wording stays locked during adaptation.
          </p>
          <p className="text-slate-500 text-[11px]">
            Audiences: Adult · Parent · Adolescent (12–17) · Child (8–11)
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Building className="w-4 h-4 text-teal-600" />
            Sample sites
          </div>
          <div className="grid grid-cols-2 gap-2">
            {hospitals.map((h) => (
              <div key={h.name} className="px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800 block">{h.name}</span>
                <span className="text-[10px] text-slate-400">{h.city}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Cloud className="w-4 h-4 text-teal-600" />
            Integrations
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Gemini ({geminiModel})
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  geminiActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {geminiActive ? 'Configured on server' : 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-teal-600" />
                Cloud storage
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                Demo paths only
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            API keys are never shown in the UI or shipped in the browser bundle. They remain server environment
            variables only.
          </p>
        </div>
      </div>
    </div>
  );
};
