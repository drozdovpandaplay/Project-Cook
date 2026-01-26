const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];

// Загрузка данных
async function init() {
    const { data } = await _supabase.from('recipes').select('*').order('name');
    allRecipes = data || [];
}

// Переключение разделов (Меню / Склад / Корзина)
function switchTab(tab, el) {
    document.querySelectorAll('.app-section').forEach(s => s.style.display = 'none');
    document.getElementById('section-' + tab).style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    
    if (tab === 'inventory') loadInventory();
    if (tab === 'shopping') loadShopping();
}

// Категории
function filterByCategory(cat) {
    const filtered = allRecipes.filter(r => r.category === cat);
    document.getElementById('main-categories').style.display = 'none';
    document.getElementById('recipe-grid').style.display = 'grid';
    document.getElementById('search-bar').style.display = 'flex';
    document.getElementById('main-title').innerText = cat + 'и';
    renderRecipes(filtered);
}

function showCategories() {
    document.getElementById('main-categories').style.display = 'grid';
    document.getElementById('recipe-grid').style.display = 'none';
    document.getElementById('search-bar').style.display = 'none';
    document.getElementById('main-title').innerText = 'Project Food';
}

function renderRecipes(list) {
    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = list.map(r => `
        <div class="card" onclick="openRecipe(${r.id})">
            <img src="${r.image_url || 'https://via.placeholder.com/150'}" class="card-img">
            <div style="padding:10px; font-size:14px; font-weight:bold;">${r.name}</div>
        </div>
    `).join('');
}

// РАБОТА СО СПИСКАМИ (Inventory & Shopping)
async function loadInventory() {
    const { data } = await _supabase.from('inventory').select('*').order('name');
    const cont = document.getElementById('inventory-list');
    cont.innerHTML = data.map(i => `<div class="list-item"><span>${i.name}</span> <b>${i.amount} ${i.unit}</b></div>`).join('');
}

async function loadShopping() {
    const { data } = await _supabase.from('shopping_list').select('*').order('checked');
    const cont = document.getElementById('shopping-list');
    cont.innerHTML = data.map(i => `
        <div class="list-item ${i.checked ? 'checked' : ''}" onclick="toggleShop(${i.id}, ${i.checked})">
            <span>${i.name}</span> <span>${i.checked ? '✅' : '⬜'}</span>
        </div>
    `).join('');
}

async function toggleShop(id, current) {
    await _supabase.from('shopping_list').update({ checked: !current }).eq('id', id);
    loadShopping();
}

// Модалка
function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const modal = document.getElementById('recipe-modal');
    document.getElementById('modal-body').innerHTML = `
        <img src="${r.image_url}" style="width:100%; height:200px; object-fit:cover;">
        <div class="padding">
            <h2>${r.name}</h2>
            <p><b>Ингредиенты:</b><br>${r.ings || 'Не указаны'}</p>
            <button class="btn-main" onclick="addToCart('${r.ings}')">🛒 Добавить в корзину</button>
        </div>
    `;
    modal.style.display = 'block';
}

async function addToCart(ings) {
    if (!ings) return;
    const items = ings.split(',').map(i => ({ name: i.trim() }));
    await _supabase.from('shopping_list').insert(items);
    alert('Продукты добавлены в корзину!');
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }

init();
