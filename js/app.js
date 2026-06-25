
// ═════════ DATA ═════════
const PRODUCTS = [
  { id:1, name:'Café Coado', desc:'Café da roça passado na hora, encorpado e aromático.', price:4.50, emoji:'☕', cat:'cafe', units:['recife','fortaleza','natal','joao_pessoa'] },
  { id:2, name:'Tapioca Nordestina', desc:'Recheada com coco e queijo coalho grelhado.', price:9.90, emoji:'🌾', cat:'tapioca', units:['recife','fortaleza','natal','joao_pessoa'] },
  { id:3, name:'Cuscuz Completo', desc:'Com ovo, queijo e manteiga de garrafa.', price:11.50, emoji:'🍽️', cat:'cuscuz', units:['recife','fortaleza','natal','joao_pessoa'] },
  { id:4, name:'Bolo de Macaxeira', desc:'Receita tradicional de Dona Francisca.', price:7.00, emoji:'🎂', cat:'bolo', units:['recife','natal'] },
  { id:5, name:'Suco de Graviola', desc:'Natural, 500ml, sem adição de açúcar.', price:8.00, emoji:'🥤', cat:'suco', units:['recife','fortaleza','natal','joao_pessoa'] },
  { id:6, name:'Caldo de Milho', desc:'Especial de São João — só na época junina!', price:6.50, emoji:'🌽', cat:'cafe', seasonal:true, units:['recife','fortaleza'] },
  { id:7, name:'Tapioca Frango + Catupiry', desc:'Frango desfiado com requeijão cremoso.', price:12.90, emoji:'🌾', cat:'tapioca', units:['recife','fortaleza','joao_pessoa'] },
  { id:8, name:'Café com Leite + Bolo', desc:'Combo café fresquinho + fatia do dia.', price:13.90, emoji:'☕', cat:'cafe', units:['recife','fortaleza','natal','joao_pessoa'] },
];

let cart = [];
let currentCat = 'all';
let currentUnit = 'recife';
let loyaltyPoints = 340;
let selectedPayMethod = '';
let activeOrder = null;
let lgpdAccepted = false;

// ═════════ INIT ═════════
window.onload = () => {
  document.getElementById('lgpdModal').classList.add('open');
  renderProducts();
};

function acceptLgpd() {
  if (!document.getElementById('modalLgpd1').checked) {
    showToast('O consentimento básico é obrigatório para continuar.');
    return;
  }
  lgpdAccepted = true;
  document.getElementById('lgpdModal').classList.remove('open');
  showToast('✅ Consentimentos registrados. Bem-vinda!');
}

// ═════════ NAVIGATION ═════════
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const bnav = document.getElementById('bn-' + page);
  if (bnav) bnav.classList.add('active');
  if (page === 'cart') renderCart();
  if (page === 'status') renderStatus();
  window.scrollTo(0, 0);
}

