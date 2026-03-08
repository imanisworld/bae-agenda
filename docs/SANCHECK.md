I want a full engineering sanity check on this project before we keep adding more features.

Please review the current codebase and evaluate it across these categories:

1. architecture sanity
2. overengineering risk
3. missing fallback states
4. database/schema alignment
5. auth and admin risk
6. performance risk
7. repository hygiene
8. production stability
9. technical debt
10. what should NOT be built yet

Important:
- do not redesign the project
- do not suggest adding random tools unless they reduce real work
- focus on practical risks, not theoretical perfection
- be opinionated and specific

Please answer in this structure:

A. Current health summary
- what is solid
- what is fragile
- what is likely to break later if ignored

B. Overbuilding check
- what parts are getting too complex too early
- what can be deferred until later

C. Bug/stability check
- what areas are likely to produce bugs
- where code should fail more gracefully
- where empty states or safe guards are missing

D. Database/schema check
- whether the current code matches the current Supabase schema
- whether any tables/columns appear unused or mismatched
- whether any helpers/types look stale

E. Auth/admin check
- whether admin bypass/auth logic is risky
- what must be fixed before production
- what can safely wait

F. Performance check
- client components
- unnecessary JS
- large assets
- too much rendering on the homepage
- avoidable queries

G. Repo/project hygiene
- docs
- gitignore
- folder structure
- accidental clutter
- anything that should be moved or cleaned

H. Recommended next 5 steps
- list the best next five things to do, in order

I want this to function like a stability and anti-bloat review for a real product, not just a coding exercise.