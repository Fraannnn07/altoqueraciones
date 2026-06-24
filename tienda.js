/* =====================================================================
   Tienda Al Toque Raciones — catálogo dinámico + carrito + checkout
   Renderiza productos desde /api/products, maneja el carrito en localStorage
   y crea el pago en MercadoPago vía /api/checkout.
   ===================================================================== */
(function () {
  'use strict';

  var CART_KEY = 'atr_cart_v1';
  var WHATSAPP = '59898623158';

  // category de la DB -> { tabKey (id del panel y del tab), label }
  var CATEGORIES = [
    { key: 'perros_adultos', tab: 'perros-adultos', label: '🐕 Perros Adultos' },
    { key: 'cachorros',      tab: 'cachorros',       label: '🐶 Cachorros' },
    { key: 'gatos',          tab: 'gatos',           label: '🐈 Gatos' },
    { key: 'accesorios',     tab: 'accesorios',      label: '🧹 Accesorios' },
    { key: 'vet',            tab: 'vet-sanitarios',  label: '🏥 Vet y Sanitarios' },
  ];

  var products = [];   // catálogo cargado
  var byId = {};       // id -> producto
  var cart = loadCart();

  // ---------- utilidades ----------
  function money(n) { return '$' + Number(n || 0).toLocaleString('es-UY'); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function cartCount() {
    var n = 0; for (var k in cart) n += cart[k].qty; return n;
  }
  function cartTotal() {
    var t = 0; for (var k in cart) t += cart[k].qty * cart[k].price; return t;
  }

  // ---------- carga de productos ----------
  function loadProducts() {
    var root = document.getElementById('store-root');
    if (!root) return;
    fetch('/api/products')
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function (data) {
        products = (data && data.products) || [];
        byId = {};
        products.forEach(function (p) { byId[p.id] = p; });
        // limpiar del carrito productos que ya no existen / fueron dados de baja
        var changed = false;
        for (var id in cart) {
          if (!byId[id]) { delete cart[id]; changed = true; }
          else { cart[id].price = byId[id].price; } // refrescar precio
        }
        if (changed) saveCart();
        renderStore(root);
        renderCart();
      })
      .catch(function (err) {
        console.error('[tienda] Error cargando productos:', err);
        root.innerHTML =
          '<p class="store-error">No pudimos cargar los productos. ' +
          'Probá recargar la página o <a href="https://wa.me/' + WHATSAPP +
          '" target="_blank" rel="noopener">escribinos por WhatsApp</a>.</p>';
      });
  }

  // ---------- render del catálogo (paneles por tab) ----------
  function renderStore(root) {
    var html = '';
    CATEGORIES.forEach(function (cat, i) {
      var list = products.filter(function (p) { return p.category === cat.key; });
      var active = i === 0 ? ' active' : '';
      html += '<div class="catalog__panel' + active + '" id="panel-' + cat.tab +
              '" role="tabpanel">';
      if (!list.length) {
        html += '<p class="store-loading">Pronto vamos a sumar productos en esta categoría.</p>';
      } else if (cat.key === 'vet') {
        html += renderGroupedByBadge(list);
      } else {
        html += '<div class="store-grid">' + list.map(cardHtml).join('') + '</div>';
      }
      html += '</div>';
    });
    root.innerHTML = html;
  }

  // El panel vet se agrupa por "badge" (Antipulgas, Pipeta, etc.) como el catálogo viejo.
  function renderGroupedByBadge(list) {
    var order = [], groups = {};
    list.forEach(function (p) {
      var b = p.badge || 'Otros';
      if (!groups[b]) { groups[b] = []; order.push(b); }
      groups[b].push(p);
    });
    return order.map(function (b) {
      return '<div class="store-grid">' +
             '<div class="store-subhead">' + esc(b) + '</div>' +
             groups[b].map(cardHtml).join('') +
             '</div>';
    }).join('');
  }

  function cardHtml(p) {
    var badgeClass = 'product-card__badge';
    if (p.tier === 'premium') badgeClass += ' product-card__badge--premium';
    else if (p.tier === 'economico') badgeClass += ' product-card__badge--economico';

    var img = p.image_url
      ? '<img class="product-card__img" src="' + esc(p.image_url) + '" alt="' + esc(p.name) +
        '" loading="lazy">'
      : '';

    return '' +
      '<div class="product-card" data-id="' + p.id + '">' +
        img +
        (p.badge ? '<span class="' + badgeClass + '">' + esc(p.badge) + '</span>' : '') +
        '<div class="product-card__name">' + esc(p.name) + '</div>' +
        '<div class="product-card__desc">' + esc(p.description || '') + '</div>' +
        '<div class="product-card__price">' + money(p.price) +
          ' <small>envío gratis</small></div>' +
        '<div class="product-card__actions">' +
          '<div class="qty-stepper">' +
            '<button type="button" data-act="dec" aria-label="Restar">−</button>' +
            '<input type="number" min="1" max="99" value="1" data-qty aria-label="Cantidad">' +
            '<button type="button" data-act="inc" aria-label="Sumar">+</button>' +
          '</div>' +
          '<button type="button" class="btn-add" data-act="add">Agregar</button>' +
        '</div>' +
      '</div>';
  }

  // ---------- interacción del catálogo (delegación de eventos) ----------
  function onStoreClick(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var card = e.target.closest('.product-card');
    if (!card) return;
    var act = btn.getAttribute('data-act');
    var input = card.querySelector('[data-qty]');
    var qty = Math.max(1, Math.min(99, parseInt(input.value, 10) || 1));

    if (act === 'inc') { input.value = Math.min(99, qty + 1); }
    else if (act === 'dec') { input.value = Math.max(1, qty - 1); }
    else if (act === 'add') {
      addToCart(card.getAttribute('data-id'), qty);
      btn.textContent = '✓ Agregado';
      btn.classList.add('btn-add--added');
      setTimeout(function () {
        btn.textContent = 'Agregar';
        btn.classList.remove('btn-add--added');
      }, 1200);
    }
  }

  function addToCart(id, qty) {
    var p = byId[id];
    if (!p) return;
    if (!cart[id]) {
      cart[id] = { id: p.id, name: p.name, description: p.description, price: p.price, qty: 0 };
    }
    cart[id].qty = Math.min(99, cart[id].qty + qty);
    saveCart();
    renderCart();
    openDrawer();
  }
  function setQty(id, qty) {
    if (!cart[id]) return;
    qty = Math.max(0, Math.min(99, qty));
    if (qty === 0) delete cart[id]; else cart[id].qty = qty;
    saveCart();
    renderCart();
  }

  // ---------- UI del carrito (FAB + drawer) ----------
  function buildCartUI() {
    var fab = document.createElement('button');
    fab.className = 'cart-fab';
    fab.id = 'cart-fab';
    fab.innerHTML = '🛒 <span>Mi carrito</span> <span class="cart-fab__count" id="cart-count">0</span>';
    fab.addEventListener('click', openDrawer);
    document.body.appendChild(fab);

    var overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.id = 'cart-overlay';
    overlay.addEventListener('click', closeDrawer);
    document.body.appendChild(overlay);

    var drawer = document.createElement('aside');
    drawer.className = 'cart-drawer';
    drawer.id = 'cart-drawer';
    drawer.setAttribute('aria-label', 'Carrito de compras');
    drawer.innerHTML =
      '<div class="cart-drawer__head">' +
        '<h3>Tu pedido</h3>' +
        '<button class="cart-close" id="cart-close" aria-label="Cerrar">×</button>' +
      '</div>' +
      '<div class="cart-drawer__body">' +
        '<div class="cart-lines" id="cart-lines"></div>' +
        '<form class="checkout-form" id="checkout-form">' +
          '<button type="button" class="checkout-back" id="checkout-back">‹ Volver al carrito</button>' +
          '<label>Nombre y apellido *</label>' +
          '<input name="name" required autocomplete="name">' +
          '<label>Teléfono / WhatsApp *</label>' +
          '<input name="phone" required inputmode="tel" autocomplete="tel">' +
          '<label>Dirección de entrega</label>' +
          '<input name="address" autocomplete="street-address">' +
          '<label>Notas (opcional)</label>' +
          '<textarea name="notes" placeholder="Ej: timbre 3, horario de entrega…"></textarea>' +
          '<p class="checkout-error" id="checkout-error" style="display:none"></p>' +
        '</form>' +
      '</div>' +
      '<div class="cart-drawer__foot">' +
        '<div class="cart-total"><span>Total</span><strong id="cart-total">$0</strong></div>' +
        '<p class="cart-ship-note">🚚 Envío gratis en Montevideo</p>' +
        '<button class="btn-checkout" id="btn-checkout">Continuar</button>' +
      '</div>';
    document.body.appendChild(drawer);

    document.getElementById('cart-close').addEventListener('click', closeDrawer);
    document.getElementById('cart-lines').addEventListener('click', onCartClick);
    document.getElementById('cart-lines').addEventListener('change', onCartChange);
    document.getElementById('btn-checkout').addEventListener('click', onCheckoutClick);
    document.getElementById('checkout-back').addEventListener('click', showCartLines);
  }

  var inCheckout = false;

  function renderCart() {
    var count = cartCount();
    var countEl = document.getElementById('cart-count');
    var fab = document.getElementById('cart-fab');
    if (countEl) countEl.textContent = count;
    if (fab) fab.classList.toggle('is-visible', count > 0);

    var totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = money(cartTotal());

    var lines = document.getElementById('cart-lines');
    if (!lines) return;
    var ids = Object.keys(cart);
    if (!ids.length) {
      lines.innerHTML = '<div class="cart-empty">Tu carrito está vacío.<br>Agregá productos para empezar 🐾</div>';
      var btn = document.getElementById('btn-checkout');
      if (btn) btn.disabled = true;
      return;
    }
    document.getElementById('btn-checkout').disabled = false;
    lines.innerHTML = ids.map(function (id) {
      var it = cart[id];
      return '<div class="cart-line" data-id="' + id + '">' +
        '<div class="cart-line__info">' +
          '<div class="cart-line__name">' + esc(it.name) + '</div>' +
          (it.description ? '<div class="cart-line__desc">' + esc(it.description) + '</div>' : '') +
          '<div class="cart-line__bottom">' +
            '<div class="qty-stepper">' +
              '<button type="button" data-act="dec" aria-label="Restar">−</button>' +
              '<input type="number" min="1" max="99" value="' + it.qty + '" data-qty>' +
              '<button type="button" data-act="inc" aria-label="Sumar">+</button>' +
            '</div>' +
            '<span class="cart-line__price">' + money(it.qty * it.price) + '</span>' +
          '</div>' +
          '<button type="button" class="cart-line__remove" data-act="remove">Quitar</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function onCartClick(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var line = e.target.closest('.cart-line');
    if (!line) return;
    var id = line.getAttribute('data-id');
    var act = btn.getAttribute('data-act');
    if (act === 'inc') setQty(id, cart[id].qty + 1);
    else if (act === 'dec') setQty(id, cart[id].qty - 1);
    else if (act === 'remove') setQty(id, 0);
  }
  function onCartChange(e) {
    var input = e.target.closest('[data-qty]');
    if (!input) return;
    var line = e.target.closest('.cart-line');
    setQty(line.getAttribute('data-id'), parseInt(input.value, 10) || 0);
  }

  function openDrawer() {
    document.getElementById('cart-overlay').classList.add('is-open');
    document.getElementById('cart-drawer').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    document.getElementById('cart-overlay').classList.remove('is-open');
    document.getElementById('cart-drawer').classList.remove('is-open');
    document.body.style.overflow = '';
    showCartLines();
  }

  function showCheckoutForm() {
    inCheckout = true;
    document.getElementById('cart-lines').classList.add('is-hidden');
    document.getElementById('checkout-form').classList.add('is-open');
    document.getElementById('btn-checkout').textContent = 'Pagar con MercadoPago';
  }
  function showCartLines() {
    inCheckout = false;
    document.getElementById('cart-lines').classList.remove('is-hidden');
    document.getElementById('checkout-form').classList.remove('is-open');
    var btn = document.getElementById('btn-checkout');
    if (btn) btn.textContent = 'Continuar';
  }

  function onCheckoutClick() {
    if (!Object.keys(cart).length) return;
    if (!inCheckout) { showCheckoutForm(); return; }
    submitCheckout();
  }

  function submitCheckout() {
    var form = document.getElementById('checkout-form');
    var errEl = document.getElementById('checkout-error');
    var btn = document.getElementById('btn-checkout');
    errEl.style.display = 'none';

    var fd = new FormData(form);
    var customer = {
      name: (fd.get('name') || '').trim(),
      phone: (fd.get('phone') || '').trim(),
      address: (fd.get('address') || '').trim(),
      notes: (fd.get('notes') || '').trim(),
    };
    if (!customer.name || !customer.phone) {
      errEl.textContent = 'Completá nombre y teléfono para continuar.';
      errEl.style.display = 'block';
      return;
    }

    var items = Object.keys(cart).map(function (id) {
      return { productId: cart[id].id, qty: cart[id].qty };
    });

    btn.disabled = true;
    btn.textContent = 'Redirigiendo a MercadoPago…';

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items, customer: customer }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.init_point) {
          throw new Error((res.j && res.j.error) || 'No se pudo iniciar el pago.');
        }
        // El carrito se limpia recién al volver con pago aprobado (gracias.html).
        window.location.href = res.j.init_point;
      })
      .catch(function (err) {
        console.error('[checkout]', err);
        errEl.textContent = err.message || 'Hubo un problema. Probá de nuevo en un momento.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Pagar con MercadoPago';
      });
  }

  // ---------- tabs (definimos la función que usan los onclick del HTML) ----------
  window.switchTab = function (tab) {
    document.querySelectorAll('.catalog__tab').forEach(function (t) {
      var on = t.getAttribute('data-tab') === tab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.catalog__panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === 'panel-' + tab);
    });
  };

  // Permite vaciar el carrito desde otras páginas (gracias.html).
  window.atrClearCart = function () { localStorage.removeItem(CART_KEY); };

  // ---------- init ----------
  function init() {
    buildCartUI();
    var root = document.getElementById('store-root');
    if (root) root.addEventListener('click', onStoreClick);
    if (root) root.addEventListener('change', function (e) {
      var input = e.target.closest('[data-qty]');
      if (input) input.value = Math.max(1, Math.min(99, parseInt(input.value, 10) || 1));
    });
    loadProducts();
    renderCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
