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
export declare function getGithubUsername(): string;
export declare function setGithubUsername(username: string): void;
export declare function getTasks(): Task[];
export declare function saveTask(task: Task): void;
export declare function updateTask(id: string, updates: Partial<Task>): boolean;
export declare function deleteTask(id: string): boolean;
export declare function getTaskById(id: string): Task | undefined;
export declare function clearTasks(): void;
//# sourceMappingURL=storage.d.ts.map