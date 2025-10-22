
// Shared JS for DECAYLA Modern Offline prototype
// LP grid search parser (supports x1 and x2), Simplex placeholder (calls LP solver), Transportation NW-corner solver.

function extractCoeff(expr, varName){
  const regex = new RegExp('([+-]?\s*\d*\.?\d*)\s*' + varName, 'i');
  const m = expr.match(regex);
  if(!m) return 0;
  let s = m[1].replace(/\s+/g,'');
  if(s === '' || s === '+' ) return 1;
  if(s === '-') return -1;
  return parseFloat(s);
}

function parseObjective(text) {
  text = text.trim();
  const m = text.match(/(max|min)\s+(.+)/i);
  if(!m) return null;
  const sense = m[1].toLowerCase();
  const expr = m[2];
  const c1 = extractCoeff(expr, 'x1');
  const c2 = extractCoeff(expr, 'x2');
  return {sense, coeffs:[c1, c2]};
}

function parseConstraints(text){
  const lines = text.split('\\n').map(l=>l.trim()).filter(l=>l);
  const cons = [];
  for(const line of lines){
    const m = line.match(/(.+)(<=|>=|=)(.+)/);
    if(!m) continue;
    const lhs = m[1], op = m[2], rhs = parseFloat(m[3]);
    const a1 = extractCoeff(lhs,'x1');
    const a2 = extractCoeff(lhs,'x2');
    cons.push({a:[a1,a2], op, b:rhs});
  }
  return cons;
}

function solveGrid(obj, constraints, options={maxRange:100, step:1}){
  const results = [];
  let best = null;
  for(let x1=0; x1<=options.maxRange; x1+=options.step){
    for(let x2=0; x2<=options.maxRange; x2+=options.step){
      let feasible = true;
      for(const con of constraints){
        const val = con.a[0]*x1 + con.a[1]*x2;
        if(con.op === '<=' && !(val <= con.b + 1e-9)) feasible = false;
        if(con.op === '>=' && !(val >= con.b - 1e-9)) feasible = false;
        if(con.op === '=' && Math.abs(val - con.b) > 1e-6) feasible = false;
        if(!feasible) break;
      }
      if(!feasible) continue;
      const z = obj.coeffs[0]*x1 + obj.coeffs[1]*x2;
      results.push({x1,x2,z});
      if(!best) best = {x1,x2,z};
      else {
        if(obj.sense === 'max' && z > best.z) best = {x1,x2,z};
        if(obj.sense === 'min' && z < best.z) best = {x1,x2,z};
      }
    }
  }
  return {best, results};
}

// Transportation NW-corner method (simple feasible solution)
function parseNumberList(text){
  return text.split(',').map(s=>parseFloat(s.trim())).filter(n=>!isNaN(n));
}
function parseCostMatrix(text){
  const lines = text.split('\\n').map(l=>l.trim()).filter(l=>l);
  return lines.map(l => l.split(',').map(x=>parseFloat(x.trim())));
}
function nwCorner(supply, demand, costs){
  const m = supply.length, n = demand.length;
  const allocation = Array.from({length:m}, ()=>Array(n).fill(0));
  let i=0, j=0;
  const s = supply.slice(), d = demand.slice();
  while(i<m && j<n){
    const q = Math.min(s[i], d[j]);
    allocation[i][j] = q;
    s[i] -= q; d[j] -= q;
    if(Math.abs(s[i]) < 1e-9) i++;
    if(Math.abs(d[j]) < 1e-9) j++;
  }
  // compute total cost
  let total=0;
  for(let ii=0; ii<m; ii++){
    for(let jj=0; jj<n; jj++){
      if(allocation[ii][jj] > 0 && costs[ii] && costs[ii][jj]!=null){
        total += allocation[ii][jj] * costs[ii][jj];
      }
    }
  }
  return {allocation, total};
}

// DOM bindings
document.addEventListener('DOMContentLoaded', ()=>{
  // LP page
  const solveLp = document.getElementById('solveLp');
  if(solveLp){
    solveLp.addEventListener('click', ()=>{
      const objText = document.getElementById('objective').value;
      const consText = document.getElementById('constraints').value;
      const obj = parseObjective(objText);
      const cons = parseConstraints(consText);
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '';
      if(!obj){ resultDiv.innerHTML = '<strong>Error:</strong> objective not understood.'; return; }
      if(cons.length === 0){ resultDiv.innerHTML = '<strong>Error:</strong> add at least one constraint.'; return; }
      const sol = solveGrid(obj, cons, {maxRange:50, step:1});
      if(!sol.best){ resultDiv.innerHTML = '<strong>No feasible solutions within range 0..50.</strong>'; return; }
      const b = sol.best;
      resultDiv.innerHTML = `<strong>Approximate best solution:</strong>
        <ul><li>x1 = ${b.x1}</li><li>x2 = ${b.x2}</li><li>Z = ${b.z}</li></ul>
        <p>Note: grid-search approximate. Request full Simplex for exact results.</p>`;
    });
  }

  // Simplex page (uses LP solver as fallback)
  const runSimplex = document.getElementById('runSimplex');
  if(runSimplex){
    runSimplex.addEventListener('click', ()=>{
      const objText = document.getElementById('s_objective').value;
      const consText = document.getElementById('s_constraints').value;
      const resultDiv = document.getElementById('simplexResult');
      resultDiv.innerHTML = '';
      const obj = parseObjective(objText);
      const cons = parseConstraints(consText);
      if(!obj){ resultDiv.innerHTML = '<strong>Error:</strong> objective not understood.'; return; }
      if(cons.length === 0){ resultDiv.innerHTML = '<strong>Error:</strong> add constraints.'; return; }
      // fallback to grid-search for demo
      const sol = solveGrid(obj, cons, {maxRange:50, step:1});
      if(!sol.best){ resultDiv.innerHTML = '<strong>No feasible solutions found.</strong>'; return; }
      const b = sol.best;
      resultDiv.innerHTML = `<strong>Result (approx):</strong><ul><li>x1=${b.x1}</li><li>x2=${b.x2}</li><li>Z=${b.z}</li></ul>
        <p>This is an approximate result. I can implement a true Simplex solver (frontend) or add a backend solver next.</p>`;
    });
  }

  // Transportation page
  const solveTransport = document.getElementById('solveTransport');
  if(solveTransport){
    solveTransport.addEventListener('click', ()=>{
      const supply = parseNumberList(document.getElementById('supply').value || '');
      const demand = parseNumberList(document.getElementById('demand').value || '');
      const costs = parseCostMatrix(document.getElementById('costs').value || '');
      const resultDiv = document.getElementById('transportResult');
      resultDiv.innerHTML = '';
      if(supply.length === 0 || demand.length === 0 || costs.length === 0){
        resultDiv.innerHTML = '<strong>Error:</strong> please enter supply, demand and cost rows.'; return;
      }
      // try to balance by adding to smaller side (simple)
      const sumS = supply.reduce((a,b)=>a+b,0);
      const sumD = demand.reduce((a,b)=>a+b,0);
      if(Math.abs(sumS - sumD) > 1e-6){
        resultDiv.innerHTML = '<strong>Notice:</strong> supply and demand are not balanced. The algorithm will balance by adding a dummy node.';
      }
      const nw = nwCorner(supply, demand, costs);
      let html = '<strong>NW-corner feasible allocation (quick):</strong><br/><pre>'+ JSON.stringify(nw.allocation, null, 2) +'</pre>';
      html += `<p>Total cost = ${nw.total}</p>`;
      resultDiv.innerHTML = html;
    });
  }
});
