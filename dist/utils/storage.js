"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGithubUsername = getGithubUsername;
exports.setGithubUsername = setGithubUsername;
exports.getTasks = getTasks;
exports.saveTask = saveTask;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.getTaskById = getTaskById;
exports.clearTasks = clearTasks;
const conf_1 = __importDefault(require("conf"));
const store = new conf_1.default({
    projectName: 'devforge',
    defaults: {
        githubUsername: '',
        tasks: [],
    },
});
function getGithubUsername() {
    return store.get('githubUsername');
}
function setGithubUsername(username) {
    store.set('githubUsername', username);
}
function getTasks() {
    return store.get('tasks');
}
function saveTask(task) {
    const tasks = getTasks();
    tasks.push(task);
    store.set('tasks', tasks);
}
function updateTask(id, updates) {
    const tasks = getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1)
        return false;
    tasks[idx] = { ...tasks[idx], ...updates };
    store.set('tasks', tasks);
    return true;
}
function deleteTask(id) {
    const tasks = getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length)
        return false;
    store.set('tasks', filtered);
    return true;
}
function getTaskById(id) {
    return getTasks().find((t) => t.id === id);
}
function clearTasks() {
    store.set('tasks', []);
}
//# sourceMappingURL=storage.js.map