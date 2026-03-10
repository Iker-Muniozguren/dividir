/* =========================
   Utils generales
========================= */
function parsePrice(text) {
  const cleaned = String(text).replace(/\s/g, '').replace(',', '.');
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : NaN;
}
function formatPriceES(num) {
  const fixed = (isNaN(num) ? 0 : num).toFixed(2);
  return fixed.replace('.', ',') + ' €';
}
function euroToCents(n){ return Math.round(n * 100); }
function centsToEuro(c){ return (c / 100); }

/* =========================
   Estado global
========================= */
const App = {
  step: 'initial', // 'initial' | 'step2' | 'results'
  products: [],    // [{id, name, price}]
  people: 1,
  step2State: {
    personNames: [],            // ["Ana", "Luis", ...]
    selectedByPerson: []        // [Set(productId), ...] de longitud = people
  },
  initialMainHTML: null,
};

/* Guardamos el HTML inicial de <main> */
const mainEl = document.querySelector('main');
App.initialMainHTML = mainEl.innerHTML;

/* =========================
   Render: Pantalla INICIAL
========================= */
function renderInitial(app = App) {
  const main = document.querySelector('main');
  main.innerHTML = app.initialMainHTML;
  app.step = 'initial';

  // Re-seleccionar refs del DOM inicial
  const form  = document.getElementById('productForm');
  const table = document.getElementById('productTable');
  const tbody = table.querySelector('tbody');
  const totalEl = document.getElementById('totalCell');
  const peopleSelect = document.getElementById('peopleCount');
  const nextBtn = document.getElementById('nextBtn');

  // Rellena select 1..100
  peopleSelect.innerHTML = '';
  for (let i = 1; i <= 100; i++){
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = i;
    peopleSelect.appendChild(opt);
  }
  peopleSelect.value = String(app.people || 1);

  // Helpers del inicial
  function renumberRows() {
    Array.from(tbody.rows).forEach((tr, idx) => {
      tr.cells[0].textContent = idx + 1;
      tr.cells[0].title = tr.cells[0].textContent;
    });
  }
  function updateTotal() {
    let sum = 0;
    Array.from(tbody.rows).forEach(tr => {
      const priceCell = tr.querySelector('td.price-cell') || tr.cells[2];
      if (priceCell) {
        const val = parsePrice(priceCell.textContent);
        if (!isNaN(val)) sum += val;
      }
    });
    if (totalEl) totalEl.textContent = formatPriceES(sum);
  }
  function normalizePriceCell(cell) {
    const val = parsePrice(cell.textContent);
    cell.textContent = formatPriceES(Math.max(0, isNaN(val) ? 0 : val));
    cell.title = cell.textContent;
  }
  function setTitlesForRow(tr){
    Array.from(tr.cells).forEach(td => { td.title = td.textContent; });
  }
  function makeRow({name, price}){
    const row = document.createElement('tr');
    row.innerHTML = `
      <td></td>
      <td class="name-cell"  contenteditable="true"></td>
      <td class="price-cell" contenteditable="true">${formatPriceES(price)}</td>
      <td><button class="deleteBtn" type="button">X</button></td>
    `;
    row.querySelector('.name-cell').textContent = name;
    row.querySelector('.deleteBtn').addEventListener('click', () => {
      row.remove();
      renumberRows();
      updateTotal();
      app.products = collectProductsFromTable();
    });
    setTitlesForRow(row);
    return row;
  }
  function collectProductsFromTable(){
    const arr = [];
    Array.from(tbody.rows).forEach((tr, idx) => {
      const name = (tr.querySelector('.name-cell')?.textContent || '').trim();
      const priceCell = tr.querySelector('.price-cell');
      const price = parsePrice(priceCell ? priceCell.textContent : '');
      if (name && !isNaN(price)) {
        arr.push({ id:`p${idx+1}`, name, price });
      }
    });
    return arr;
  }

  // Repintar productos ya guardados
  tbody.innerHTML = '';
  app.products.forEach(p => tbody.appendChild(makeRow(p)));
  renumberRows();
  updateTotal();

  // Listeners (delegación)
  tbody.addEventListener('input', (e) => {
    const td = e.target;
    if (td.matches('td')) td.title = td.textContent;
    if (td.matches('td.price-cell')) updateTotal();
  });
  tbody.addEventListener('blur', (e) => {
    const td = e.target;
    if (td.matches('td.price-cell')) {
      normalizePriceCell(td);
      updateTotal();
    } else if (td.matches('td')) {
      td.title = td.textContent;
    }
    app.products = collectProductsFromTable();
  }, true);

  // Añadir filas – submit
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const priceValue = parseFloat(document.getElementById('productPrice').value);
    if (name && !isNaN(priceValue) && priceValue > 0) {
      tbody.appendChild(makeRow({name, price: priceValue}));
      renumberRows();
      updateTotal();
      form.reset();
      document.getElementById('productName').focus();
      app.products = collectProductsFromTable();
    }
  });

  // Siguiente → Paso 2 (con validación si no hay productos)
  nextBtn.addEventListener('click', () => {
    app.products = collectProductsFromTable();

    if (!app.products.length) {
      let msgArea = document.getElementById('initialMessages');
      if (!msgArea) {
        msgArea = document.createElement('div');
        msgArea.id = 'initialMessages';
        msgArea.className = 'msg-area';
        const split = document.querySelector('.split-controls');
        split.insertAdjacentElement('afterend', msgArea);
      }
      msgArea.innerHTML = `<div class="error-msg">Añade al menos un producto antes de continuar.</div>`;
      return;
    }

    app.people = Math.max(1, parseInt(peopleSelect.value, 10) || 1);
    renderStep2(app);
  });

}

