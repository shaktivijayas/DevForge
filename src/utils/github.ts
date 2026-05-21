import axios, { AxiosError } from 'axios';

const BASE = 'https://api.github.com';

export interface GithubUser {
  login: string;
  name: string;
  bio: string | null;
  location: string | null;
  followers: number;
  following: number;
  public_repos: number;
  avatar_url: string;
  hireable: boolean | null;
}

export interface GithubRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  html_url: string;
  private: boolean;
}

export async function fetchUser(username: string): Promise<GithubUser> {
  try {
    const res = await axios.get<GithubUser>(`${BASE}/users/${username}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      timeout: 10000,
    });
    return res.data;
  } catch (err) {
    handleGithubError(err);
  }
}

export async function fetchRepos(username: string): Promise<GithubRepo[]> {
  try {
    const res = await axios.get<GithubRepo[]>(
      `${BASE}/users/${username}/repos?sort=updated&per_page=100`,
      {
        headers: { Accept: 'application/vnd.github.v3+json' },
        timeout: 10000,
      }
    );
    return res.data.filter((r) => !r.private);
  } catch (err) {
    handleGithubError(err);
  }
}

export function calcTotalStars(repos: GithubRepo[]): number {
  return repos.reduce((acc, r) => acc + r.stargazers_count, 0);
}

export function getTopRepos(repos: GithubRepo[], n = 5): GithubRepo[] {
  return [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, n);
}

export function getRecentRepos(repos: GithubRepo[], n = 5): GithubRepo[] {
  return [...repos]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, n);
}

function handleGithubError(err: unknown): never {
  if (err instanceof AxiosError) {
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect. Check your internet connection.');
    }
    if (err.response?.status === 403) {
      const reset = err.response.headers['x-ratelimit-reset'];
      const resetTime = reset
        ? new Date(parseInt(reset) * 1000).toLocaleTimeString()
        : 'soon';
      throw new Error(
        `GitHub API rate limited. Limit resets at ${resetTime}. Try again then.`
      );
    }
    if (err.response?.status === 404) {
      throw new Error('GitHub user not found. Double-check the username.');
    }
  }
  throw new Error('GitHub API request failed. Please try again.');
}
