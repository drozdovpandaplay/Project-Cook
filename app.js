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
                    <div class="select-indicator">${selectedRecipes.has(r.id) ? '✓' : '+'}</div>
                    <span style="font-size:40px; display:block; margin-bottom:10px;">🍲</span>
                    <div style="font-weight:bold;">${r.name}</div>
                    <div style="color:var(--primary); font-size:14px; margin-top:5px;">${r.kcal || 0} ккал</div>
                </div>`).join('')}</div>`;
        container.appendChild(section);
    }
}

function toggleSelect(id) {
    selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id);
    renderCategorized(allRecipes);
}

// ФУНКЦИЯ ДОБАВЛЕНИЯ В ВАШУ ТАБЛИЦУ (dish_name, item_name)
async function sendToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    
    const payload = toAdd.map(r => ({
        dish_name: String(r.name),
        item_name: r.ings ? String(r.ings) : "", 
        price: 0 
    }));

    const { error } = await _supabase.from('cart').insert(payload);

    if (error) {
        alert("Ошибка сохранения: " + error.message);
    } else {
        selectedRecipes.clear();
        alert("Блюда успешно добавлены в список!");
        switchTab('cart');
    }
}

// ФУНКЦИЯ ЗАГРУЗКИ ИЗ ВАШЕЙ ТАБЛИЦЫ
async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="text-align:center; padding:50px;">Загрузка списка...</p>';

    const { data, error } = await _supabase.from('cart').select('*');
    
    if (error || !data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:100px; color:#b2bec3;">Список покупок пуст</p>';
        return;
    }

    let allItems = [];
    data.forEach(row => {
        if (row.item_name) {
            const splitIngs = row.item_name.split(',').map(i => i.trim().toLowerCase());
            allItems = allItems.concat(splitIngs);
        }
    });

    const counts = allItems.reduce((acc, v) => {
        acc[v] = (acc[v] || 0) + 1;
        return acc;
    }, {});

    let html = `<button onclick="clearCart()" class="main-btn" style="background:#ff7675; margin-bottom:20px;">Очистить всё</button>`;

    Object.entries(counts).forEach(([name, count]) => {
        html += `<div class="cart-card" onclick="this.classList.toggle('checked-item')">
            <span style="text-transform:capitalize; font-weight:600;">${name}</span>
            <span style="color:#b2bec3;">${count} уп.</span>
        </div>`;
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

async function clearCart() {
    if(confirm("Удалить весь список покупок?")) {
        const { error } = await _supabase.from('cart').delete().neq('id', 0);
        if (error) alert("Ошибка при удалении: " + error.message);
        loadCart();
    }
}

function search(q) {
    renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase())));
}

document.addEventListener('DOMContentLoaded', loadRecipes);
