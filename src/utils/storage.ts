import Conf from 'conf';

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'done';
  createdAt: string;
  completedAt?: string;
  pomodoroCount: number;
}

interface StoreSchema {
  githubUsername: string;
  tasks: Task[];
}

const store = new Conf<StoreSchema>({
  projectName: 'devforge',
  defaults: {
    githubUsername: '',
    tasks: [],
  },
});

export function getGithubUsername(): string {
  return store.get('githubUsername');
}

export function setGithubUsername(username: string): void {
  store.set('githubUsername', username);
}

export function getTasks(): Task[] {
  return store.get('tasks');
}

export function saveTask(task: Task): void {
  const tasks = getTasks();
  tasks.push(task);
  store.set('tasks', tasks);
}

export function updateTask(id: string, updates: Partial<Task>): boolean {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  tasks[idx] = { ...tasks[idx], ...updates };
  store.set('tasks', tasks);
  return true;
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length === tasks.length) return false;
  store.set('tasks', filtered);
  return true;
}

export function getTaskById(id: string): Task | undefined {
  return getTasks().find((t) => t.id === id);
}

export function clearTasks(): void {
  store.set('tasks', []);
}
