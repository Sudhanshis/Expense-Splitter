const qs = s => document.querySelector(s);
const API = p => p; // same-origin calls: "/api/..."

const memberForm = qs('#memberForm');
const membersList = qs('#membersList');
const expenseForm = qs('#expenseForm');
const paidBySelect = qs('#paidBySelect');
const participantsBox = qs('#participantsBox');
const expensesTableBody = qs('#expensesTable tbody');
const balancesTableBody = qs('#balancesTable tbody');
const settlementsList = qs('#settlementsList');

qs('#refreshBtn').addEventListener('click', refreshAll);
qs('#resetBtn').addEventListener('click', async () => {
  if (!confirm('Clear all data?')) return;
  await fetch(API('/api/reset'), { method:'POST' });
  await refreshAll();
});

function toJSON(res){ 
  if(!res.ok) throw new Error('HTTP '+res.status); 
  return res.json(); 
}

// ===== MEMBERS =====
memberForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = memberForm.id.value.trim();
  const name = memberForm.name.value.trim();
  const res = await fetch(API('/api/members'), {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ id, name })
  });
  if (!res.ok) { alert((await res.json()).error || 'Error'); return; }
  memberForm.reset();
  await refreshAll();
});

async function loadMembers(){
  const ms = await fetch(API('/api/members')).then(toJSON);
  membersList.innerHTML = ms.length ?
    ms.map(m => `<span class="chip">${m.name} (${m.id})</span>`).join('') :
    `<span class="muted">No members yet.</span>`;
  paidBySelect.innerHTML = ms.map(m => `<option value="${m.id}">${m.name} (${m.id})</option>`).join('');
  participantsBox.innerHTML = ms.map(m => `
    <label><input type="checkbox" value="${m.id}" checked> ${m.name} (${m.id})</label>
  `).join('');
}

// ===== EXPENSES =====
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const desc = expenseForm.desc.value.trim();
  const amount = expenseForm.amount.value.trim();
  const paidBy = expenseForm.paidBy.value;
  const participants = [...participantsBox.querySelectorAll('input[type=checkbox]:checked')].map(i => i.value);
  if (!participants.length) { alert('Select at least one participant'); return; }

  const res = await fetch(API('/api/expenses'), {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ desc, amount: Number(amount), paidBy, participants })
  });
  if (!res.ok) { alert((await res.json()).error || 'Error'); return; }
  expenseForm.reset();
  await refreshAll();
});

async function loadExpenses(){
  const rows = await fetch(API('/api/expenses')).then(toJSON);
  // ✅ Use index from map to generate row numbers
  expensesTableBody.innerHTML = rows.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td> <!-- # column -->
      <td>${r.desc}</td> <!-- description -->
      <td>${r.paidBy}</td>
      <td>₹${r.amount.toFixed(2)}</td>
      <td>${r.participants.map(p=>`<span class="chip">${p}</span>`).join(' ')}</td>
    </tr>
  `).join('');
}

// ===== SUMMARY =====
async function loadSummary(){
  const s = await fetch(API('/api/summary')).then(toJSON);
  balancesTableBody.innerHTML = s.balances.map(b => `
    <tr>
      <td>${b.name} (${b.id})</td>
      <td class="${b.balance >= 0 ? 'ok' : 'bad'}">${b.balance >= 0 ? '+' : ''}₹${b.balance.toFixed(2)}</td>
    </tr>
  `).join('');
  settlementsList.innerHTML = s.settlements.length
    ? s.settlements.map(x => `<li>${x.from} → ${x.to} : ₹${x.amount.toFixed(2)}</li>`).join('')
    : `<li>Everyone is settled up 🎉</li>`;
}

// ===== REFRESH ALL =====
async function refreshAll(){ 
  await loadMembers(); 
  await loadExpenses(); 
  await loadSummary(); 
}

window.addEventListener('DOMContentLoaded', refreshAll);
