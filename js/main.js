document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Шапка и мобильное меню ---------- */
  const header = document.querySelector('.header');
  const menuToggle = document.querySelector('.menu-toggle');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll); onScroll();
  if (menuToggle && dropdownMenu) {
    menuToggle.addEventListener('click', () => {
      dropdownMenu.style.display = dropdownMenu.style.display === 'flex' ? 'none' : 'flex';
      menuToggle.classList.toggle('rotated');
    });
  }

  /* ---------- Данные ---------- */
  const PRODUCTS = [
    { id: 1, cat: 'beton',   name: 'Бетон М200 (B15)', desc: 'Подготовка под фундамент, дорожки', price: 4600 },
    { id: 2, cat: 'beton',   name: 'Бетон М300 (B22.5)', desc: 'Фундаменты, стяжки, монолитные стены', price: 4950 },
    { id: 3, cat: 'beton',   name: 'Бетон М350 (B25)', desc: 'Плиты перекрытия, ответственные конструкции', price: 5300 },
    { id: 4, cat: 'beton',   name: 'Бетон М400 (B30)', desc: 'Колонны, мосты, дорожные плиты', price: 5700 },
    { id: 5, cat: 'rastvor', name: 'Раствор кладочный М100', desc: 'Кирпичная и блочная кладка', price: 3900 },
    { id: 6, cat: 'rastvor', name: 'Раствор штукатурный М150', desc: 'Выравнивание стен', price: 4200 },
    { id: 7, cat: 'blocks',  name: 'Блок ФБС 24.4.6', desc: '2380×400×580 мм, 1,6 т', price: 4800, unit: 'шт' },
    { id: 8, cat: 'blocks',  name: 'Бордюр БР 100.30.15', desc: '1000×300×150 мм', price: 650, unit: 'шт' }
  ];
  const fmt = n => n.toLocaleString('ru-RU') + ' ₽';

  /* ---------- Корзина (localStorage) ---------- */
  const load = () => { try { return JSON.parse(localStorage.getItem('bag')) || []; } catch { return []; } };
  const save = bag => { localStorage.setItem('bag', JSON.stringify(bag)); updateCount(); };
  function updateCount() {
    const n = load().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = n);
  }
  function addToBag(id, qty = 1) {
    const bag = load(); const found = bag.find(i => i.id === id);
    if (found) found.qty += qty; else bag.push({ id, qty });
    save(bag);
  }
  updateCount();

  /* ---------- Каталог ---------- */
  const catalog = document.getElementById('catalog');
  if (catalog) {
    const render = filter => {
      catalog.innerHTML = PRODUCTS.filter(p => filter === 'all' || p.cat === filter).map(p => `
        <div class="item">
          <h3>${p.name}</h3><small>${p.desc}</small>
          <div class="price">${fmt(p.price)} <small>/ ${p.unit || 'м³'}</small></div>
          <button class="btn" data-id="${p.id}">В заявку</button>
        </div>`).join('');
    };
    const start = location.hash.slice(1) || 'all';
    const apply = f => {
      document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
      render(f);
    };
    apply(['beton', 'rastvor', 'blocks'].includes(start) ? start : 'all');
    document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => apply(b.dataset.filter)));
    catalog.addEventListener('click', e => {
      const btn = e.target.closest('button[data-id]'); if (!btn) return;
      addToBag(+btn.dataset.id);
      btn.textContent = 'Добавлено';
      setTimeout(() => btn.textContent = 'В заявку', 1200);
    });
  }

  /* ---------- Калькулятор ---------- */
  const calc = document.getElementById('calc');
  if (calc) {
    calc.addEventListener('click', () => {
      const l = +document.getElementById('len').value, w = +document.getElementById('wid').value, h = +document.getElementById('hei').value;
      const grade = +document.getElementById('type').value; // 1 — М200, 2 — М300, 3 — М350
      const out = document.getElementById('result');
      out.hidden = false;
      if (!(l > 0 && w > 0 && h > 0)) { out.textContent = 'Введите размеры больше нуля.'; return; }
      const vol = Math.ceil(l * w * h * 1.05 * 10) / 10; // запас 5%
      const prod = PRODUCTS[grade === 1 ? 0 : grade === 2 ? 1 : 2];
      out.innerHTML = `Нужно <b>${vol} м³</b> (с запасом 5%).<br>Рекомендуем: ${prod.name}.<br>Стоимость: <b>${fmt(Math.round(vol * prod.price))}</b>
        <br><button class="btn" id="addCalc">Добавить в заявку</button>`;
      document.getElementById('addCalc').addEventListener('click', e => {
        addToBag(prod.id, vol); e.target.textContent = 'Добавлено';
      });
    });
  }

  /* ---------- Заявка ---------- */
  const bagBox = document.getElementById('bag');
  if (bagBox) {
    const draw = () => {
      const bag = load();
      if (!bag.length) { bagBox.innerHTML = '<p class="empty">Заявка пуста. Выберите продукцию в каталоге.</p>'; return; }
      let total = 0;
      bagBox.innerHTML = bag.map(i => {
        const p = PRODUCTS.find(x => x.id === i.id); total += p.price * i.qty;
        return `<div class="bag-row"><span>${p.name}</span>
          <input type="number" min="0.1" step="0.1" value="${i.qty}" data-id="${i.id}"> ${p.unit || 'м³'}
          <b>${fmt(Math.round(p.price * i.qty))}</b><button data-del="${i.id}" aria-label="Удалить">✕</button></div>`;
      }).join('') + `<div class="total">Итого: ${fmt(Math.round(total))}</div>`;
    };
    draw();
    bagBox.addEventListener('change', e => {
      if (!e.target.dataset.id) return;
      const bag = load(), it = bag.find(i => i.id === +e.target.dataset.id);
      it.qty = Math.max(0.1, +e.target.value || 1); save(bag); draw();
    });
    bagBox.addEventListener('click', e => {
      if (!e.target.dataset.del) return;
      save(load().filter(i => i.id !== +e.target.dataset.del)); draw();
    });
    document.getElementById('order').addEventListener('submit', e => {
      e.preventDefault();
      const err = document.getElementById('error');
      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.replace(/\D/g, '');
      const addr = document.getElementById('addr').value.trim();
      if (!load().length) { err.textContent = 'Добавьте в заявку хотя бы одну позицию.'; return; }
      if (!name || phone.length < 10 || !addr) { err.textContent = 'Заполните имя, телефон (от 10 цифр) и адрес доставки.'; return; }
      err.textContent = ''; save([]); draw(); e.target.reset();
      alert('Заявка отправлена. Диспетчер перезвонит в течение 15 минут.');
    });
  }
});