/* =========================
   Render: PASO 2 (personas)
========================= */
function renderStep2(app = App) {
  const main = document.querySelector('main');
  app.step = 'step2';

  const products = app.products;
  const people = app.people;

  // Asegura estructura selections si no existe
  if (!app.step2State.selectedByPerson || app.step2State.selectedByPerson.length !== people){
    app.step2State.selectedByPerson = Array.from({length: people}, () => new Set(products.map(p=>p.id)));
  }
  if (!app.step2State.personNames || app.step2State.personNames.length !== people){
    app.step2State.personNames = Array.from({length: people}, (_,i)=>`Persona ${i+1}`);
  }

  const renderProductsList = (personIdxZero) => {
    const set = app.step2State.selectedByPerson[personIdxZero] || new Set();
    return `
      <ul class="product-checklist">
        ${products.map(prod => `
          <li>
            <label class="product-item">
              <input 
                type="checkbox" 
                name="person${personIdxZero+1}_product_${prod.id}" 
                value="${prod.id}"
                data-price="${prod.price}"
                data-person-index="${personIdxZero+1}"
                ${set.has(prod.id) ? 'checked' : ''}
              />
              <span class="prod-name">${prod.name}</span>
              <span class="prod-price">${formatPriceES(prod.price)}</span>
            </label>
          </li>
        `).join('')}
      </ul>
    `;
  };

  const peopleCards = Array.from({length: people}, (_, i) => {
    const defaultName = app.step2State.personNames[i] || `Persona ${i+1}`;
    return `
      <div class="person-card">
        <input id="personName_${i+1}" class="person-input" type="text" value="${defaultName}" />
        ${renderProductsList(i)}
      </div>
    `;
  }).join('');

  main.innerHTML = `
    <div class="back-bar">
      <button id="backToInitial" class="back-btn" type="button" aria-label="Volver al inicio">← Volver</button>
    </div>

    <h1>Dividir</h1>
    <p class="info">Marca/desmarca qué productos paga cada persona.</p>
    <section class="people-grid">${peopleCards}</section>

    <div id="step2Messages" class="msg-area" aria-live="polite"></div>

    <div class="actions-bar">
      <button id="calcBtn" type="button">Calcular</button>
    </div>
  `;

  // Back → inicio (manteniendo datos)
  document.getElementById('backToInitial').addEventListener('click', () => {
    renderInitial(app);
  });

  // Persistir nombres y checks en vivo
  for (let i=0;i<people;i++){
    const inp = document.getElementById(`personName_${i+1}`);
    inp.addEventListener('input', () => {
      app.step2State.personNames[i] = (inp.value || '').trim() || `Persona ${i+1}`;
    });
  }
  document.querySelectorAll('.product-checklist input[type="checkbox"]').forEach(chk=>{
    chk.addEventListener('change', ()=>{
      const pid = chk.value;
      const personIdx = parseInt(chk.dataset.personIndex, 10) - 1;
      const set = app.step2State.selectedByPerson[personIdx];
      if (chk.checked) set.add(pid); else set.delete(pid);
    });
  });

  // Calcular
  document.getElementById('calcBtn').addEventListener('click', () => {
    const msgArea = document.getElementById('step2Messages');
    msgArea.innerHTML = '';

    // Validación: al menos un producto y cada producto asignado a alguien
    if (!products.length){
      msgArea.innerHTML = `<div class="error-msg">Añade al menos un producto antes de calcular.</div>`;
      return;
    }
    const unassigned = [];
    products.forEach(p => {
      const assigned = app.step2State.selectedByPerson.some(set => set.has(p.id));
      if (!assigned) unassigned.push(p.name);
    });
    if (unassigned.length){
      msgArea.innerHTML = `
        <div class="error-msg">
          Hay producto(s) sin asignar: <strong>${unassigned.join(', ')}</strong>.
          Selecciona al menos una persona para cada producto y vuelve a calcular.
        </div>`;
      return;
    }

    // ===== MÉTODO 1: Redondeo global por "mayores restos" =====
    const people = app.people;
    const names = app.step2State.personNames;
    const selections = app.step2State.selectedByPerson;

    const floors = Array.from({length: people}, () => 0);      // suma de partes enteras en céntimos
    const fracScore = Array.from({length: people}, () => 0);    // "peso" de parte fraccionaria acumulada
    const SCALE = 1e6; // base grande para comparar fracciones con precisión

    // Total global en céntimos (para comprobar exactitud al final)
    const totalAllCents = euroToCents(products.reduce((acc, p) => acc + p.price, 0));

    products.forEach(p => {
      const C = euroToCents(p.price);
      const owners = [];
      selections.forEach((set, i) => { if (set.has(p.id)) owners.push(i); });

      const k = owners.length;
      if (k === 0) return; // por seguridad (no debería pasar por la validación anterior)

      // Parte entera (floor) por persona de este producto
      const base = Math.floor(C / k);
      // Resto del producto en céntimos
      const rem = C % k;

      owners.forEach(i => { floors[i] += base; });
      // Suma fraccionaria ponderada: resto/k (sin convertir a float)
      owners.forEach((i) => { fracScore[i] += Math.round((rem * SCALE) / k); });
    });

    const sumFloors = floors.reduce((a,b)=>a+b,0);
    let remainder = totalAllCents - sumFloors; // céntimos que faltan por repartir

    // Ordenar por mayor fracción acumulada (desempate por índice estable)
    const order = Array.from({length: people}, (_,i)=>i).sort((a,b)=>{
      if (fracScore[b] === fracScore[a]) return a - b;
      return fracScore[b] - fracScore[a];
    });

    const totalsCents = floors.slice();
    for (let i=0; i<order.length && remainder>0; i++){
      totalsCents[order[i]] += 1;
      remainder--;
      // si queda todavía, seguimos en bucle (se reparte 1 céntimo a cada uno por orden)
      if (i === order.length - 1 && remainder > 0) i = -1; // vuelta circular si aún sobran céntimos
    }

    // Texto para copiar
    const lines = names.map((name, i) => {
      const amount = centsToEuro(totalsCents[i]);
      return `${name}: ${formatPriceES(amount).replace(/\s?€/,' €')}`;
    });

    // → Mostrar resultados con resumen arriba + texto abajo
    renderResults(app, lines.join('\n'), totalsCents);
  });
}