// ═════════ PRODUCT GRID ═════════
function renderProducts() {
  const grid = document.getElementById('productGrid');
  const filtered = PRODUCTS.filter(p => {
    const inUnit = p.units.includes(currentUnit);
    const inCat  = currentCat === 'all' || p.cat === currentCat;
    return inUnit && inCat;
  });
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">😔</div><p>Nenhum produto disponível nesta unidade para essa categoria.</p></div>';
    return;
  }
  grid.innerHTML = filtered.map(p => `
    <div class="product-card">
      <div class="product-img">
        ${p.emoji}
        ${p.seasonal ? '<span class="seasonal-badge">⭐ Junino</span>' : ''}
      </div>
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-footer">
          <div class="product-price">R$${p.price.toFixed(2)}</div>
          <button class="btn-add" onclick="addToCart(${p.id})">+ Adicionar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterCat(el, cat) {
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentCat = cat;
  renderProducts();
}

function filterByUnit() {
  currentUnit = document.getElementById('unitSelect').value;
  renderProducts();
  showToast(`📍 Unidade alterada. Cardápio atualizado!`);
}

// ═════════ CART ═════════
function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  const existing = cart.find(x => x.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ ...p, qty: 1 }); }
  updateCartBadge();
  showToast(`✅ ${p.name} adicionado!`);
}

function updateCartBadge() {
  const total = cart.reduce((s, x) => s + x.qty, 0);
  document.getElementById('cartBadge').textContent = total;
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const summary   = document.getElementById('cartSummary');
  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="es-icon">🛒</div><p>Seu carrinho está vazio.<br>Adicione itens do cardápio!</p></div>';
    summary.innerHTML = '';
    return;
  }
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">R$${item.price.toFixed(2)} cada</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
        <div class="qty-num">${item.qty}</div>
        <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
      </div>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const pts = Math.floor(subtotal);
  summary.innerHTML = `
    <div class="loyalty-note">⭐ Você ganhará <strong>${pts} pontos</strong> com este pedido!</div>
    <div class="cart-summary">
      <div class="summary-row"><span>Subtotal</span><span>R$${subtotal.toFixed(2)}</span></div>
      <div class="summary-row"><span>Taxa de serviço</span><span>Grátis</span></div>
      <div class="summary-row total"><span>Total</span><span>R$${subtotal.toFixed(2)}</span></div>
      <br>
      <button class="btn-primary" onclick="navigate('checkout')">Finalizar Pedido →</button>
    </div>
  `;
}

function changeQty(id, delta) {
  const idx = cart.findIndex(x => x.id === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  updateCartBadge();
  renderCart();
}

// ═════════ CHECKOUT ═════════
function goToPayment() {
  const name   = document.getElementById('ckName').value.trim();
  const cpf    = document.getElementById('ckCpf').value.trim();
  const email  = document.getElementById('ckEmail').value.trim();
  const pickup = document.getElementById('ckPickup').value;
  const lgpd   = document.getElementById('lgpdBasic').checked;
  let valid = true;

  ['errName','errCpf','errEmail','errPickup','errLgpd'].forEach(e => document.getElementById(e).textContent = '');

  if (!name) { document.getElementById('errName').textContent = '⚠ Nome obrigatório.'; valid = false; }
  if (!cpf || cpf.length < 14) { document.getElementById('errCpf').textContent = '⚠ CPF inválido.'; valid = false; }
  if (!email || !email.includes('@')) { document.getElementById('errEmail').textContent = '⚠ E-mail inválido.'; valid = false; }
  if (!pickup) { document.getElementById('errPickup').textContent = '⚠ Selecione o tipo de retirada.'; valid = false; }
  if (!lgpd) { document.getElementById('errLgpd').textContent = '⚠ O consentimento básico é obrigatório para prosseguir.'; valid = false; }

  if (!valid) return;
  showSection('checkoutPayment');
  showCheckoutStep(3);
}

function showSection(id) {
  ['checkoutData','checkoutPayment'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}

function showCheckoutStep(n) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('step' + i);
    el.classList.remove('active','done');
    if (i < n) el.classList.add('done');
    else if (i === n) el.classList.add('active');
  }
}

function selectPay(el, method) {
  document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
  selectedPayMethod = method;
  const cardFields = document.getElementById('cardFields');
  cardFields.style.display = (method === 'cartao_credito' || method === 'cartao_debito') ? 'block' : 'none';
}

function applyLoyalty() {
  const cb = document.getElementById('useLoyalty');
  if (cb.checked && loyaltyPoints < 100) {
    cb.checked = false;
    showToast('⚠ Pontos insuficientes para desconto.');
  }
}

function simulatePay() {
  if (!selectedPayMethod) {
    document.getElementById('errPay').textContent = '⚠ Selecione uma forma de pagamento.';
    return;
  }
  document.getElementById('errPay').textContent = '';
  document.getElementById('payBtns').style.display = 'none';
  document.getElementById('processingBox').classList.add('visible');

  setTimeout(() => {
    const useLoyalty = document.getElementById('useLoyalty').checked;
    if (useLoyalty) loyaltyPoints -= 100;
    const earned = Math.floor(cart.reduce((s,x) => s + x.price * x.qty, 0));
    loyaltyPoints += earned;
    document.getElementById('ptsDisplay').textContent = loyaltyPoints;
    document.getElementById('ptsBar').style.width = Math.min(loyaltyPoints / 500 * 100, 100) + '%';

    activeOrder = {
      code: 'RN' + Math.floor(Math.random() * 9000 + 1000),
      items: [...cart],
      time: new Date(),
      step: 1,
    };
    cart = [];
    updateCartBadge();
    showCheckoutStep(4);
    document.getElementById('processingBox').classList.remove('visible');

    const total = activeOrder.items.reduce((s,x) => s + x.price * x.qty, 0);
    const discount = useLoyalty ? 2 : 0;
    const final = (total - discount).toFixed(2);

    document.getElementById('page-checkout').innerHTML = `
      <div class="success-screen">
        <div class="success-emoji">🎉</div>
        <div class="success-title">Pedido Confirmado!</div>
        <div class="success-sub">Pagamento aprovado com sucesso. Prepare-se para saborear!</div>
        <div class="order-code">
          <div class="order-code-label">Código do pedido</div>
          <div class="order-code-num">${activeOrder.code}</div>
        </div>
        <div style="color:var(--cinza-medio);font-size:.85rem;margin-bottom:20px;">Total cobrado: <strong>R$${final}</strong> · ${earned} pontos adicionados!</div>
        <button class="btn-primary" style="max-width:300px;margin:0 auto" onclick="navigate('status')">Acompanhar Pedido</button>
        <br><br>
        <button class="btn-secondary" onclick="navigate('menu')">Voltar ao Cardápio</button>
      </div>
    `;
    document.getElementById('orderBadge').style.display = 'flex';
    navigate('status');
  }, 2500);
}

// ═════════ STATUS ═════════
function renderStatus() {
  const div = document.getElementById('statusContent');
  if (!activeOrder) {
    div.innerHTML = '<div class="empty-state"><div class="es-icon">📦</div><p>Nenhum pedido em andamento.<br>Faça um pedido no cardápio!</p></div>';
    return;
  }

  const steps = [
    { label: 'Pedido recebido', time: '10:32' },
    { label: 'Em preparo na cozinha', time: '10:34' },
    { label: 'Pronto para retirada', time: '10:41' },
    { label: 'Pedido entregue', time: '' },
  ];

  let step = activeOrder.step;
  if (step < 3) {
    setTimeout(() => { activeOrder.step++; renderStatus(); }, 4000);
  }

  const statusLabels = ['Recebido','Em Preparo','Pronto! 🎉','Entregue ✅'];
  const statusEmojis = ['🕐','👩‍🍳','✅','🎉'];

  div.innerHTML = `
    <div class="status-card">
      <div class="status-icon">${statusEmojis[step-1]}</div>
      <div class="status-label">${statusLabels[step-1]}</div>
      <div class="status-sub">Código: <strong>${activeOrder.code}</strong></div>
      <div class="timeline">
        ${steps.map((s, i) => `
          <div class="tl-item">
            <div class="tl-dot ${i < step-1 ? 'done' : i === step-1 ? 'current' : ''}"></div>
            <div class="tl-text">${s.label}</div>
            <div class="tl-time">${i < step ? (s.time || '—') : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ═════════ LOYALTY ═════════
function redeem(btn, pts, name) {
  if (loyaltyPoints < pts) { showToast('⚠ Pontos insuficientes!'); return; }
  loyaltyPoints -= pts;
  document.getElementById('ptsDisplay').textContent = loyaltyPoints;
  document.getElementById('ptsBar').style.width = Math.min(loyaltyPoints / 500 * 100, 100) + '%';
  showToast(`🎁 ${name} resgatado com sucesso!`);
}

// ═════════ PROFILE / LGPD ═════════
function togglePrivacy(el) {
  el.classList.toggle('on');
  showToast('✅ Preferência de privacidade atualizada.');
}

// ═════════ HELPERS ═════════
function maskCPF(el) {
  let v = el.value.replace(/\D/g,'').substring(0,11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  el.value = v;
}

function maskCard(el) {
  let v = el.value.replace(/\D/g,'').substring(0,16);
  v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  el.value = v;
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}
