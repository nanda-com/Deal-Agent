import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, CreditCard, Activity, Check, X, Sparkles, ChevronDown, BarChart3 } from 'lucide-react';
import { Badge, GlassCard } from '@/components/ui-kit/Card';
import { toast } from 'sonner';
import { workspaces } from '@/lib/mockData';

const planColors: Record<string, string> = {
  starter: 'text-sky-300 bg-sky-400/15',
  pro: 'text-accent bg-accent/15',
  enterprise: 'text-amber-300 bg-amber-400/15',
};

const planDetails = {
  starter: { price: '$99/mo', conversations: '2,000/mo', leads: '500', agents: 1 },
  pro: { price: '$499/mo', conversations: '15,000/mo', leads: '5,000', agents: 5 },
  enterprise: { price: '$1,999/mo', conversations: 'Unlimited', leads: 'Unlimited', agents: 20 },
};

export function WorkspaceManager() {
  const [expanded, setExpanded] = useState(false);
  const currentWorkspace = workspaces[0];
  const plan = planDetails[currentWorkspace.plan];

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl grad-primary grid place-items-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">{currentWorkspace.companyName}</div>
              <Badge className={`${planColors[currentWorkspace.plan]} capitalize`}>{currentWorkspace.plan}</Badge>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-border/40 space-y-4"
          >
            {/* Plan Details */}
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium">Current Plan</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <span className="ml-1 font-semibold">{plan.price}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Conversations:</span>
                  <span className="ml-1 font-semibold">{plan.conversations}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Leads:</span>
                  <span className="ml-1 font-semibold">{plan.leads}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Agents:</span>
                  <span className="ml-1 font-semibold">{plan.agents}</span>
                </div>
              </div>
              <button
                onClick={() => toast.success('🔄 Billing portal opened')}
                className="mt-2 w-full h-8 rounded-lg glass hover:bg-white/10 text-xs font-medium transition"
              >
                Manage Subscription
              </button>
            </div>

            {/* Usage */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium">Usage This Month</span>
              </div>
              <div className="space-y-2">
                {Object.entries(currentWorkspace.usage).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: `${Math.min((value / 50000) * 100, 100)}%` }}
                          className="h-full grad-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium">Team ({currentWorkspace.members.length})</span>
              </div>
              <div className="space-y-1.5">
                {currentWorkspace.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2.5 glass rounded-lg p-2">
                    <div className="w-7 h-7 rounded-full grad-primary grid place-items-center text-[10px] font-bold text-white">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{member.name}</div>
                      <div className="text-[9px] text-muted-foreground capitalize">{member.role}</div>
                    </div>
                    <Badge className="text-[9px] capitalize">{member.role}</Badge>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toast.success('👤 Invite link copied')}
                className="mt-2 w-full h-8 rounded-lg glass hover:bg-white/10 text-xs font-medium transition"
              >
                + Invite Member
              </button>
            </div>

            {/* Billing */}
            <div className="glass rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Billing Status</span>
                <Badge tone={currentWorkspace.billing.status === 'active' ? 'success' : 'danger'}>
                  {currentWorkspace.billing.status === 'active' ? 'Active' : 'Past Due'}
                </Badge>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-muted-foreground">Next Payment</span>
                <span className="font-medium">${currentWorkspace.billing.amount} · {currentWorkspace.billing.nextPayment}</span>
              </div>
            </div>

            {/* Plan Comparison */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium">Compare Plans</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(planDetails).map(([name, details]) => (
                  <div
                    key={name}
                    className={`glass rounded-lg p-2.5 text-center cursor-pointer transition ${name === currentWorkspace.plan ? 'ring-1 ring-primary/40' : 'hover:bg-white/5'}`}
                    onClick={() => {
                      if (name !== currentWorkspace.plan) {
                        toast.success(`📋 Plan changed to ${name}`, { description: 'Changes will reflect in next billing cycle' });
                      }
                    }}
                  >
                    <div className={`text-xs font-semibold capitalize ${name === currentWorkspace.plan ? 'text-accent' : ''}`}>
                      {name}
                    </div>
                    <div className="text-sm font-bold mt-1">{details.price}</div>
                    <div className="text-[9px] text-muted-foreground mt-1">{details.conversations} convos</div>
                    {name === currentWorkspace.plan && <Check className="w-3 h-3 text-accent mx-auto mt-1" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
}

export function WorkspaceSelector() {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg glass hover:bg-white/10 text-sm transition"
      >
        <Building2 className="w-3.5 h-3.5 text-accent" />
        <span className="font-medium">{workspaces[0].companyName}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition ${show ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {show && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 top-full mt-2 w-56 bg-[#0f172a] text-white rounded-[12px] overflow-hidden shadow-2xl z-30"
            >
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  toast.success(`Switched to ${ws.companyName}`);
                  setShow(false);
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition"
              >
                <div className="w-8 h-8 rounded-lg grad-primary grid place-items-center text-xs font-bold text-white">
                  {ws.companyName.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div className="text-sm font-medium">{ws.companyName}</div>
                  <Badge className={`${planColors[ws.plan]} capitalize text-[9px]`}>{ws.plan}</Badge>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
