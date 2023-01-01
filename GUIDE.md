# Windows PowerShell walkthrough

This replaces the supplied UDAY-letter pattern with randomly spaced contribution
art from 1 January 2023 through the date you preview. Use a new folder and new
empty repository. Existing artwork in older GitHub repositories remains visible
and may overlap this pattern.

## 1. Install the two required programs

If they are not already installed, install Node.js LTS from
https://nodejs.org/en/download and Git for Windows from
https://git-scm.com/install/windows. Close and reopen PowerShell afterward.

Run these two lines, one at a time:

```powershell
node --version
git --version
```

Both must print version numbers. This project needs Node.js 20 or newer and a
modern Git version that supports `git init -b main`. Do not continue past errors.

## 2. Download and extract the ZIP

Save `contribution-art-2023-to-now.zip` into your Windows Downloads folder. If your
browser adds `(1)` to its name, rename it to the exact filename above.

Open Windows PowerShell and run:

```powershell
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\contribution-art-2023-to-now.zip" -DestinationPath "$env:USERPROFILE\contribution-art-setup"
Set-Location "$env:USERPROFILE\contribution-art-setup\contribution-art-2023-to-now"
Get-ChildItem -Force
```

The last command must show index.js, package.json, data.json, README.md, GUIDE.md,
LICENSE, and .gitignore. If you saved the ZIP elsewhere, change only the ZIP path.
If the destination already exists from an earlier attempt, extract into another
new folder name and adjust Set-Location to match. Do not overwrite an old project.

No `npm install` or `npm ci` is needed. Do not copy your old `.git`,
`package-lock.json`, or `node_modules` into this folder.

## 3. Understand the settings (already configured)

In index.js, CONFIG has:

```javascript
const CONFIG = {
  startDate: "2023-01-01",
  endDate: "",
  skipDaysPerMonth: 8,
  levels: [1, 4, 12, 30],
  seed: 20231015,
};
```

Leave these settings as supplied for the requested result. An empty endDate means
today in India when you run --preview. To reproduce the original request's fixed
end date, use `endDate: "2026-10-15"` before previewing.

Eight distinct dates per month receive no generated commits. Every other date gets
1, 4, 12, or 30 commits, shuffled across the month. Months with at least four
active dates include all four counts. The same seed reproduces the same layout.

Example day counts:

| Included period | Blank dates | Dates with commits |
| --- | ---: | ---: |
| A complete 31-day month | 8 | 23 |
| A complete 30-day month | 8 | 22 |
| February 2023: 28 days | 8 | 20 |
| February 2024: 29 days | 8 | 21 |
| 1-15 October 2026 | 8 | 7 |

If the current month has fewer than eight elapsed dates, all elapsed dates are
blank. Future dates are excluded. This is a one-time generator, not an automatic
daily updater.

The counts request a range of intensities. GitHub selects the actual shades;
these numbers are not a promise of particular colors. Your other contributions,
including repository creation today, can fill skipped dates. Existing UDAY art
from your old repository is not erased by creating this project.

## 4. Initialize the new local repository

In the same PowerShell window, run:

```powershell
git init -b main
```

Do not run `git add .` or create an initialization commit. The generator includes
the project files in the first scheduled commit so there is no extra commit on a
randomly skipped date.

## 5. Configure the identity

Visit https://github.com/settings/emails while signed in to your own account.
Use an email listed there, or copy your exact GitHub-provided noreply address.
The associated address is what links the generated commits to your profile.
Do not invent a noreply address.

Replace BOTH placeholder values before running these commands:

```powershell
git config user.name "YOUR_GITHUB_USERNAME"
git config user.email "YOUR_GITHUB_EMAIL"
git config --get user.name
git config --get user.email
```

For example, if your GitHub username is UDAYM001, the first line becomes
`git config user.name "UDAYM001"`. Keep the quotes but remove the placeholder text.
These are local settings for this repository. Confirm the printed email matches
your GitHub settings before generating commits.

## 6. Preview the monthly schedule

```powershell
node index.js --preview
```

This writes art-plan.json and prints one row per month. No commits are created.
Check the start/end dates, blankDays, and activeDays columns. To inspect the exact
skipped dates and every daily count:

