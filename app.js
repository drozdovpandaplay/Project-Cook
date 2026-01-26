const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// Инициализация
async function init() {
    const { data } = await _supabase.from('recipes').select('*').order('name');
    allRecipes = data || [];
}

// ПЕРЕКЛЮЧЕНИЕ СЕКЦИЙ
function switchSection(name, el) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    if(el) el.classList.add('active');
    
    const target = document.getElementById(name + '-section');
    if (target) target.style.display = 'block';

    if (name === 'menu') showCategories();
    if (name === 'calendar') renderCalendar();
    if (name === 'products') renderProducts();
    if (name === 'inventory') renderInventory();
    if (name === 'shopping') renderShopping();
}

// --- РАБОТА С РЕЦЕПТАМИ ---
function filterByCategory(cat) {
    const filtered = allRecipes.filter(r => r.category === cat);
    document.getElementById('main-categories').style.display = 'none';
    document.getElementById('recipe-grid').style.display = 'grid';
    document.getElementById('search-bar').style.display = 'flex';
    
    let titles = { 'Суп': 'Супы', 'Второе блюдо': 'Вторые блюда', 'Салат': 'Салаты', 'Гарнир': 'Гарниры', 'Завтрак': 'Завтраки', 'Десерт': 'Десерты', 'Напиток': 'Напитки' };
    document.getElementById('page-title').innerText = titles[cat] || cat;

    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = filtered.map(r => `
        <div class="card" onclick="openRecipe(${r.id})">
            <img src="${r.image_url || 'https://via.placeholder.com/150?text=Food'}" class="card-img" onerror="this.src='https://via.placeholder.com/150?text=Food'">
            <div style="padding:10px; font-weight:bold; font-size:13px;">${r.name}</div>
        </div>
    `).join('');
}

function showCategories() {
    document.getElementById('main-categories').style.display = 'grid';
    document.getElementById('recipe-grid').style.display = 'none';
    document.getElementById('search-bar').style.display = 'none';
    document.getElementById('page-title').innerText = 'Project Food';
}

async function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const { data: invData } = await _supabase.from('inventory').select('*');
    const ingredientList = r.ings ? r.ings.split(',').map(i => i.trim()) : [];
    
    const stockHTML = ingredientList.map(ing => {
        const has = invData.some(i => ing.toLowerCase().includes(i.name.toLowerCase()));
        return `<li style="color:${has ? '#2ecc71' : '#e74c3c'}; margin-bottom:5px;">${has ? '✅' : '❌'} ${ing}</li>`;
    }).join('');

    document.getElementById('modal-body').innerHTML = `
        <img src="${r.image_url || 'https://via.placeholder.com/400x200?text=' + r.name}" style="width:100%; border-radius:15px; height:180px; object-fit:cover;">
        <h2 style="margin:15px 0 10px 0;">${r.name}</h2>
        <div class="stock-check" style="background:#f8f9fa; padding:15px; border-radius:12px;">
            <h4 style="margin:0 0 10px 0;">Проверка склада:</h4>
            <ul style="padding:0; list-style:none; margin:0;">${stockHTML}</ul>
        </div>
        <button class="btn-main" style="margin-top:15px;" onclick="addMissingToCart(${r.id})">🛒 Добавить недостающее в корзину</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

// --- КАЛЕНДАРЬ ---
async function renderCalendar() {
    const { data: plan } = await _supabase.from('meal_plan').select('*, recipes(name)');
    const cont = document.getElementById('weekly-planner');
    cont.innerHTML = days.map(day => {
        const dPlan = plan ? plan.filter(p => p.day_name === day) : [];
        return `
            <div class="calendar-day" style="background:white; padding:15px; border-radius:15px; margin-bottom:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                <strong style="color:var(--primary); font-size:18px;">${day}</strong>
                <div style="margin-top:10px; font-size:14px;">
                    <div>🌅 Завтрак: <b>${getMeal(dPlan, 'Завтрак')}</b></div>
                    <div style="margin:5px 0;">🥣 Обед: <b>${getMeal(dPlan, 'Суп')}</b></div>
                    <div>🌙 Ужин: <b>${getMeal(dPlan, 'Второе блюдо')}</b></div>
                </div>
            </div>
        `;
    }).join('');
}
function getMeal(plan, type) {
    const m = plan.find(p => p.meal_type === type);
    return m ? m.recipes.name : '<span style="color:#ccc">Не запланировано</span>';
}

// --- СКЛАД И ПРОДУКТЫ ---
async function renderInventory() {
    const { data } = await _supabase.from('inventory').select('*').order('name');
    document.getElementById('inventory-list').innerHTML = data.map(i => `
        <div class="inventory-card" style="background:white; padding:12px; border-radius:12px; margin-bottom:8px; display:flex; justify-content:space-between;">
            <span><strong>${i.name}</strong></span>
            <span style="color:var(--primary)">${i.amount} ${i.unit}</span>
        </div>
    `).join('');
}

async function renderProducts(search = '') {
    let query = _supabase.from('products').select('*').order('name');
    if (search) query = query.ilike('name', `%${search}%`);
    const { data } = await query;
    const cont = document.getElementById('products-list');
    cont.innerHTML = data.map(p => `
        <div class="product-item" style="display:flex; justify-content:space-between; background:white; padding:10px; margin-bottom:5px; border-radius:8px;">
            <span>${p.name}</span>
            <div style="display:flex; align-items:center; gap:5px;">
                <input type="number" value="${p.price_per_kg}" onchange="updatePrice(${p.id}, this.value)" style="width:60px; border:1px solid #eee; border-radius:5px; padding:3px;">
                <small>₽/кг</small>
            </div>
        </div>
    `).join('');
}

async function updatePrice(id, val) {
    await _supabase.from('products').update({ price_per_kg: val }).eq('id', id);
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }

init();
