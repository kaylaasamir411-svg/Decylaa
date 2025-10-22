
DECAYLA — Modern Offline Prototype
=================================

What you have:
- index.html  -> main dashboard (select model + use case)
- linear.html -> 2-variable LP demo (grid-search approximate solver)
- simplex.html -> Simplex interface (uses approximate solver for now)
- transportation.html -> NW-corner quick feasible solution UI
- style.css, script.js, assets/logo.svg

How to run locally:
1. Download and extract the folder.
2. Open index.html in your browser (or open the folder in VS Code and use Live Server).
3. Use the dashboard to open each model page.

Next steps options:
- Implement an exact Simplex solver in JS (frontend) or add backend solver API.
- Improve transportation solver (MODI or Vogel's approx + optimization).
- Save projects locally (localStorage) or add server-side DB & auth.

Tell me which solver you want next and I will implement it (Simplex exact, full LP, or transport optimization).
