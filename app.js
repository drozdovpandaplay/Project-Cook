const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

async function loadRecipes() {
    const { data, error } = await _supabase.from('recipes').select('*').order('category');
    if (error) return console.error("Ошибка загрузки:", error);
    allRecipes = data || [];
    renderCategorized(allRecipes);
}

function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    const btnBox = document.getElementById('action-btn-container');
    if (!container) return;
    
    container.innerHTML = '';
    btnBox.innerHTML = selectedRecipes.size > 0 
        ? `<button class="main-btn" onclick="sendToCart()">🛒 Добавить в список (${selectedRecipes.size})</button>` 
        : '';

    const groups = list.reduce((acc, r) => {
        const cat = r.category || 'Меню';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.innerHTML = `<div class="category-title">${category}</div>`;
        const row = document.createElement('div');
        row.className = 'category-row';

        items.forEach(r => {
            // Используем loremflickr для стабильной загрузки фото по названию
            const img = r.image_url || `https://loremflickr.com/400/300/food,dish,${encodeURIComponent(r.name.split(' ')[0])}`;
            const card = document.createElement('div');
            card.className = `card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}`;
            card.onclick = () => toggleSelect(r.id);
            card.innerHTML = `
                <img src="${img}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Food'">
                <div style="display:flex; justify-content:space-between; align-items:center; min-height:44px;">
                    <div style="font-weight:700; font-size:16px;">${r.name}</div>
                    <button onclick="event.stopPropagation(); openRecipe(${r.id})" class="card-info-btn">СОСТАВ</button>
                </div>
                <div class="card-meta">
                    <span>⚖️ ${r.weight || 0}г</span>
                    <span>👥 ${r.servings || 1} чел.</span>
                    <span style="color:#46b8bc; font-weight:800;">${r.price || 0} ₽</span>
                </div>`;
            row.appendChild(card);
        });
        section.appendChild(row);
        container.appendChild(section);
    }
}

async function sendToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    // Колонки dish_name и item_name соответствуют вашей таблице cart
    const payload = toAdd.map(r => ({
        dish_name: r.name,
        item_name: r.ings || "",
        price: r.price || 0
    }));

    const { error } = await _supabase.from('cart').insert(payload);
    if (error) alert("Ошибка: " + error.message);
    else {
        selectedRecipes.clear();
        switchTab('cart');
    }
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="text-align:center;">Загрузка корзины...</p>';
    const { data } = await _supabase.from('cart').select('*');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:50px; color:#b2bec3;">Список пуст</p>';
        return;
    }
    
    let allIngs = [];
    data.forEach(row => { 
        if (row.item_name) allIngs = allIngs.concat(row.item_name.split(',').map(i => i.trim().toLowerCase())); 
    });
    
    const counts = allIngs.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
    let html = `<button onclick="clearCart()" class="main-btn" style="background:#ff7675; margin-bottom:20px;">ОЧИСТИТЬ ВСЁ</button>`;
    
    Object.entries(counts).forEach(([name, count]) => {
        html += `<div class="cart-card" onclick="this.classList.toggle('checked-item')">
            <b style="text-transform:capitalize;">${name}</b>
            <span style="font-weight:700; color:#b2bec3;">${count} шт.</span>
        </div>`;
    });
    container.innerHTML = html;
}

function switchTab(tab) {
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

async function loadAllIngredients() {
    const container = document.getElementById('ingredients-full-list');
    container.innerHTML = '<p>Загрузка...</p>';
    const { data } = await _supabase.from('products').select('*').order('name');
    container.innerHTML = data ? data.map(i => `
        <div class="cart-card">
            <b style="text-transform:capitalize;">${i.name}</b>
            <span style="color:#46b8bc; font-weight:800;">${i.price} ₽</span>
        </div>`).join('') : '<p>Пусто</p>';
}

function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    if (!r) return;
    const ings = (r.ings || '').split(',').map(i => `<li>${i.trim()}</li>`).join('');
    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin-top:0;">${r.name}</h2>
        <ul style="padding-left:20px; font-size:16px; line-height:1.6;">${ings}</ul>
        <button onclick="closeModal()" class="main-btn" style="background:#eee; color:#333; box-shadow:none; margin-top:20px;">ЗАКРЫТЬ</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function search(q) { renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))); }
async function clearCart() { if(confirm("Очистить?")) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
function toggleSelect(id) {
    if (selectedRecipes.has(id)) selectedRecipes.delete(id);
    else selectedRecipes.add(id);
    renderCategorized(allRecipes);
}

document.addEventListener('DOMContentLoaded', loadRecipes);
