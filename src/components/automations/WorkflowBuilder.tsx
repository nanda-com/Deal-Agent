import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Zap, GitBranch, Play, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { workflowTemplates } from '@/lib/mockData';
import { executeWorkflow, loadExecutionHistory, loadSavedWorkflows, saveWorkflow } from '@/services/workflowEngine';
import type { Workflow, WorkflowExecutionEntry, WorkflowNode, WorkflowNodeConfig, WorkflowTemplate } from '@/types';

type WorkflowPaletteItem = Omit<WorkflowNode, 'id' | 'x' | 'y'>;

type WorkflowPaletteGroup = {
  category: string;
  items: WorkflowPaletteItem[];
};

const nodePalette: WorkflowPaletteGroup[] = [
  {
    category: 'Triggers',
    items: [
      {
        type: 'trigger' as const,
        label: 'New Lead Captured',
        description: 'Begin the workflow when a fresh lead enters OmniFlow.',
        config: { channel: 'all' },
      },
      {
        type: 'trigger' as const,
        label: 'Message Received',
        description: 'Start when a message arrives from any channel.',
        config: { channel: 'whatsapp' },
      },
    ],
  },
  {
    category: 'Conditions',
    items: [
      {
        type: 'condition' as const,
        label: 'Lead Score > 70',
        description: 'Continue only when the lead score passes threshold.',
        config: { field: 'score', operator: 'gt', value: '70' },
      },
      {
        type: 'condition' as const,
        label: 'Demo Intent Detected',
        description: 'Check if incoming text contains demo interest.',
        config: { field: 'keywords', operator: 'contains', value: 'demo' },
      },
    ],
  },
  {
    category: 'Actions',
    items: [
      {
        type: 'action' as const,
        label: 'Assign to Rep',
        description: 'Route the lead to a sales rep automatically.',
        config: { team: 'sales' },
      },
      {
        type: 'action' as const,
        label: 'Send Calendar Link',
        description: 'Email or message an available demo slot.',
        config: { delay: '0', template: 'calendar' },
      },
      {
        type: 'action' as const,
        label: 'Create Lead',
        description: 'Persist a lead record into CRM.',
        config: { system: 'hubspot' },
      },
    ],
  },
];

