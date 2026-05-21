"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUser = fetchUser;
exports.fetchRepos = fetchRepos;
exports.calcTotalStars = calcTotalStars;
exports.getTopRepos = getTopRepos;
exports.getRecentRepos = getRecentRepos;
const axios_1 = __importStar(require("axios"));
const BASE = 'https://api.github.com';
async function fetchUser(username) {
    try {
        const res = await axios_1.default.get(`${BASE}/users/${username}`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
            timeout: 10000,
        });
        return res.data;
    }
    catch (err) {
        handleGithubError(err);
    }
}
async function fetchRepos(username) {
    try {
        const res = await axios_1.default.get(`${BASE}/users/${username}/repos?sort=updated&per_page=100`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
            timeout: 10000,
        });
        return res.data.filter((r) => !r.private);
    }
    catch (err) {
        handleGithubError(err);
    }
}
function calcTotalStars(repos) {
    return repos.reduce((acc, r) => acc + r.stargazers_count, 0);
}
function getTopRepos(repos, n = 5) {
    return [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, n);
}
function getRecentRepos(repos, n = 5) {
    return [...repos]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, n);
}
function handleGithubError(err) {
    if (err instanceof axios_1.AxiosError) {
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
            throw new Error('Unable to connect. Check your internet connection.');
        }
        if (err.response?.status === 403) {
            const reset = err.response.headers['x-ratelimit-reset'];
            const resetTime = reset
                ? new Date(parseInt(reset) * 1000).toLocaleTimeString()
                : 'soon';
            throw new Error(`GitHub API rate limited. Limit resets at ${resetTime}. Try again then.`);
        }
        if (err.response?.status === 404) {
            throw new Error('GitHub user not found. Double-check the username.');
        }
    }
    throw new Error('GitHub API request failed. Please try again.');
}
//# sourceMappingURL=github.js.map