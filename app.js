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

// Автоматический поиск фото еды по названию
function getPhoto(recipe) {
    if (recipe.image_url) return recipe.image_url;
    const query = encodeURIComponent(`food,${recipe.name}`);
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80`; // Резервное фото
    // Для динамики используйте: return `https://source.unsplash.com/featured/400x300?food,${recipe.name.replace(/\s/g, ',')}`;
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
        const cat = r.category || 'Разное';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.innerHTML = `
            <div class="category-title">${category}</div>
            <div class="category-row">${items.map(r => {
                const img = r.image_url || `https://source.unsplash.com/featured/400x300?food,${r.name.split(' ')[0]}`;
                return `
                <div class="card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}" onclick="toggleSelect(${r.id})">
                    <img src="${img}" class="card-image" loading="lazy">
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

async function loadAllIngredients() {
    const container = document.getElementById('ingredients-full-list');
    container.innerHTML = '<p style="text-align:center;">Загрузка продуктов...</p>';
    const { data } = await _supabase.from('products').select('*').order('name');
    if (!data) return container.innerHTML = '<p>База недоступна</p>';

    container.innerHTML = data.map(item => `
        <div class="ing-item">
            <div style="font-weight:700; text-transform:capitalize;">${item.name}</div>
            <div style="color:var(--primary); font-weight:800;">${item.price} ₽</div>
        </div>`).join('');
}

function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const ingsHtml = r.ings ? r.ings.split(',').map(i => `<li style="margin-bottom:8px;">${i.trim()}</li>`).join('') : 'Нет состава';
    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin:0 0 20px;">${r.name}</h2>
        <ul style="padding-left:20px; font-size:16px; color:#2d3436;">${ingsHtml}</ul>
        <button onclick="closeModal()" class="main-btn" style="background:#eee; color:#333; margin-top:25px; box-shadow:none;">ЗАКРЫТЬ</button>`;
    document.getElementById('recipe-modal').style.display = 'block';
}

async function sendToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    const payload = toAdd.map(r => ({ dish_name: r.name, item_name: r.ings || "", price: r.price || 0 }));
    await _supabase.from('cart').insert(payload);
    selectedRecipes.clear();
    switchTab('cart');
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="text-align:center;">Синхронизация...</p>';
    const { data } = await _supabase.from('cart').select('*');
    if (!data || data.length === 0) { container.innerHTML = '<p style="text-align:center; padding:50px;">Список покупок пуст</p>'; return; }
    
    let allIngs = [];
    data.forEach(row => { if (row.item_name) allIngs = allIngs.concat(row.item_name.split(',').map(i => i.trim().toLowerCase())); });
    const counts = allIngs.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});

    let html = `<button onclick="clearCart()" class="main-btn" style="background:#ff7675; margin-bottom:25px;">ОЧИСТИТЬ КОРЗИНУ</button>`;
    Object.entries(counts).forEach(([name, count]) => {
        html += `<div class="cart-card" onclick="this.classList.toggle('checked-item')">
            <b style="text-transform:capitalize;">${name}</b>
            <span style="color:#b2bec3; font-weight:800;">${count} шт.</span>
        </div>`;
    });
    container.innerHTML = html;
}

function switchTab(tab) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (tab === 'recipes') { document.getElementById('recipe-list-section').classList.add('active'); document.getElementById('btn-recipes').classList.add('active'); loadRecipes(); }
    else if (tab === 'cart') { document.getElementById('cart-list-section').classList.add('active'); document.getElementById('btn-cart').classList.add('active'); loadCart(); }
    else if (tab === 'all-ingredients') { document.getElementById('all-ingredients-section').classList.add('active'); loadAllIngredients(); }
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function search(q) { renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))); }
async function clearCart() { if(confirm("Удалить всё?")) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
function toggleSelect(id) { selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id); renderCategorized(allRecipes); }

document.addEventListener('DOMContentLoaded', loadRecipes);
