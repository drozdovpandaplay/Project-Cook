const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

async function loadRecipes() {
    const { data, error } = await _supabase.from('recipes').select('*').order('category');
    if (error) return console.error("Ошибка:", error);
    allRecipes = data || [];
    renderCategorized(allRecipes);
}

function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    const btnBox = document.getElementById('action-btn-container');
    if (!container || !btnBox) return;

    container.innerHTML = '';
    btnBox.innerHTML = selectedRecipes.size > 0 
        ? `<button class="main-btn" onclick="sendToCart()">🛒 Собрать продукты (${selectedRecipes.size})</button>` 
        : '';

    const groups = list.reduce((acc, r) => {
        const cat = r.category || 'Прочее';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.innerHTML = `
            <div class="category-title">${category}</div>
            <div class="category-row">${items.map(r => `
                <div class="card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}" onclick="toggleSelect(${r.id})">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-size:40px;">🍲</span>
                        <button onclick="event.stopPropagation(); openRecipe(${r.id})" style="background:#f1f2f6; border:none; border-radius:10px; padding:5px 10px; font-size:12px; font-weight:600; color:var(--primary);">ИНФО</button>
                    </div>
                    <div style="font-weight:700; font-size:18px; margin: 10px 0 5px;">${r.name}</div>
                    <div style="color:var(--primary); font-size:14px; font-weight:600;">${r.kcal || 0} ккал</div>
                    
                    <div class="card-meta">
                        <span>⚖️ ${r.weight || '—'} г</span>
                        <span>👥 ${r.servings || 1} чел.</span>
                        <span class="price-tag">${r.price || 0} ₽</span>
                    </div>
                </div>`).join('')}</div>`;
        container.appendChild(section);
    }
}

// ОТКРЫТИЕ ИНГРЕДИЕНТОВ
function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const modal = document.getElementById('recipe-modal');
    const body = document.getElementById('modal-body');
    
    const ings = r.ings ? r.ings.split(',').map(i => `<li>${i.trim()}</li>`).join('') : 'Нет данных';
    
    body.innerHTML = `
        <h2 style="margin-top:0;">${r.name}</h2>
        <p style="color:#636e72;">${r.description || 'Вкусное домашнее блюдо.'}</p>
        <h4 style="margin-bottom:10px;">Ингредиенты:</h4>
        <ul style="padding-left:20px; line-height:1.6;">${ings}</ul>
        <div style="background:#f7f9fb; padding:15px; border-radius:15px; margin-top:20px; display:flex; justify-content:space-between;">
            <b>Вес: ${r.weight}г</b>
            <b>Людей: ${r.servings}</b>
        </div>
    `;
    modal.style.display = 'block';
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }

function toggleSelect(id) {
    selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id);
    renderCategorized(allRecipes);
}

async function sendToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    const payload = toAdd.map(r => ({ dish_name: r.name, item_name: r.ings || "", price: r.price || 0 }));
    const { error } = await _supabase.from('cart').insert(payload);
    if (!error) { selectedRecipes.clear(); switchTab('cart'); }
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="text-align:center;">Загрузка...</p>';
    const { data } = await _supabase.from('cart').select('*');
    if (!data || data.length === 0) { container.innerHTML = '<p style="text-align:center; padding:100px; color:#b2bec3;">Список пуст</p>'; return; }
    
    let allIngs = [];
    data.forEach(row => { if (row.item_name) allIngs = allIngs.concat(row.item_name.split(',').map(i => i.trim().toLowerCase())); });
    const counts = allIngs.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});

    let html = `<button onclick="clearCart()" class="main-btn" style="background:#ff7675;">Очистить всё</button>`;
    Object.entries(counts).forEach(([name, count]) => {
        html += `<div class="cart-card" onclick="this.classList.toggle('checked-item')"><b>${name}</b><span>${count} шт.</span></div>`;
    });
    container.innerHTML = html;
}

function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('btn-' + tab).classList.add('active');
    document.getElementById('recipe-list-section').style.display = tab === 'recipes' ? 'block' : 'none';
    document.getElementById('cart-list-section').style.display = tab === 'cart' ? 'block' : 'none';
    if(tab === 'recipes') loadRecipes();
    if(tab === 'cart') loadCart();
}

async function clearCart() { if(confirm("Удалить?")) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
function search(q) { renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))); }
document.addEventListener('DOMContentLoaded', loadRecipes);
