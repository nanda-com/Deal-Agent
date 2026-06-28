import type { Workflow, WorkflowExecutionEntry, WorkflowNode } from '@/types';

const HISTORY_KEY = 'omniworkflows.history';

function nowFormatted() {
  return new Date().toLocaleString(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function evaluateConditions(node: WorkflowNode, context: Record<string, any> = {}) {
  const value = String(context[node.config.field || 'score'] ?? node.config.value ?? '');
  const operator = node.config.operator || 'eq';

  switch (operator) {
    case 'gt':
      return Number(value) > Number(node.config.value ?? 0);
    case 'lt':
      return Number(value) < Number(node.config.value ?? 0);
    case 'contains':
      return value.toLowerCase().includes(String(node.config.value ?? '').toLowerCase());
    case 'eq':
    default:
      return String(value).toLowerCase() === String(node.config.value ?? '').toLowerCase();
  }
}

export function runActions(node: WorkflowNode, context: Record<string, any> = {}) {
  switch (node.label.toLowerCase()) {
    case 'send calendar link':
      return `Sent calendar link to ${context.leadName ?? 'lead'}`;
    case 'assign to rep':
      return `Assigned lead to ${node.config.team ?? 'sales team'}`;
    case 'create lead':
      return `Created lead in ${node.config.system ?? 'CRM'}`;
    default:
      return `Executed action: ${node.label}`;
  }
}

export async function executeWorkflow(workflow: Workflow, context: Record<string, any> = {}) {
  const nodes = workflow.nodes;
  const edges = workflow.edges;
  const runId = `log-${Date.now()}`;
  const executionSteps: string[] = [];
  let status: 'success' | 'failure' = 'success';

  const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const nextConnections = edges.reduce<Record<string, string[]>>((acc, edge) => {
    acc[edge.source] = [...(acc[edge.source] || []), edge.target];
    return acc;
  }, {});

  const startNode = nodes.find((node) => node.type === 'trigger');
  if (!startNode) {
    status = 'failure';
    executionSteps.push('No trigger node defined.');
  } else {
    executionSteps.push(`Triggered by '${startNode.label}'`);
    let currentNodes = nextConnections[startNode.id] ?? [];

    while (currentNodes.length) {
      const nextNodeId = currentNodes.shift()!;
      const nextNode = nodeById[nextNodeId];
      if (!nextNode) {
        executionSteps.push(`Broken connection at ${nextNodeId}`);
        status = 'failure';
        break;
      }

      if (nextNode.type === 'condition') {
        const passed = evaluateConditions(nextNode, context);
        executionSteps.push(`Condition '${nextNode.label}' ${passed ? 'passed' : 'failed'}`);
        if (!passed) {
          status = 'failure';
          break;
        }
      } else if (nextNode.type === 'action') {
        executionSteps.push(runActions(nextNode, context));
      }

      currentNodes = [...currentNodes, ...(nextConnections[nextNode.id] ?? [])];
    }
  }

  const entry: WorkflowExecutionEntry = {
    id: runId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    time: nowFormatted(),
    status,
    result: status === 'success' ? 'Workflow completed successfully' : 'Workflow completed with issues',
    summary: executionSteps.join(' • '),
  };

  appendExecutionHistory(entry);
  return entry;
}

export function saveWorkflow(workflow: Workflow) {
  const raw = localStorage.getItem('omniworkflows.data');
  const workflows: Workflow[] = raw ? JSON.parse(raw) : [];
  const existingIndex = workflows.findIndex((item) => item.id === workflow.id);
  const now = new Date().toISOString();
  const saved: Workflow = {
    ...workflow,
    updatedAt: now,
    createdAt: existingIndex >= 0 ? workflows[existingIndex].createdAt : now,
  };

  if (existingIndex >= 0) {
    workflows[existingIndex] = saved;
  } else {
    workflows.unshift(saved);
  }

  localStorage.setItem('omniworkflows.data', JSON.stringify(workflows));
  return saved;
}

export function loadSavedWorkflows() {
  const raw = localStorage.getItem('omniworkflows.data');
  return raw ? (JSON.parse(raw) as Workflow[]) : [];
}

export function appendExecutionHistory(entry: WorkflowExecutionEntry) {
  const raw = localStorage.getItem(HISTORY_KEY);
  const history: WorkflowExecutionEntry[] = raw ? JSON.parse(raw) : [];
  const nextHistory = [entry, ...history].slice(0, 25);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
}

export function loadExecutionHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? (JSON.parse(raw) as WorkflowExecutionEntry[]) : [];
}
