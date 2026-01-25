const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

async function loadRecipes() {
    console.log("Загрузка рецептов...");
    const { data, error } = await _supabase.from('recipes').select('*').order('category');
    
    if (error) {
        console.error("Ошибка Supabase:", error);
        return;
    }

    allRecipes = data || [];
    console.log("Загружено рецептов:", allRecipes.length);
    renderCategorized(allRecipes);
}

function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = '';

    if (selectedRecipes.size > 0) {
        container.innerHTML = `<div style="padding: 0 20px 15px;">
            <button onclick="sendSelectedToCart()" style="width:100%; padding:15px; background:#46b8bc; color:white; border:none; border-radius:12px; font-weight:bold;">
                🛒 Собрать продукты (${selectedRecipes.size})
            </button>
        </div>`;
    }

    const groups = list.reduce((acc, r) => {
        const cat = r.category || 'Прочее';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.innerHTML = `
            <div style="font-weight:bold; padding: 10px 20px;">${category}</div>
            <div class="category-row">${items.map(r => `
                <div class="card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}" onclick="toggleRecipeSelect(${r.id})">
                    <div style="font-size:30px; margin-bottom:10px;">🍽️</div>
                    <div style="font-weight:bold; font-size:14px;">${r.name}</div>
                    <div style="color:#46b8bc; font-size:12px; margin-top:5px;">${r.kcal || 0} ккал</div>
                    <button onclick="event.stopPropagation(); openRecipeById(${r.id})" style="background:none; border:none; color:gray; font-size:11px; padding:5px 0; text-decoration:underline;">Состав</button>
                </div>`).join('')}</div>`;
        container.appendChild(section);
    }
}

// Вспомогательные функции
function toggleRecipeSelect(id) {
    selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id);
    renderCategorized(allRecipes);
}

function switchTab(type) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + type).classList.add('active');
    
    document.getElementById('recipe-list-section').style.display = type === 'recipes' ? 'block' : 'none';
    document.getElementById('stock-list-section').style.display = type === 'stock' ? 'block' : 'none';
    document.getElementById('cart-list-section').style.display = type === 'cart' ? 'block' : 'none';
    
    if (type === 'recipes') loadRecipes();
    if (type === 'cart') loadCart();
}

async function sendSelectedToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    for (const r of toAdd) {
        await _supabase.from('cart').insert([{ items: r.ings.split(',').map(i => i.trim().toLowerCase()), recipe_name: r.name }]);
    }
    alert('Добавлено в покупки!');
    selectedRecipes.clear();
    switchTab('cart');
}

async function loadCart() {
    const { data } = await _supabase.from('cart').select('*');
    const container = document.getElementById('cart-list');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Корзина пуста</p>';
        return;
    }
    container.innerHTML = `<button onclick="clearCart()" style="width:100%; padding:10px; background:#ff7675; color:white; border:none; border-radius:10px; margin-bottom:15px;">Очистить всё</button>` + 
        data.map((item, idx) => `<div class="card" style="width:auto; margin-bottom:10px; flex:none;" onclick="this.classList.toggle('checked-item')">
            <b>${item.recipe_name}</b><br><small>${item.items.join(', ')}</small>
        </div>`).join('');
}

async function clearCart() {
    if(confirm('Очистить?')) {
        await _supabase.from('cart').delete().neq('id', 0);
        loadCart();
    }
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', loadRecipes);
