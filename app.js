const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

async function loadRecipes() {
    const { data } = await _supabase.from('recipes').select('*').order('category');
    allRecipes = data || [];
    renderCategorized(allRecipes);
}

// НОВАЯ ФУНКЦИЯ: ЗАГРУЗКА ВСЕХ ИНГРЕДИЕНТОВ ИЗ БАЗЫ "PRODUCTS"
async function loadAllIngredients() {
    const container = document.getElementById('ingredients-full-list');
    container.innerHTML = '<p>Загрузка базы продуктов...</p>';
    
    const { data, error } = await _supabase.from('products').select('*').order('name');
    
    if (error) {
        container.innerHTML = '<p>Ошибка доступа к базе продуктов</p>';
        return;
    }

    let html = '';
    data.forEach(item => {
        html += `
            <div class="ing-item">
                <div>
                    <b>${item.name}</b><br>
                    <small style="color:gray">за 1000 г/мл</small>
                </div>
                <div class="ing-price">${item.price} ₽</div>
            </div>`;
    });
    container.innerHTML = html || '<p>База продуктов пуста</p>';
}

function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    const btnBox = document.getElementById('action-btn-container');
    if (!container) return;
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
            <div style="font-weight:700; padding:25px 25px 10px; color:#636e72; font-size:12px; text-transform:uppercase;">${category}</div>
            <div class="category-row">${items.map(r => `
                <div class="card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}" onclick="toggleSelect(${r.id})">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-size:40px;">🍲</span>
                        <button onclick="event.stopPropagation(); openRecipe(${r.id})" style="background:#f1f2f6; border:none; border-radius:10px; padding:5px 10px; font-size:11px; color:var(--primary); font-weight:bold;">СОСТАВ</button>
                    </div>
                    <div style="font-weight:700; font-size:18px; margin:15px 0 5px;">${r.name}</div>
                    <div style="display:flex; justify-content:space-between; margin-top:15px; border-top:1px dashed #eee; padding-top:15px; font-size:13px; color:#636e72;">
                        <span>⚖️ ${r.weight || 0}г</span>
                        <span>👥 ${r.servings || 1} чел.</span>
                        <span style="color:var(--primary); font-weight:700;">${r.price || 0} ₽</span>
                    </div>
                </div>`).join('')}</div>`;
        container.appendChild(section);
    }
}

function switchTab(tab) {
    // Скрываем все секции
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    if (tab === 'recipes') {
        document.getElementById('recipe-list-section').classList.add('active');
        document.getElementById('btn-recipes').classList.add('active');
        loadRecipes();
    } else if (tab === 'cart') {
        document.getElementById('cart-list-section').classList.add('active');
        document.getElementById('btn-cart').classList.add('active');
        loadCart();
    } else if (tab === 'all-ingredients') {
        document.getElementById('all-ingredients-section').classList.add('active');
        loadAllIngredients();
    }
}

// ... (остальные функции: toggleSelect, sendToCart, loadCart, openRecipe, closeModal остаются прежними)
async function sendToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    const payload = toAdd.map(r => ({ dish_name: r.name, item_name: r.ings || "", price: r.price || 0 }));
    await _supabase.from('cart').insert(payload);
    selectedRecipes.clear();
    switchTab('cart');
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p>Загрузка...</p>';
    const { data } = await _supabase.from('cart').select('*');
    if (!data || data.length === 0) { container.innerHTML = '<p style="text-align:center; padding:50px;">Список пуст</p>'; return; }
    let allIngs = [];
    data.forEach(row => { if (row.item_name) allIngs = allIngs.concat(row.item_name.split(',').map(i => i.trim().toLowerCase())); });
    const counts = allIngs.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
    let html = `<button onclick="clearCart()" class="main-btn" style="background:#ff7675; margin-bottom:20px;">Очистить всё</button>`;
    Object.entries(counts).forEach(([name, count]) => {
        html += `<div style="background:white; padding:18px; border-radius:20px; margin-bottom:12px; display:flex; justify-content:space-between;"><b>${name}</b><span>${count} шт.</span></div>`;
    });
    container.innerHTML = html;
}

function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin-top:0;">${r.name}</h2>
        <ul style="line-height:1.8;">${r.ings ? r.ings.split(',').map(i => `<li>${i.trim()}</li>`).join('') : ''}</ul>
        <button onclick="closeModal()" class="main-btn" style="background:#eee; color:#333; margin-top:20px;">Закрыть</button>`;
    document.getElementById('recipe-modal').style.display = 'block';
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function search(q) { renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))); }
async function clearCart() { if(confirm("Очистить?")) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }

document.addEventListener('DOMContentLoaded', loadRecipes);