/* =========================
   Render: RESULTADOS (resumen + texto)
========================= */
function renderResults(app = App, textContent, totalsCents) {
  const main = document.querySelector('main');
  app.step = 'results';

  const products = app.products;
  const names = app.step2State.personNames;
  const selections = app.step2State.selectedByPerson;

  // Construye filas del resumen: exclusiones por persona
  const summaryRowsHTML = names.map((name, i) => {
    const set = selections[i] || new Set();
    const excluded = products.filter(p => !set.has(p.id)).map(p => p.name);
    const note = excluded.length ? `Todo menos ${excluded.join(', ')}` : 'Todo';
    const total = formatPriceES(centsToEuro(totalsCents[i] || 0));
    return `
      <tr>
        <td>
          <div class="p-name">${name}</div>
          <div class="p-note">${note}</div>
        </td>
        <td class="num">${total}</td>
      </tr>
    `;
  }).join('');

  const totalAllCents = totalsCents.reduce((a,b)=>a+b,0);
  const totalAllFmt   = formatPriceES(centsToEuro(totalAllCents));

  main.innerHTML = `
    <div class="back-bar">
      <button id="backToStep2" class="back-btn" type="button" aria-label="Volver a la lista de personas">← Volver</button>
    </div>

    <h1>Resultado</h1>

    <!-- Resumen arriba SIN caja -->
    
    <table class="summary-table">
      <thead>
        <tr>
          <th>Persona</th>
          <th class="totalPagar">Total a pagar</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRowsHTML}
      </tbody>
      <tfoot>
        <tr class="summary-footer">
          <td class="footer-label">Total</td>
          <td class="num footer-total">${totalAllFmt}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Texto con botón de copiar debajo -->
    <div class="text-result-box">
      <pre id="resultText" class="text-result" aria-label="Resultado en texto">${textContent}</pre>
      <button id="copyBtn" class="copy-btn" type="button">Copiar texto</button>
      <div id="copyMsg" class="copy-msg" aria-live="polite"></div>
    </div>
  `;

  // Volver a Paso 2
  document.getElementById('backToStep2').addEventListener('click', () => {
    renderStep2(app);
  });

  // Copiar al portapapeles
  document.getElementById('copyBtn').addEventListener('click', async () => {
    const txt = document.getElementById('resultText').textContent;
    try{
      await navigator.clipboard.writeText(txt);
      document.getElementById('copyMsg').textContent = '¡Copiado!';
      setTimeout(()=>{ document.getElementById('copyMsg').textContent=''; }, 1500);
    }catch(err){
      document.getElementById('copyMsg').textContent = 'No se pudo copiar. Selecciona y copia manualmente.';
    }
  });
}

/* =========================
   Bootstrap
========================= */
(function bootstrapInitialRead(){
  const table = document.getElementById('productTable');
  const tbody = table?.querySelector('tbody');
  if (tbody && tbody.rows.length){
    App.products = Array.from(tbody.rows).map((tr, idx) => {
      const name = (tr.querySelector('.name-cell')?.textContent || '').trim();
      const priceCell = tr.querySelector('.price-cell') || tr.cells[2];
      const price = parsePrice(priceCell ? priceCell.textContent : '');
      return name && !isNaN(price) ? { id:`p${idx+1}`, name, price } : null;
    }).filter(Boolean);
  } else {
    App.products = [];
  }
  App.people = 1;
  renderInitial(App);
})();
