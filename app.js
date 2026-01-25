const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

async function loadRecipes() {
    try {
        const { data, error } = await _supabase.from('recipes').select('*').order('category');
        if (error) throw error;
        allRecipes = data || [];
        renderCategorized(allRecipes);
    } catch (e) {
        console.error("Ошибка загрузки данных:", e.message);
    }
}

function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    const btnBox = document.getElementById('action-btn-container');
    if (!container || !btnBox) return;

    container.innerHTML = '';
    btnBox.innerHTML = selectedRecipes.size > 0 
        ? `<button class="main-btn" onclick="sendToCart()">🛒 Добавить в покупки (${selectedRecipes.size})</button>` 
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
                    <div class="select-indicator">${selectedRecipes.has(r.id) ? '✓' : '+'}</div>
                    <span class="card-icon">🍲</span>
                    <div class="card-name">${r.name}</div>
                    <div class="card-info">${r.kcal || 0} ккал</div>
                </div>`).join('')}</div>`;
        container.appendChild(section);
    }
}

function toggleSelect(id) {
    selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id);
    renderCategorized(allRecipes);
}

async function sendToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    const payload = toAdd.map(r => ({
        recipe_name: r.name,
        items: r.ings ? r.ings.split(',').map(i => i.trim().toLowerCase()) : []
    }));

    const { error } = await _supabase.from('cart').insert(payload);
    if (error) {
        alert("Ошибка! Проверь настройки RLS в Supabase: " + error.message);
    } else {
        selectedRecipes.clear();
        switchTab('cart');
    }
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="text-align:center; padding:50px;">Загрузка...</p>';
    const { data } = await _supabase.from('cart').select('*');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:100px; color:#b2bec3;">Список покупок пуст</p>';
        return;
    }

    let allIngs = [];
    data.forEach(d => { if(d.items) allIngs = allIngs.concat(d.items); });
    const counts = allIngs.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});

    let html = `<button onclick="clearCart()" class="main-btn" style="background:#ff7675; margin-bottom:20px;">Очистить список</button>`;
    Object.entries(counts).forEach(([name, count]) => {
        html += `<div class="cart-card" onclick="this.classList.toggle('checked-item')">
            <b style="text-transform:capitalize;">${name}</b>
            <span style="color:#b2bec3;">${count} шт.</span>
        </div>`;
    });
    container.innerHTML = html;
}

function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('btn-' + tab).classList.add('active');
    document.getElementById(tab + '-list-section').classList.add('active');
    if(tab === 'recipes') loadRecipes();
    if(tab === 'cart') loadCart();
}

async function clearCart() {
    if(confirm("Удалить всё?")) {
        await _supabase.from('cart').delete().neq('id', 0);
        loadCart();
    }
}

function search(q) {
    renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase())));
}

document.addEventListener('DOMContentLoaded', loadRecipes);
