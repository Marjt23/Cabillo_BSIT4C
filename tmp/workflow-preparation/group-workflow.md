# Sequential group Git/GitHub workflow

The running project is preserved at `C:\Users\Administrator\Downloads\Cabillo_BSIT4C`. Work happens in a separate clone at `C:\Users\Administrator\Downloads\Cabillo_BSIT4C-group-workflow`. Remote: https://github.com/Marjt23/Cabillo_BSIT4C.

## Existing evidence and honest baseline

Inspection found one remote commit and one remote branch: `feature/pos-baseline`, the default branch, at `8c16b540dbd3376054e94b807699a726cc2957c8`. It explicitly acknowledges AI assistance. The original working folder was not a Git repository. There is no supplied historical evidence of seven real development stages, separate member feature implementation, earlier PRs, reviews, or merges. Preserve existing history and report these gaps rather than generating retrospective commits.

The completed app was developed with substantial Codex assistance in the conversation. Restoring files omitted from the baseline is packaging maintenance, not proof of newly implemented menu/cart features. Creating branches alone is not a contribution. Verification and documentation are real work, but ask the instructor whether they satisfy an implemented-feature requirement. Three branches do not establish seven stages.

## Identity and authentication on the shared PC

Work only when the relevant member is present. Before each member's work, use repository-local identity, inspect it, and verify the authenticated GitHub account separately:

```powershell
git config --local user.name "Mikyla Cabillo"
git config --local user.email "cabillo.mikylaerica@dnsc.edu.ph"
git config --local --get user.name
git config --local --get user.email
gh auth status
gh api user --jq .login
```

The API login must be `cabillopretty` for Mikyla. Git author configuration does not authenticate to GitHub. Each member should sign in personally using `gh auth login` or switch to their already authenticated account using `gh auth switch --user USERNAME`. Never share passwords or tokens, write them into documentation, impersonate another member, or assume Git's cached push credential matches the active `gh` account. After authentication, run `gh auth setup-git` and recheck the account before a push.

Before publication, the participating member reviews the actual diff and test results, exercises their scenarios, and records what they understood and evaluated. Codex execution alone is not a member evaluation.

## Mikyla's current phase

`feature/menu-cart` was created from the observed baseline, with Mikyla's local identity configured. Review `docs/menu-cart-verification.md` and `tests/menu-cart-browser.js`; run the documented checks. Preserve UI/behavior unless a reproduced issue requires a fix. Inspect `git diff` and staged files so no secrets, node_modules or screenshots are included.

Once authentication and evaluation are recorded, commit actual changes and push this branch using Mikyla's account. Create a PR targeting the actual integration branch. At inspection the only existing candidate was `feature/pos-baseline`; use it unless the team explicitly establishes another integration branch. Record the commit SHA and PR URL in the contribution register. Ask Marjorie or Allen to review through GitHub using their own account. Stop before merge; verify review evidence before any merge operation. Do not manufacture reviews or send messages to teammates without explicit authorization.

## Marjorie handoff: only after Mikyla's reviewed merge

Verify Mikyla's PR is actually reviewed and merged. Fetch, switch to the actual integration branch, and fast-forward with `git pull --ff-only`. Marjorie supplies her actual GitHub username and signs in herself. Configure only repository-local identity as Marjorie Casilao, casilao.marjorie@dnsc.edu.ph, and verify the authenticated login matches her supplied username. Create or continue `feature/payment-flow` from the updated integration branch.

Audit existing coverage first. Add useful missing checks for invalid/insufficient/exact cash, change, QR/card simulations, processing locks and duplicate payment prevention. Document observed results and limitations in `docs/payment-verification.md`. Fix reproduced issues only, preserve design, record AI assistance and Marjorie's evaluation. Commit, push and create her own PR; require actual teammate review before merge. Update evidence after each real event.

## Allen handoff: only after Marjorie's reviewed merge

Refresh the actual integration branch as above. Allen supplies his actual GitHub username, authenticates himself, and sets repository-local identity as Allen Bontilao, allen.m.bontilao@gmail.com. Verify the login before using `feature/receipt-reset`.

Audit existing coverage for receipt consistency, unique references, actual timestamps and complete reset. Add only useful missing verification and real fixes; document results in `docs/receipt-reset-verification.md`, including AI assistance and Allen's evaluation. Commit and push actual work through his own account. Create his PR and require teammate review before merge.

## Final integration evidence

After all real reviews and merges, update the integration branch and run the complete current test suites plus a database-connected checkout with legitimate local environment configuration. Record exact commands, failures/limitations, test results and `git rev-parse HEAD` in a final integration report and contribution register. No final integration SHA may be recorded until that stage is reached.
