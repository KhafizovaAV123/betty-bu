document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Шапка и мобильное меню ---------- */
  const header = document.querySelector('.header');
  const menuToggle = document.querySelector('.menu-toggle');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll); 
    onScroll();
  }

  if (menuToggle && dropdownMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      dropdownMenu.classList.toggle('active');
      menuToggle.classList.toggle('rotated');
    });
  }

  /* ---------- Данные о товарах ---------- */
  const PRODUCTS = [
    { id: 1, cat: 'dogs',   name: 'Корм для собак Adult', desc: 'Сухой корм с говядиной, 15 кг', price: 3200 },
    { id: 2, cat: 'dogs',   name: 'Игрушка-канат', desc: 'Для активных игр, 40 см', price: 450 },
    { id: 3, cat: 'cats',   name: 'Корм для кошек Sterilized', desc: 'Сухой корм с индейкой, 10 кг', price: 4100 },
    { id: 4, cat: 'cats',   name: 'Наполнитель комкующийся', desc: 'Бентонит, 10 л', price: 550 },
    { id: 5, cat: 'birds',  name: 'Зерновая смесь для попугаев', desc: 'Основа рациона, 1 кг', price: 280 },
    { id: 6, cat: 'birds',  name: 'Клетка для птиц', desc: 'С жердочками и кормушками', price: 2500, unit: 'шт' },
    { id: 7, cat: 'fish',   name: 'Корм для аквариумных рыб', desc: 'Хлопья, 100 г', price: 350 },
    { id: 8, cat: 'fish',   name: 'Фильтр для аквариума', desc: 'Внутренний, до 100 л', price: 1800, unit: 'шт' }
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
          <div class="price">${fmt(p.price)} <small>/ ${p.unit || 'шт'}</small></div>
          <button class="btn" data-id="${p.id}">В заявку</button>
        </div>`).join('');
    };
    const start = location.hash.slice(1) || 'all';
    const apply = f => {
      document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
      render(f);
    };
    apply(['dogs', 'cats', 'birds', 'fish'].includes(start) ? start : 'all');
    document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => apply(b.dataset.filter)));
    catalog.addEventListener('click', e => {
      const btn = e.target.closest('button[data-id]'); if (!btn) return;
      addToBag(+btn.dataset.id);
      btn.textContent = 'Добавлено';
      setTimeout(() => btn.textContent = 'В заявку', 1200);
    });
  }

  /* ---------- Калькулятор корма ---------- */
  const calc = document.getElementById('calc');
  if (calc) {
    calc.addEventListener('click', () => {
      const weight = +document.getElementById('len').value;
      const petType = +document.getElementById('type').value;
      const out = document.getElementById('result');
      out.hidden = false;
      if (!(weight > 0)) { out.textContent = 'Введите вес больше нуля.'; return; }
      
      let dailyNorm = 0;
      let prod = null;
      if (petType === 1) { dailyNorm = weight * 20; prod = PRODUCTS[0]; } 
      else if (petType === 2) { dailyNorm = weight * 15; prod = PRODUCTS[2]; } 
      else if (petType === 3) { dailyNorm = 20; prod = PRODUCTS[4]; } 
      else { dailyNorm = 5; prod = PRODUCTS[6]; } 

      out.innerHTML = `Суточная норма: <b>${dailyNorm} г</b>.<br>Рекомендуем: ${prod.name}.<br>Стоимость: <b>${fmt(prod.price)}</b>
        <br><button class="btn" id="addCalc">Добавить в заявку</button>`;
      document.getElementById('addCalc').addEventListener('click', e => {
        addToBag(prod.id, 1); e.target.textContent = 'Добавлено';
      });
    });
  }

  /* ---------- Заявка ---------- */
  const bagBox = document.getElementById('bag');
  if (bagBox) {
    const draw = () => {
      const bag = load();
      if (!bag.length) { bagBox.innerHTML = '<p class="empty">Заявка пуста. Выберите товары в каталоге.</p>'; return; }
      let total = 0;
      bagBox.innerHTML = bag.map(i => {
        const p = PRODUCTS.find(x => x.id === i.id); total += p.price * i.qty;
        return `<div class="bag-row"><span>${p.name}</span>
          <input type="number" min="1" step="1" value="${i.qty}" data-id="${i.id}"> ${p.unit || 'шт'}
          <b>${fmt(Math.round(p.price * i.qty))}</b><button data-del="${i.id}" aria-label="Удалить">✕</button></div>`;
      }).join('') + `<div class="total">Итого: ${fmt(Math.round(total))}</div>`;
    };
    draw();
    bagBox.addEventListener('change', e => {
      if (!e.target.dataset.id) return;
      const bag = load(), it = bag.find(i => i.id === +e.target.dataset.id);
      it.qty = Math.max(1, +e.target.value || 1); save(bag); draw();
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
      if (!load().length) { err.textContent = 'Добавьте в заявку хотя бы один товар.'; return; }
      if (!name || phone.length < 10 || !addr) { err.textContent = 'Заполните имя, телефон (от 10 цифр) и адрес доставки.'; return; }
      err.textContent = ''; save([]); draw(); e.target.reset();
      alert('Заявка отправлена. Мы доставим заказ в течение 3 часов!');
    });
  }
});