const nodeStyles: Record<WorkflowNode['type'], string> = {
  trigger: 'from-violet-500/30 to-violet-500/10 text-violet-300 border-violet-500/30',
  condition: 'from-sky-500/30 to-sky-500/10 text-sky-300 border-sky-500/30',
  action: 'from-emerald-500/30 to-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

const nodeIcons: Record<WorkflowNode['type'], React.ReactNode> = {
  trigger: <Zap className="w-4 h-4" />,
  condition: <GitBranch className="w-4 h-4" />,
  action: <Play className="w-4 h-4" />,
};

const STORAGE_KEY = 'omniworkflows.data';

const generateId = (prefix = 'item') => `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;

const blankWorkflow = (): Workflow => ({
  id: generateId('workflow'),
  name: 'New Automation',
  description: 'Build a new workflow with triggers, conditions, and actions.',
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  executions: 0,
  successRate: 0,
  nodes: [
    {
      id: generateId('node'),
      type: 'trigger',
      label: 'New Lead Captured',
      description: 'Start when a new lead enters OmniFlow.',
      x: 120,
      y: 80,
      config: { channel: 'all' },
    },
  ],
  edges: [],
});

function getDefaultNodePosition(index: number) {
  return {
    x: 140 + index * 240,
    y: 110 + (index % 2) * 100,
  };
}

export function WorkflowBuilder() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ nodeId: string; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const panState = useRef<{ startX: number; startY: number } | null>(null);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [history, setHistory] = useState<WorkflowExecutionEntry[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>(blankWorkflow());
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [connectingSource, setConnectingSource] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);

  const workflowCount = workflows.length;
  const activeCount = workflows.filter((workflow) => workflow.active).length;

  useEffect(() => {
    const saved = loadSavedWorkflows();
    const executionHistory = loadExecutionHistory();
    setWorkflows(saved);
    setHistory(executionHistory);
    if (saved.length) {
      setSelectedWorkflowId(saved[0].id);
      setCurrentWorkflow(saved[0]);
    }
  }, []);

  useEffect(() => {
    const match = workflows.find((item) => item.id === selectedWorkflowId);
    if (match) {
      setCurrentWorkflow(match);
    }
  }, [selectedWorkflowId, workflows]);

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (dragState.current) {
        const { nodeId, startX, startY, originX, originY } = dragState.current;
        const node = currentWorkflow.nodes.find((item) => item.id === nodeId);
        if (!node) {
          return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        setCurrentWorkflow((prev) => ({
          ...prev,
          nodes: prev.nodes.map((item) =>
            item.id === nodeId ? { ...item, x: originX + deltaX, y: originY + deltaY } : item
          ),
        }));
      }

      if (panState.current) {
        const { startX, startY } = panState.current;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        setOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        panState.current = { startX: event.clientX, startY: event.clientY };
      }
    };

    const handlePointerUp = () => {
      dragState.current = null;
      panState.current = null;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [currentWorkflow.nodes]);

  const updateCurrentWorkflow = (changes: Partial<Workflow>) => {
    setCurrentWorkflow((prev) => ({ ...prev, ...changes, updatedAt: new Date().toISOString() }));
  };

  const saveCurrentWorkflow = () => {
    if (!currentWorkflow.name.trim()) {
      toast.error('Give your automation a name before saving.');
      return;
    }
    if (!currentWorkflow.nodes.some((node) => node.type === 'trigger')) {
      toast.error('Add at least one trigger node to the workflow.');
      return;
    }

    const persisted = saveWorkflow(currentWorkflow);
    const next = workflows.filter((workflow) => workflow.id !== persisted.id);
    setWorkflows([persisted, ...next]);
    setSelectedWorkflowId(persisted.id);
    toast.success('Workflow saved', { description: `${persisted.name} is now available in the builder.` });
  };

  const createNewWorkflow = () => {
    const next = blankWorkflow();
    setCurrentWorkflow(next);
    setSelectedWorkflowId(null);
    setConnectingSource(null);
    setEditingName(true);
  };

  const duplicateWorkflow = () => {
    const idMap = currentWorkflow.nodes.reduce<Record<string, string>>((acc, node) => {
      acc[node.id] = generateId('node');
      return acc;
    }, {});

    const duplicate = {
      ...currentWorkflow,
      id: generateId('workflow'),
      name: `${currentWorkflow.name} copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executions: 0,
      successRate: 0,
      nodes: currentWorkflow.nodes.map((node) => ({ ...node, id: idMap[node.id] })),
      edges: currentWorkflow.edges.map((edge) => ({
        ...edge,
        id: generateId('edge'),
        source: idMap[edge.source] ?? edge.source,
        target: idMap[edge.target] ?? edge.target,
      })),
    };

    const persisted = saveWorkflow(duplicate);
    setWorkflows((prev) => [persisted, ...prev]);
    setSelectedWorkflowId(persisted.id);
    setCurrentWorkflow(persisted);
    toast.success('Workflow duplicated');
  };

  const deleteWorkflow = () => {
    if (!selectedWorkflowId) {
      toast.error('Select a saved workflow first.');
      return;
    }
    const next = workflows.filter((workflow) => workflow.id !== selectedWorkflowId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setWorkflows(next);
    if (next.length) {
      setSelectedWorkflowId(next[0].id);
    } else {
      createNewWorkflow();
    }
    toast.success('Workflow deleted');
  };

  const runCurrentWorkflow = async () => {
    const sampleContext = {
      leadName: 'Maya Patel',
      score: 78,
      keywords: 'demo request',
    };

    const result = await executeWorkflow(currentWorkflow, sampleContext);
    const updatedWorkflow = {
      ...currentWorkflow,
      lastRunAt: new Date().toISOString(),
      executions: currentWorkflow.executions + 1,
      successRate:
        currentWorkflow.executions === 0
          ? result.status === 'success'
            ? 100
            : 0
          : Math.round(
              ((currentWorkflow.successRate * currentWorkflow.executions + (result.status === 'success' ? 100 : 0)) /
                (currentWorkflow.executions + 1)) *
                100
            ),
    };
    saveWorkflow(updatedWorkflow);
    setCurrentWorkflow(updatedWorkflow);
    setWorkflows((prev) => [updatedWorkflow, ...prev.filter((item) => item.id !== updatedWorkflow.id)]);
    setHistory((prev) => [result, ...prev].slice(0, 20));
    toast.success(`Execution ${result.status}`, { description: result.summary });
  };

  const addNodeToCanvas = (item: WorkflowPaletteItem) => {
    const nextNode: WorkflowNode = {
      id: generateId('node'),
      type: item.type,
      label: item.label,
      description: item.description,
      config: item.config,
      x: 140,
      y: 100 + currentWorkflow.nodes.length * 70,
    };
    updateCurrentWorkflow({ nodes: [...currentWorkflow.nodes, nextNode] });
    toast.success('Node added', { description: item.label });
  };

  const loadTemplateWorkflow = (template: WorkflowTemplate) => {
    const nodes = template.nodes.map((node, index) => ({
      ...node,
      id: generateId('node'),
      x: 120 + index * 220,
      y: 80 + (index % 2) * 110,
    }));
    const edges = nodes.slice(1).map((node, index) => ({
      id: generateId('edge'),
      source: nodes[index].id,
      target: node.id,
    }));

    const workflow = {
      id: generateId('workflow'),
      name: template.name,
      description: template.description,
      active: template.active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executions: 0,
      successRate: 0,
      nodes,
      edges,
    };

    setCurrentWorkflow(workflow);
    setSelectedWorkflowId(null);
    setConnectingSource(null);
    setEditingName(false);
    toast.success('Template loaded', { description: template.name });
  };

  const addEdge = (targetId: string) => {
    if (!connectingSource) {
      return;
    }
    if (connectingSource === targetId) {
      toast.error('Cannot connect a node to itself.');
      setConnectingSource(null);
      return;
    }
    const newEdge = { id: generateId('edge'), source: connectingSource, target: targetId };
    const alreadyConnected = currentWorkflow.edges.some(
      (edge) => edge.source === connectingSource && edge.target === targetId
    );
    if (alreadyConnected) {
      toast.error('Connection already exists.');
      setConnectingSource(null);
      return;
    }

    updateCurrentWorkflow({ edges: [...currentWorkflow.edges, newEdge] });
    setConnectingSource(null);
    toast.success('Step connected');
  };

  const removeEdge = (edgeId: string) => {
    updateCurrentWorkflow({ edges: currentWorkflow.edges.filter((edge) => edge.id !== edgeId) });
  };

  const removeNode = (nodeId: string) => {
    updateCurrentWorkflow({
      nodes: currentWorkflow.nodes.filter((node) => node.id !== nodeId),
      edges: currentWorkflow.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
    if (connectingSource === nodeId) {
      setConnectingSource(null);
    }
  };

  const startNodeDrag = (event: ReactPointerEvent<HTMLDivElement>, nodeId: string) => {
    event.stopPropagation();
    const node = currentWorkflow.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    dragState.current = {
      nodeId,
      startX: event.clientX,
      startY: event.clientY,
      originX: node.x,
      originY: node.y,
    };
  };

  const startPanning = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== canvasRef.current) return;
    event.preventDefault();
    panState.current = { startX: event.clientX, startY: event.clientY };
  };

  const canvasTransform = {
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
  };

  const workflowSummary = useMemo(() => {
    const triggers = currentWorkflow.nodes.filter((n) => n.type === 'trigger').length;
    const conditions = currentWorkflow.nodes.filter((n) => n.type === 'condition').length;
    const actions = currentWorkflow.nodes.filter((n) => n.type === 'action').length;
    return `${triggers} trigger · ${conditions} condition · ${actions} action`;
  }, [currentWorkflow.nodes]);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <div className="glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-accent" />
            <div>
              <div className="text-sm font-semibold">Automation Builder</div>
              <p className="text-xs text-muted-foreground">Create, save, and run workflow automations from one canvas.</p>
            </div>
          </div>

          <div className="grid gap-3">
            <button onClick={createNewWorkflow} className="button-secondary w-full gap-2">
              <Plus className="w-4 h-4" /> New Workflow
            </button>
            <button onClick={saveCurrentWorkflow} className="button-primary w-full gap-2">
              <CheckCircle2 className="w-4 h-4" /> Save Workflow
            </button>
            <button onClick={runCurrentWorkflow} className="button-primary w-full gap-2">
              <Play className="w-4 h-4" /> Run Workflow
            </button>
            <button onClick={duplicateWorkflow} className="button-secondary w-full gap-2">
              <Plus className="w-4 h-4" /> Duplicate
            </button>
            <button onClick={deleteWorkflow} className="button-secondary w-full gap-2 text-rose-300 border-rose-500/20">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>

          <div className="rounded-3xl border border-border/50 p-4 bg-background/70">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Templates</div>
              <span className="text-[11px] text-accent">Start fast</span>
            </div>
            <div className="space-y-3">
              {workflowTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => loadTemplateWorkflow(template)}
                  className="w-full text-left rounded-2xl p-3 border border-border/60 bg-slate-950/80 hover:border-accent/60 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm truncate">{template.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{template.description}</div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{template.active ? 'Active' : 'Draft'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 p-4 bg-background/70">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Saved workflows</div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {workflows.length ? (
                workflows.map((workflow) => (
                  <button
                    key={workflow.id}
                    onClick={() => setSelectedWorkflowId(workflow.id)}
                    className={`w-full text-left rounded-2xl p-3 transition ${workflow.id === selectedWorkflowId ? 'bg-slate-800/80 border border-white/10' : 'glass hover:bg-white/5'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{workflow.name}</span>
                      <span className="text-[11px] text-muted-foreground">{workflow.active ? 'Active' : 'Draft'}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 truncate">
                      {workflow.nodes.filter((node) => node.type === 'trigger').length} trigger · {workflow.nodes.filter((node) => node.type === 'condition').length} condition · {workflow.nodes.filter((node) => node.type === 'action').length} action
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No workflows saved yet. Create one to get started.</div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 p-4 bg-background/70 space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>Workflow health</span>
              <span>{workflowCount} items</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-slate-900/60 p-3">
                <div className="text-xs text-muted-foreground">Active</div>
                <div className="text-xl font-semibold">{activeCount}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/60 p-3">
                <div className="text-xs text-muted-foreground">Last run</div>
                <div className="text-xl font-semibold">{history[0]?.time ?? 'none'}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-3">
              <div className="text-xs text-muted-foreground">Success rate</div>
              <div className="text-xl font-semibold">{currentWorkflow.successRate}%</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Workflow history</div>
              <p className="text-xs text-muted-foreground">Recent execution events for this session.</p>
            </div>
            <button onClick={() => setHistory(loadExecutionHistory())} className="text-xs text-accent underline">Refresh</button>
          </div>
          <div className="space-y-3">
            {history.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border/40 p-3 bg-slate-950/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold truncate">{entry.workflowName}</div>
                  <span className={`text-[11px] font-semibold ${entry.status === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {entry.status}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{entry.time}</p>
                <p className="text-[11px] text-muted-foreground mt-2 truncate">{entry.summary}</p>
              </div>
            ))}
            {!history.length && <div className="text-sm text-muted-foreground">Run a workflow to populate history.</div>}
          </div>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="glass rounded-3xl p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <GitBranch className="w-4 h-4 text-accent" />
                Automation Designer
              </div>
              <h2 className="mt-2 text-2xl font-semibold">{currentWorkflow.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{currentWorkflow.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{workflowSummary}</span>
              <span>•</span>
              <span>{currentWorkflow.nodes.length} nodes</span>
              <span>•</span>
              <span>{currentWorkflow.edges.length} connections</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Workflow status</div>
              <div className="mt-3 text-xl font-semibold">{currentWorkflow.active ? 'Active' : 'Paused'}</div>
              <button
                onClick={() => updateCurrentWorkflow({ active: !currentWorkflow.active })}
                className="mt-3 button-secondary w-full"
              >
                {currentWorkflow.active ? 'Pause workflow' : 'Activate workflow'}
              </button>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Last updated</div>
              <div className="mt-3 text-xl font-semibold">{new Date(currentWorkflow.updatedAt).toLocaleDateString()}</div>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Last run</div>
              <div className="mt-3 text-xl font-semibold">{currentWorkflow.lastRunAt ? new Date(currentWorkflow.lastRunAt).toLocaleTimeString() : 'Never'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
            <div className="glass rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Node palette</div>
                  <p className="text-xs text-muted-foreground">Drag new workflow steps onto the canvas.</p>
                </div>
                <button onClick={() => setConnectingSource(null)} className="text-xs text-muted-foreground underline">
                  Cancel connect
                </button>
              </div>

              <div className="space-y-4">
                {nodePalette.map((group) => (
                  <div key={group.category} className="space-y-2">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{group.category}</div>
                    <div className="grid gap-3">
                      {group.items.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => addNodeToCanvas(item)}
                          className="rounded-3xl border border-border/60 p-4 text-left hover:border-accent/60 transition"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">{item.label}</div>
                              <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                            </div>
                            <Plus className="w-4 h-4 text-accent" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-sm font-semibold">Canvas</div>
                  <p className="text-xs text-muted-foreground">Click a node to start or complete a connection.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <button
                    onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
                    className="rounded-full border border-border/40 px-2 py-1"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setZoom((prev) => Math.max(0.7, prev - 0.1))}
                    className="rounded-full border border-border/40 px-2 py-1"
                  >
                    -
                  </button>
                </div>
              </div>

              <div
                ref={canvasRef}
                onPointerDown={startPanning}
                onWheel={(event) => {
                  event.preventDefault();
                  setZoom((prev) => Math.min(2.4, Math.max(0.7, prev + (event.deltaY < 0 ? 0.08 : -0.08))));
                }}
                className="relative min-h-[520px] overflow-hidden rounded-3xl border border-border/50 bg-slate-950/50"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.15),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_24%)]" />
                <div className="absolute inset-0 bg-grid bg-repeat opacity-40" />
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {currentWorkflow.edges.map((edge) => {
                      const source = currentWorkflow.nodes.find((node) => node.id === edge.source);
                      const target = currentWorkflow.nodes.find((node) => node.id === edge.target);
                      if (!source || !target) return null;
                      const x1 = source.x + 160;
                      const y1 = source.y + 32;
                      const x2 = target.x + 10;
                      const y2 = target.y + 32;
                      return (
                        <path
                          key={edge.id}
                          d={`M ${x1} ${y1} C ${x1 + 80} ${y1}, ${x2 - 80} ${y2}, ${x2} ${y2}`}
                          fill="none"
                          stroke="rgba(165,243,252,0.8)"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                </div>
                <div className="absolute inset-0" style={canvasTransform}>
                  {currentWorkflow.nodes.map((node) => (
                    <div
                      key={node.id}
                      className={`absolute w-52 rounded-3xl border p-4 shadow-2xl backdrop-blur transition ${nodeStyles[node.type]}`}
                      style={{ left: node.x, top: node.y, cursor: 'grab' }}
                      onPointerDown={(event) => startNodeDrag(event, node.id)}
                      onClick={() => connectingSource && addEdge(node.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-2xl bg-white/10 text-current">{nodeIcons[node.type]}</span>
                          <div>
                            <div className="text-sm font-semibold">{node.label}</div>
                            <div className="text-[11px] text-muted-foreground">{node.type}</div>
                          </div>
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            if (connectingSource === node.id) {
                              setConnectingSource(null);
                              return;
                            }
                            setConnectingSource(node.id);
                          }}
                          className={`rounded-full border px-2 py-1 text-[11px] transition ${connectingSource === node.id ? 'border-emerald-400 text-emerald-300' : 'border-white/10 text-muted-foreground'}`}
                        >
                          {connectingSource === node.id ? 'Connecting' : 'Connect'}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-3 leading-snug">{node.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            removeNode(node.id);
                          }}
                          className="rounded-full border border-white/10 px-2 py-1"
                        >
                          Remove
                        </button>
                        <span className="rounded-full bg-white/10 px-2 py-1">{Object.keys(node.config).length} config</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <div className="text-sm font-semibold">Edit workflow details</div>
                  <p className="text-xs text-muted-foreground">Update the workflow name, description, and status.</p>
                </div>
                <button onClick={() => setEditingName((prev) => !prev)} className="text-xs text-accent underline">
                  {editingName ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingName ? (
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">Name</label>
                  <input
                    value={currentWorkflow.name}
                    onChange={(event) => updateCurrentWorkflow({ name: event.target.value })}
                    className="w-full rounded-3xl border border-border/50 bg-slate-950/80 px-4 py-3 text-sm outline-none focus:border-accent"
                  />
                  <label className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">Description</label>
                  <textarea
                    value={currentWorkflow.description}
                    onChange={(event) => updateCurrentWorkflow({ description: event.target.value })}
                    className="w-full rounded-3xl border border-border/50 bg-slate-950/80 px-4 py-3 text-sm outline-none focus:border-accent"
                    rows={4}
                  />
                </div>
              ) : (
                <div className="rounded-3xl border border-border/50 bg-slate-950/80 p-4">
                  <div className="text-sm font-semibold">{currentWorkflow.name}</div>
                  <p className="text-sm text-muted-foreground mt-2">{currentWorkflow.description}</p>
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Connections</div>
                  <p className="text-xs text-muted-foreground">Manage node wiring for this workflow.</p>
                </div>
                <button onClick={() => setConnectingSource(null)} className="text-xs text-muted-foreground underline">
                  Clear selection
                </button>
              </div>
              <div className="space-y-3">
                {currentWorkflow.edges.map((edge) => {
                  const source = currentWorkflow.nodes.find((node) => node.id === edge.source);
                  const target = currentWorkflow.nodes.find((node) => node.id === edge.target);
                  if (!source || !target) return null;
                  return (
                    <div key={edge.id} className="rounded-3xl border border-border/40 p-3 bg-slate-950/60 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{source.label} → {target.label}</div>
                        <div className="text-[11px] text-muted-foreground">{source.type} → {target.type}</div>
                      </div>
                      <button onClick={() => removeEdge(edge.id)} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                        Remove
                      </button>
                    </div>
                  );
                })}
                {!currentWorkflow.edges.length && <div className="text-sm text-muted-foreground">Connect nodes to define automation flow.</div>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
