import chalk from 'chalk';
import inquirer from 'inquirer';
import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { showSmallHeader, errorBox, createOraSpinner } from '../utils/display';
import { getGithubUsername, setGithubUsername } from '../utils/storage';
import {
  fetchUser,
  fetchRepos,
  calcTotalStars,
  getRecentRepos,
  GithubUser,
  GithubRepo,
} from '../utils/github';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len - 1) + '…' : str + ' '.repeat(len - str.length);
}

function buildDashboard(
  user: GithubUser,
  repos: GithubRepo[],
  recent: GithubRepo[],
  totalStars: number
): void {
  const screen = blessed.screen({
    smartCSR: true,
    title: `GitPulse — @${user.login}`,
  });

  const grid = new contrib.grid({ rows: 12, cols: 12, screen });

  // ── Top bar ──────────────────────────────────────────────────
  const topBar = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: `  ⚡ GitPulse — @${user.login}  |  ${new Date().toLocaleTimeString()}`,
    style: { fg: 'cyan', bold: true, bg: 'black' },
    tags: true,
  });
  screen.append(topBar);

  // ── Left panel — Profile ──────────────────────────────────────
  const profileBox = grid.set(1, 0, 3, 5, blessed.box, {
    label: ' 👤 Profile ',
    border: { type: 'line' },
    style: { label: { fg: 'cyan' }, border: { fg: 'cyan' } },
    content:
      `  Name:     ${user.name || user.login}\n` +
      `  Bio:      ${user.bio ? padRight(user.bio, 38) : 'N/A'}\n` +
      `  Location: ${user.location || 'N/A'}`,
    padding: { left: 1, right: 1 },
  });

  // ── Left panel — Stats ────────────────────────────────────────
  const statsBox = grid.set(4, 0, 3, 5, blessed.box, {
    label: ' 📊 Stats ',
    border: { type: 'line' },
    style: { label: { fg: 'yellow' }, border: { fg: 'yellow' } },
    content:
      `  Followers:   ${user.followers.toLocaleString()}\n` +
      `  Following:   ${user.following.toLocaleString()}\n` +
      `  Public Repos: ${user.public_repos}\n` +
      `  Total ⭐:    ${totalStars.toLocaleString()}\n` +
      (user.hireable ? '\n  🟢 Open to Work' : ''),
    padding: { left: 1, right: 1 },
  });

  // ── Left panel — Top repos by stars ──────────────────────────
  const topList = grid.set(7, 0, 5, 5, blessed.list, {
    label: ' 🏆 Top Repos by Stars ',
    border: { type: 'line' },
    style: {
      label: { fg: 'magenta' },
      border: { fg: 'magenta' },
      item: { fg: 'white' },
      selected: { fg: 'black', bg: 'cyan' },
    },
    items: repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map((r) => `  ${padRight(r.name, 20)} ⭐ ${r.stargazers_count}`),
    mouse: true,
    scrollable: true,
  });

  // ── Right panel — Recent repos table ─────────────────────────
  const repoTable = grid.set(1, 5, 6, 7, contrib.table, {
    label: ' 📁 Recent Repositories ',
    border: { type: 'line' },
    style: {
      label: { fg: 'green' },
      border: { fg: 'green' },
      header: { fg: 'cyan', bold: true },
      cell: { fg: 'white' },
    },
    columnSpacing: 2,
    columnWidth: [22, 6, 6, 12, 12],
  } as Parameters<typeof contrib.table>[0]);

  repoTable.setData({
    headers: ['Name', '⭐', '🍴', 'Language', 'Updated'],
    data: recent.map((r) => [
      padRight(r.name, 21),
      String(r.stargazers_count),
      String(r.forks_count),
      padRight(r.language || 'N/A', 11),
      formatDate(r.updated_at),
    ]),
  });

  // ── Right panel — Stars bar chart ─────────────────────────────
  const barChart = grid.set(7, 5, 5, 7, contrib.bar, {
    label: ' ⭐ Stars per Recent Repo ',
    border: { type: 'line' },
    style: {
      label: { fg: 'yellow' },
      border: { fg: 'yellow' },
      bar: { bg: 'cyan', fg: 'black' },
      text: 'cyan',
    },
    barWidth: 6,
    barSpacing: 2,
    xOffset: 2,
    maxHeight: Math.max(...recent.map((r) => r.stargazers_count), 1),
  } as Parameters<typeof contrib.bar>[0]);

  barChart.setData({
    titles: recent.map((r) => r.name.slice(0, 5)),
    data: recent.map((r) => r.stargazers_count),
  });

  // ── Bottom bar ────────────────────────────────────────────────
  const bottomBar = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: '  Press Q to quit | R to refresh | Last updated: ' + new Date().toLocaleTimeString(),
    style: { fg: 'black', bg: 'cyan' },
  });
  screen.append(bottomBar);

  // ── Key bindings ──────────────────────────────────────────────
  const quit = (): void => {
    screen.destroy();
    console.log(chalk.cyan('\n  Thanks for using GitPulse! 👋\n'));
    process.exit(0);
  };

  screen.key(['q', 'Q', 'escape'], quit);
  screen.key(['r', 'R'], async () => {
    bottomBar.setContent('  Refreshing...');
    screen.render();
    try {
      const [freshUser, freshRepos] = await Promise.all([
        fetchUser(user.login),
        fetchRepos(user.login),
      ]);
      const freshRecent = getRecentRepos(freshRepos, 5);
      const freshStars = calcTotalStars(freshRepos);

      profileBox.setContent(
        `  Name:     ${freshUser.name || freshUser.login}\n` +
          `  Bio:      ${freshUser.bio ? padRight(freshUser.bio, 38) : 'N/A'}\n` +
          `  Location: ${freshUser.location || 'N/A'}`
      );

      statsBox.setContent(
        `  Followers:   ${freshUser.followers.toLocaleString()}\n` +
          `  Following:   ${freshUser.following.toLocaleString()}\n` +
          `  Public Repos: ${freshUser.public_repos}\n` +
          `  Total ⭐:    ${freshStars.toLocaleString()}\n` +
          (freshUser.hireable ? '\n  🟢 Open to Work' : '')
      );

      repoTable.setData({
        headers: ['Name', '⭐', '🍴', 'Language', 'Updated'],
        data: freshRecent.map((r) => [
          padRight(r.name, 21),
          String(r.stargazers_count),
          String(r.forks_count),
          padRight(r.language || 'N/A', 11),
          formatDate(r.updated_at),
        ]),
      });

      barChart.setData({
        titles: freshRecent.map((r) => r.name.slice(0, 5)),
        data: freshRecent.map((r) => r.stargazers_count),
      });

      topBar.setContent(`  ⚡ GitPulse — @${freshUser.login}  |  ${new Date().toLocaleTimeString()}`);
      bottomBar.setContent(
        '  Press Q to quit | R to refresh | Last updated: ' + new Date().toLocaleTimeString()
      );
      screen.render();
    } catch (e) {
      bottomBar.setContent('  Refresh failed: ' + (e instanceof Error ? e.message : 'unknown error'));
      screen.render();
    }
  });

  // Avoid unused-variable warning
  void profileBox;
  void statsBox;
  void topList;

  screen.render();
}

export async function runPulse(): Promise<void> {
  showSmallHeader('GitPulse — GitHub Dashboard');

  try {
    let username = getGithubUsername();

    if (!username) {
      const answer = await inquirer.prompt<{ username: string }>([
        {
          type: 'input',
          name: 'username',
          message: chalk.cyan('Enter your GitHub username:'),
          validate: (v: string) => v.trim().length > 0 || 'Username cannot be empty',
        },
      ]);
      username = answer.username.trim();
      setGithubUsername(username);
    }

    const spinner = createOraSpinner(`Fetching data for @${username}...`);
    spinner.start();

    const [user, repos] = await Promise.all([fetchUser(username), fetchRepos(username)]);
    const recent = getRecentRepos(repos, 5);
    const totalStars = calcTotalStars(repos);

    spinner.succeed(chalk.green(`Loaded profile for @${username}`));

    buildDashboard(user, repos, recent, totalStars);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errorBox(`GitPulse error: ${msg}`);
    process.exit(1);
  }
}
