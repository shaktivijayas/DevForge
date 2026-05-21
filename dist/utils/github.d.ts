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
export declare function fetchUser(username: string): Promise<GithubUser>;
export declare function fetchRepos(username: string): Promise<GithubRepo[]>;
export declare function calcTotalStars(repos: GithubRepo[]): number;
export declare function getTopRepos(repos: GithubRepo[], n?: number): GithubRepo[];
export declare function getRecentRepos(repos: GithubRepo[], n?: number): GithubRepo[];
//# sourceMappingURL=github.d.ts.map