```powershell
notepad art-plan.json
```

Close Notepad without editing the plan. Change CONFIG and run --preview again if
you want a different seed or settings before generation. Once you generate, the
plan and history are fixed and preview/generation reruns are blocked.

## 7. Generate the history once

```powershell
node index.js --generate
```

Leave PowerShell open until it prints VERIFIED and Generation complete. It uses
Git's fast-import command to create thousands of local commits efficiently. Each
commit changes data.json and is explicitly labeled as generated contribution art.
No network upload happens here.

The script checks that the repository is empty and sets both author and committer
timestamps in India time. It automatically validates the generated counts on every
date, including every planned blank day.

## 8. Check the local result

```powershell
node index.js --verify
git status
git rev-list --count main
git log -3 --format=fuller
```

Expect a VERIFIED message, a clean working tree, and a commit count equal to the
preview total. The latest commit can be earlier than today if the final dates
were randomly skipped. This is expected.

## 9. Create an empty GitHub repository

Go to https://github.com/new while signed in.

1. Set the owner to your own GitHub account.
2. Set Repository name to `contribution-art-2023-now`.
3. Set Description to `Generated contribution graph artwork`.
4. Choose Public if you want the artwork and disclosure visible publicly.
5. Leave Add a README off. Do not add a .gitignore or a license on this page.
6. Click Create repository.

If that name is already in use, choose a different new name and use the matching
URL in the next step. Do not fork an existing project. The ZIP already contains
README.md, .gitignore, and LICENSE.

## 10. Connect and upload

Copy the HTTPS repository URL from the new repository's Quick setup area.
Replace YOUR_GITHUB_USERNAME in the command below with the actual owner name.
If you chose a different repository name, replace that part too.

```powershell
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/contribution-art-2023-now.git
git remote -v
git push -u origin main
```

Check the remote URL before running the push line. Complete the browser sign-in
if Git asks. Do not run `git push --force`. The remote should be empty, so a normal
first push is sufficient. If the push fails, fix the URL/authentication and rerun
the push only; do not regenerate commits.

## 11. Inspect the profile

Open your GitHub profile and scroll to the contributions calendar. Select 2023,
2024, 2025, or 2026 using the year selector. They are separate annual views.
Allow up to 24 hours for qualifying contributions to appear.

The pushed main branch must be the repository's default branch and the author
email must be associated with your GitHub account. If using a private repository,
turn on the profile setting to show private contributions if you want its counts
visible to others.

## Common errors

| Message or problem | What to do |
| --- | --- |
| node or git is not recognized | Install the missing program, reopen PowerShell, check the version again. |
| Cannot find index.js | Run Set-Location again for the folder that actually contains index.js. |
| Expected an empty repository / already has history | Use a fresh extracted folder. Do not delete the history of an unrelated project. |
| Run --preview first | Run the preview command before generation. |
| Settings changed after preview | Before generation, run --preview again. |
| Email placeholder or missing identity | Set your actual name and GitHub-associated email before generation. |
| Remote origin already exists | Inspect `git remote -v`. If it is the correct new repository, continue with push. |
| Repository not found | Check the copied owner/repository URL and sign in to the correct account. |
| Push rejected because remote contains commits | Create a genuinely empty repository and point origin at its copied URL using `git remote set-url origin COPIED_URL`. |
| Push would expose a private email | Copy your exact GitHub noreply address, generate in a new extracted folder with that email, then push that clean result. |
| A planned blank square is colored | Other qualifying activity on that date also contributes to your profile. |
| Some GitHub shades look the same | GitHub chooses shades from total activity; four commit counts do not force four exact colors. |

If generation is interrupted, run --verify to check whether it completed. If
verification fails, restart in a fresh extracted folder before any push. Do not
push an unverified partial result.

## Official references

- Node.js downloads: https://nodejs.org/en/download
- Git for Windows: https://git-scm.com/install/windows
- Contribution eligibility and dates: https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference
- Missing contributions: https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions
- Viewing past years: https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/viewing-contributions-on-your-profile
- Private contribution visibility: https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements
