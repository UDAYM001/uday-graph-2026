# Contribution graph art: 2023 to now

This project creates artificial, backdated Git commits for contribution-graph artwork.
These generated commits are not a record of daily software development work.

The default range is 1 January 2023 through the day you preview, using India time.
Each month has exactly eight randomly selected dates with zero generated commits.
All other included dates receive 1, 4, 12, or 30 commits in a shuffled, balanced mix.
The current month includes only elapsed dates, including today. When fewer than
eight dates are available, they are all skipped. Leap days are included.

GitHub controls the final shades. Existing activity from other repositories,
repository creation, issues, and other qualifying activity can fill the gaps or
change colors on your profile. This project guarantees its own per-date commit
counts, not the appearance of your whole GitHub profile.

## Quick use

Read GUIDE.md for the full Windows PowerShell walkthrough. Use a new extracted
folder and a new empty standalone GitHub repository. Keep previous repositories.

1. Install Node.js LTS and Git.
2. Run `git init -b main` in this folder.
3. Configure your name and a GitHub-associated email address.
4. Run `node index.js --preview` to save and inspect the plan.
5. Run `node index.js --generate` once to build and verify the local history.
6. Run `node index.js --verify` if you want to check it again.
7. Add your new GitHub repository as origin and push main separately.

No npm packages or installation command are required. The script uses Node's
built-in modules and Git's fast-import command. It will refuse an existing history
and will not push, delete an older repository, or use a force push. The first
project commit is included within the first active day's count.

This is a one-time generator, not a daily updater. The preview fixes the end date
and random seed in art-plan.json. Repeating generation in the same repository is
blocked. Do not rerun it to extend the date range.

## Settings

Edit CONFIG near the beginning of index.js before previewing/generating:

```javascript
const CONFIG = {
  startDate: "2023-01-01",
  endDate: "", // Today when previewed; or set a fixed YYYY-MM-DD.
  skipDaysPerMonth: 8,
  levels: [1, 4, 12, 30],
  seed: 20231015,
};
```

Blank days use zero commits. The four positive values represent relative activity
levels, not guaranteed GitHub color values. Different seeds change the shuffled
pattern; the same settings reproduce the same pattern. Each month with at least
four active days includes all four counts.

## References

- https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference
- https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions
- https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/viewing-contributions-on-your-profile
- https://git-scm.com/docs/git-fast-import

The MIT notice from the supplied project is retained in LICENSE.
