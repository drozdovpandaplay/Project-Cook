const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

async function loadRecipes() {
    const { data, error } = await _supabase.from('recipes').select('*').order('category');
    if (error) return console.error(error);
    allRecipes = data || [];
    renderCategorized(allRecipes);
}

function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    const btnBox = document.getElementById('action-btn-container');
    if (!container) return;
    
    container.innerHTML = '';
    btnBox.innerHTML = selectedRecipes.size > 0 
        ? `<button class="main-btn" onclick="sendToCart()">🛒 Собрать список (${selectedRecipes.size})</button>` 
        : '';

    const groups = list.reduce((acc, r) => {
        const cat = r.category || 'Меню';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.innerHTML = `
            <div class="category-title">${category}</div>
            <div class="category-row">${items.map(r => {
                // Используем сохраненную ссылку или динамическую
                const img = r.image_url || `https://source.unsplash.com/featured/400x300?food,${r.name.split(' ')[0]}`;
                return `
                <div class="card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}" onclick="toggleSelect(${r.id})">
                    <img src="${img}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Food'">
                    <div style="display:flex; justify-content:space-between; align-items: center; min-height:44px;">
                        <div style="font-weight:700; font-size:16px; line-height:1.2;">${r.name}</div>
                        <button onclick="event.stopPropagation(); openRecipe(${r.id})" class="card-info-btn">СОСТАВ</button>
                    </div>
                    <div class="card-meta">
                        <span>⚖️ ${r.weight || 0}г</span>
                        <span>👥 ${r.servings || 1}</span>
                        <span class="price-tag">${r.price || 0} ₽</span>
                    </div>
                </div>`;
            }).join('')}</div>`;
        container.appendChild(section);
    }
}

async function sendToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    // Используем dish_name и item_name согласно вашей структуре БД
    const payload = toAdd.map(r => ({
        dish_name: r.name,
        item_name: r.ings || "",
        price: r.price || 0
    }));

    const { error } = await _supabase.from('cart').insert(payload);
    if (error) {
        alert("Ошибка доступа. Проверьте политики (RLS) для таблицы cart.");
        console.error(error);
    } else {
        selectedRecipes.clear();
        switchTab('cart');
    }
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="text-align:center;">Загрузка...</p>';
    const { data, error } = await _supabase.from('cart').select('*');
    if (error) return console.error(error);
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:50px; color:#b2bec3;">Список покупок пуст</p>';
        return;
    }
    
    let allIngs = [];
    data.forEach(row => { 
        if (row.item_name) {
            allIngs = allIngs.concat(row.item_name.split(',').map(i => i.trim().toLowerCase()));
        }
    });
    
    const counts = allIngs.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});

    let html = `<button onclick="clearCart()" class="main-btn" style="background:#ff7675; margin-bottom:25px;">ОЧИСТИТЬ ВСЁ</button>`;
    Object.entries(counts).forEach(([name, count]) => {
        if (name) {
            html += `<div class="cart-card" onclick="this.classList.toggle('checked-item')">
                <b style="text-transform:capitalize;">${name}</b>
                <span style="color:#b2bec3; font-weight:800;">${count} шт.</span>
            </div>`;
        }
    });
    container.innerHTML = html;
}

function switchTab(tab) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const sectionMap = {
        'recipes': 'recipe-list-section',
        'cart': 'cart-list-section',
        'all-ingredients': 'all-ingredients-section'
    };
    
    document.getElementById(sectionMap[tab]).classList.add('active');
    const btn = document.getElementById('btn-' + (tab === 'all-ingredients' ? 'recipes' : tab));
    if (btn) btn.classList.add('active');

    if (tab === 'recipes') loadRecipes();
    if (tab === 'cart') loadCart();
    if (tab === 'all-ingredients') loadAllIngredients();
}

async function loadAllIngredients() {
    const container = document.getElementById('ingredients-full-list');
    container.innerHTML = '<p>Загрузка...</p>';
    const { data } = await _supabase.from('products').select('*').order('name');
    container.innerHTML = data ? data.map(i => `
        <div class="ing-item">
            <b style="text-transform:capitalize;">${i.name}</b>
            <span style="color:#46b8bc; font-weight:800;">${i.price} ₽</span>
        </div>`).join('') : '<p>Пусто</p>';
}

function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    if (!r) return;
    const ingsHtml = r.ings ? r.ings.split(',').map(i => `<li style="margin-bottom:8px;">${i.trim()}</li>`).join('') : 'Состав не указан';
    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin:0 0 20px;">${r.name}</h2>
        <ul style="padding-left:20px; font-size:16px;">${ingsHtml}</ul>
        <button onclick="closeModal()" class="main-btn" style="background:#eee; color:#333; margin-top:25px; box-shadow:none;">ЗАКРЫТЬ</button>`;
    document.getElementById('recipe-modal').style.display = 'block';
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function search(q) { renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))); }
async function clearCart() { if(confirm("Очистить корзину?")) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
function toggleSelect(id) { selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id); renderCategorized(allRecipes); }

document.addEventListener('DOMContentLoaded', loadRecipes);
