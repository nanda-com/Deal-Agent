import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Play, Pause, Check, Sparkles, Settings2, Plus, Trash2, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui-kit/Card';
import { toast } from 'sonner';
import type { VoiceProfile } from '@/types';

type VoiceProfileItem = VoiceProfile & { sampleUrl?: string };

const sampleTexts: Record<string, string> = {
  company: "Welcome to OmniFlow AI. We're here to help you engage your customers across every channel.",
  sales: "Hi there! I noticed you're interested in our platform. Let me show you how we can help grow your business.",
  support: "Thank you for reaching out. I understand your concern and I'm here to help resolve it for you.",
};

export function VoiceProfileSelector({ onSelect }: { onSelect?: (id: string) => void }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<VoiceProfileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || 'https://omniflow-ai.onrender.com') + '/api/voice-profiles';
      const res = await fetch(apiUrl);
      const json = await res.json();
      if (json.success) {
        setProfiles(json.data || []);
        if (!selected && json.data && json.data.length > 0) setSelected(json.data[0].id);
      } else {
        toast.error(json.error || 'Failed to load voice profiles');
      }
    } catch (err) {
      toast.error('Network error while loading voice profiles');
    } finally {
      setLoading(false);
    }
  }

  const handlePlay = (id: string) => {
    if (playing === id) {
      setPlaying(null);
      return;
    }
    setPlaying(id);
    setTimeout(() => setPlaying(null), 2000);
  };

  // Render
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Voice Profile</h3>
        <Badge tone="info">{profiles.filter(p => p.active).length}</Badge>
      </div>

      <div className="space-y-2">
        {profiles.map((profile) => {
          const isPlaying = playing === profile.id;
          const isSelected = selected === profile.id;
          const sample = sampleTexts[profile.type] ?? '';

          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[#0f172a] text-white rounded-xl p-3 cursor-pointer transition-all ${isSelected ? 'ring-1 ring-primary/40' : ''}`}
              onClick={() => { setSelected(profile.id); onSelect?.(profile.id); }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg grid place-items-center ${isSelected ? 'grad-primary' : 'bg-white/6'}`}>
                    <Mic className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{profile.name}</div>
                    <div className="text-[10px] text-slate-300 capitalize">{profile.type} · {profile.accent}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="w-4 h-4 text-accent" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlay(profile.id); }}
                    className="w-8 h-8 rounded-full bg-white/6 hover:bg-white/10 grid place-items-center"
                    title="Preview voice"
                  >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {isPlaying && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 pt-2 border-t border-white/6">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="flex gap-0.5">
                      <span className="w-1 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1 h-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </span>
                    {sample}
                  </div>
                </motion.div>
              )}

              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-300">
                  <span className="capitalize">{profile.gender}</span>
                  <span>·</span>
                  <span className="capitalize">{profile.speed}</span>
                </div>
                {profile.active && <Badge tone="success" className="ml-auto">Active</Badge>}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setShowManager(true)} className="flex-1 h-9 rounded-xl bg-white/6 hover:bg-white/10 text-xs flex items-center justify-center gap-2 transition">
          <Settings2 className="w-3 h-3" /> Manage Voice Profiles
        </button>
        <button onClick={() => setShowManager(true)} className="h-9 w-9 rounded-xl bg-accent text-white grid place-items-center">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showManager && <VoiceProfileManagerModal onClose={() => { setShowManager(false); fetchProfiles(); }} />}
    </div>
  );
}

function VoiceProfileManagerModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'company' | 'sales' | 'support'>('company');
  const [accent, setAccent] = useState('American (Neutral)');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [gender, setGender] = useState('Female');
  const [description, setDescription] = useState('');
  const [sample, setSample] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name) { toast.error('Name is required'); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('type', type);
      fd.append('description', description);
      fd.append('accent', accent);
      fd.append('speed', speed);
      fd.append('gender', gender);
      if (sample) fd.append('sample', sample, sample.name);

      const apiUrl = (import.meta.env.VITE_API_URL || 'https://omniflow-ai.onrender.com') + '/api/voice-profiles';
      const res = await fetch(apiUrl, { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        toast.success('Voice profile created');
        onClose();
      } else {
        toast.error(json.error || 'Failed to create profile');
      }
    } catch (err) {
      toast.error('Network error while creating profile');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-[#0f172a] text-white rounded-[16px] p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create Voice Profile</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/6">Close</button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Profile name" className="w-full p-3 rounded-lg bg-white/6 text-white" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full p-3 rounded-lg bg-white/6 text-white" />
          <div className="flex gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="flex-1 p-2 rounded-lg bg-white/6 text-white">
              <option value="company">Company</option>
              <option value="sales">Sales</option>
              <option value="support">Support</option>
            </select>
            <select value={speed} onChange={(e) => setSpeed(e.target.value as any)} className="w-40 p-2 rounded-lg bg-white/6 text-white">
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="Accent" className="flex-1 p-2 rounded-lg bg-white/6 text-white" />
            <input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Gender" className="w-40 p-2 rounded-lg bg-white/6 text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-300">Upload sample (optional)</label>
            <input type="file" accept="audio/*" onChange={(e) => setSample(e.target.files?.[0] ?? null)} className="mt-2" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-3 py-2 rounded-lg bg-white/6">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="px-3 py-2 rounded-lg bg-accent text-white">{creating ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
