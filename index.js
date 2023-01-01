import { readFileSync, writeFileSync, existsSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Change these settings BEFORE previewing/generating in a fresh repository.
const CONFIG = {
  startDate: "2023-01-01",
  endDate: "", // Empty means today in India, captured when you preview.
  skipDaysPerMonth: 8,
  levels: [1, 4, 12, 30], // Four activity levels; GitHub chooses the colors.
  seed: 20231015, // Change this number for another reproducible random pattern.
};

const PLAN_FILE = "art-plan.json";
const SOURCE_FILES = [
  "index.js", "package.json", "README.md", "GUIDE.md", "LICENSE", ".gitignore",
];
const DAY_MS = 86400000;
const SCRIPT_PATH = fileURLToPath(import.meta.url);

function git(args, input) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
    input,
  }).trim();
}

export function indiaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function dateNumber(value) {
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(ms) ||
      new Date(ms).toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid date: ${value}. Use YYYY-MM-DD.`);
  }
  return ms;
}

function randomFor(text) {
  let seed = 2166136261;
  for (const char of text) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function shuffle(items, random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function buildPlan(settings = CONFIG, today = indiaToday()) {
  const endDate = settings.endDate || today;
  const start = dateNumber(settings.startDate);
  const end = dateNumber(endDate);
  if (end < start || end > dateNumber(today)) {
    throw new Error("End date must be on/after the start date and not in the future.");
  }
  if (!Number.isInteger(settings.skipDaysPerMonth) || settings.skipDaysPerMonth < 0 ||
      !Number.isInteger(settings.seed) || !Array.isArray(settings.levels) ||
      settings.levels.length !== 4 || new Set(settings.levels).size !== 4 ||
      settings.levels.some((n) => !Number.isInteger(n) || n < 1 || n > 100)) {
    throw new Error("Use a whole-number seed/skip count and four different levels from 1 to 100.");
  }

  const groups = new Map();
  for (let ms = start; ms <= end; ms += DAY_MS) {
    const date = new Date(ms).toISOString().slice(0, 10);
    const month = date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(date);
  }

  const days = [];
  const months = [];
  for (const [month, dates] of groups) {
    const random = randomFor(`${settings.seed}:${month}`);
    const skipped = new Set(shuffle([...dates], random).slice(0, settings.skipDaysPerMonth));
    const active = dates.filter((date) => !skipped.has(date));
    const levels = shuffle([...settings.levels], random);
    const counts = shuffle(active.map((_, i) => levels[i % levels.length]), random);
    let index = 0;
    let total = 0;
    for (const date of dates) {
      const commits = skipped.has(date) ? 0 : counts[index++];
      days.push({ date, commits });
      total += commits;
    }
    months.push({
      month, daysInRange: dates.length, blankDays: skipped.size,
      activeDays: active.length, commits: total,
      skippedDates: [...skipped].sort(),
    });
  }

  return {
    purpose: "Artificial contribution graph art; not a record of daily development work.",
    settings: { ...settings, endDate },
    months, days,
    totalCommits: months.reduce((sum, month) => sum + month.commits, 0),
  };
}

function showPlan(plan) {
  console.log(`\nRange: ${plan.settings.startDate} through ${plan.settings.endDate} (India)`);
  console.table(plan.months.map(({ month, daysInRange, blankDays, activeDays, commits }) =>
    ({ month, daysInRange, blankDays, activeDays, commits })));
  console.log(`Total planned commits: ${plan.totalCommits}`);
  console.log(`Days with commits: ${plan.days.filter((day) => day.commits > 0).length}`);
  console.log(`Days without commits: ${plan.days.filter((day) => day.commits === 0).length}`);
  console.log("This is generated artwork. Other GitHub activity can fill the blank days.");
}

function requireProjectFolder() {
  if (realpathSync(process.cwd()) !== realpathSync(dirname(SCRIPT_PATH))) {
    throw new Error("First cd into the folder containing this index.js.");
  }
}

function requireEmptyRepository() {
  if (!existsSync(".git") ||
      realpathSync(git(["rev-parse", "--show-toplevel"])) !== realpathSync(process.cwd())) {
    throw new Error("Run git init -b main in this fresh project folder first.");
  }
  if (git(["for-each-ref", "--format=%(refname)"]) || git(["ls-files"])) {
    throw new Error("This repository already has history or staged files. Use a fresh extracted folder; do not rerun here.");
  }
  if (git(["symbolic-ref", "--short", "HEAD"]) !== "main") {
    throw new Error("Expected the new repository's branch to be main.");
  }
}

function readPlan() {
  if (!existsSync(PLAN_FILE)) throw new Error("Run node index.js --preview first.");
  const plan = JSON.parse(readFileSync(PLAN_FILE, "utf8"));
  const expected = buildPlan(plan.settings);
  if (JSON.stringify(expected) !== JSON.stringify(plan)) {
    throw new Error("art-plan.json was changed. Make a fresh preview before generating.");
  }
  if (JSON.stringify({ ...CONFIG, endDate: plan.settings.endDate }) !==
      JSON.stringify(plan.settings) || (CONFIG.endDate && CONFIG.endDate !== plan.settings.endDate)) {
    throw new Error("Settings changed after the preview. Run --preview again before generating.");
  }
  return plan;
}

function identity() {
  const name = git(["config", "user.name"]);
  const email = git(["config", "user.email"]);
  if (!name || /[<>\r\n\0]/.test(name) || !/^[^\s<>@]+@[^\s<>@]+$/.test(email)) {
    throw new Error("Set git config user.name and git config user.email first.");
  }
  return `${name} <${email}>`;
}

function generate(plan) {
  requireEmptyRepository();
  if (!plan.totalCommits) throw new Error("This range contains only skipped days; nothing to generate.");
  const author = identity();
  const sources = [...SOURCE_FILES, PLAN_FILE].map((path) => [path, readFileSync(path)]);
  const chunks = [];
  const push = (value) => chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
  const data = (value) => {
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
    push(`data ${bytes.length}\n`);
    push(bytes);
    push("\n");
  };
  const now = Math.floor(Date.now() / 1000);
  let sequence = 0;
  let finalData = "";
  for (const day of plan.days) {
    const noon = Math.floor(Date.parse(`${day.date}T12:00:00+05:30`) / 1000);
    for (let i = 0; i < day.commits; i++) {
      // Before noon today, cap timestamps at the present; never future-date a commit.
      const timestamp = Math.min(noon + i, now);
      sequence++;
      push("commit refs/heads/main\n");
      push(`author ${author} ${timestamp} +0530\n`);
      push(`committer ${author} ${timestamp} +0530\n`);
      data(`Generated contribution art: ${day.date} (${i + 1}/${day.commits})\n`);
      if (sequence === 1) {
        for (const [path, bytes] of sources) {
          push(`M 100644 inline ${path}\n`);
          data(bytes);
        }
      }
      finalData = JSON.stringify({
        date: day.date, timestamp: new Date(timestamp * 1000).toISOString(),
        sequence, dailyCommit: i + 1, dailyTotal: day.commits,
        purpose: "Artificial contribution graph art",
      }, null, 2) + "\n";
      push("M 100644 inline data.json\n");
      data(finalData);
      push("\n");
    }
  }
  console.log(`Generating ${sequence} local commits...`);
  git(["fast-import", "--quiet", "--done"], Buffer.concat([...chunks, Buffer.from("done\n")]));
  writeFileSync("data.json", finalData);
  // Update the index only. No hard reset, history deletion, network call, or push.
  git(["reset", "--mixed", "HEAD"]);
  verify(plan);
  console.log("Generation complete. Push separately using the instructions in GUIDE.md.");
}

function verify(plan) {
  const expected = new Map(plan.days.map((day) => [day.date, day.commits]));
  const actual = new Map();
  const log = git(["log", "main", "--format=%aI|%cI"]);
  for (const line of log.split("\n")) {
    const [authorDate, commitDate] = line.split("|");
    const day = authorDate.slice(0, 10);
    if (authorDate !== commitDate || !authorDate.endsWith("+05:30") ||
        Date.parse(authorDate) > Date.now() || !expected.has(day)) {
      throw new Error(`Unexpected commit timestamp: ${line}`);
    }
    actual.set(day, (actual.get(day) || 0) + 1);
  }
  for (const [day, count] of expected) {
    if ((actual.get(day) || 0) !== count) {
      throw new Error(`Count mismatch on ${day}: expected ${count}, got ${actual.get(day) || 0}.`);
    }
  }
  if (git(["status", "--porcelain", "--untracked-files=no"])) {
    throw new Error("Tracked files differ from the generated commit. Run git status to inspect.");
  }
  console.log(`VERIFIED: all ${plan.days.length} dates match; ${plan.totalCommits} commits.`);
}

function main() {
  requireProjectFolder();
  const command = process.argv[2] || "--preview";
  if (process.argv.length > 3 || !["--preview", "--generate", "--verify"].includes(command)) {
    throw new Error("Use node index.js --preview, --generate, or --verify.");
  }
  if (command === "--preview") {
    // Preview is also allowed before git init. Do not replace a generated plan.
    if (existsSync(".git")) requireEmptyRepository();
    const plan = buildPlan();
    writeFileSync(PLAN_FILE, JSON.stringify(plan, null, 2) + "\n");
    showPlan(plan);
    console.log(`Saved ${PLAN_FILE}. No commits created. Next: node index.js --generate`);
  } else {
    const plan = readPlan();
    if (command === "--generate") generate(plan);
    else verify(plan);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  try {
    main();
  } catch (error) {
    console.error(`ERROR: ${error.stderr?.toString().trim() || error.message}`);
    process.exitCode = 1;
  }
}
