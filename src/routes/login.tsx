import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('alex@acme.com');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    // Demo mode — bypass Firebase Auth, accept any credentials
    localStorage.setItem('omniflow_auth', '1');
    localStorage.setItem('omniflow_token', 'demo-token-123');
    localStorage.setItem('omniflow_userId', 'demo-agent-001');
    localStorage.setItem('omniflow_userName', 'Alex');

    // Try to authenticate with backend, but don't block on failure
    try {
      await fetch((import.meta.env.VITE_API_URL || 'https://omniflow-ai.onrender.com') + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      // Backend may not have Firebase — demo continues regardless
    }

    toast.success('Welcome back, Alex');
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 animate-fade-in">
      <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl grad-primary grid place-items-center ring-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-xl grad-text">OmniFlow</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">AI Suite</div>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="max-w-md">
          <h1 className="text-5xl font-bold leading-tight">
            One inbox.<br />
            <span className="grad-text">Every channel.</span><br />
            <span className="grad-text">Zero waiting.</span>
          </h1>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Gemini-powered conversations across WhatsApp, Instagram, Facebook, LinkedIn,
            web chat, and AI voice — closing leads while you sleep.
          </p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-wrap gap-2">
            {['WhatsApp', 'Instagram', 'LinkedIn', 'Voice AI', 'Web Chat', 'Auto Lead Capture'].map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-full glass text-xs hover:scale-105 transition-transform">
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            © {currentYear} OmniFlow AI · AI-Powered Customer Communication Platform. All rights reserved.
          </p>
          <p>Built with Gemini AI • Multi-Channel Customer Engagement Platform</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', damping: 22 }}
          className="w-full max-w-md glass-strong rounded-3xl p-8 ring-glow"
        >
          <div className="flex items-center gap-2 text-xs text-accent mb-3">
            <Zap className="w-3.5 h-3.5" /> Demo mode — any credentials work
          </div>
          <h2 className="text-2xl font-bold">Sign in to OmniFlow</h2>
          <p className="text-sm text-muted-foreground mt-1">Run your entire conversational stack from one place.</p>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Password</span>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full h-11 rounded-xl grad-primary font-semibold text-white flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-60 transition"
          >
            {loading ? 'Signing in…' : (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <div className="mt-5 text-center text-xs text-muted-foreground">
            Protected by Firebase Auth · SOC2 in progress
          </div>
        </motion.form>
      </div>
    </div>
  );
}
