// Настройки подключения
const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// Загрузка данных при старте
async function init() {
    const { data, error } = await _supabase.from('recipes').select('*').order('name');
    if (error) console.error("Ошибка загрузки рецептов:", error);
    allRecipes = data || [];
    console.log("Приложение готово, рецептов загружено:", allRecipes.length);
}

// ПЕРЕКЛЮЧЕНИЕ РАЗДЕЛОВ
function switchSection(name, el) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    if (el) el.classList.add('active');
    document.getElementById(name + '-section').style.display = 'block';

    // Подгрузка данных в зависимости от раздела
    if (name === 'menu') showCategories();
    if (name === 'calendar') renderCalendar();
    if (name === 'products') renderProducts();
    if (name === 'inventory') renderInventory();
}

// 🍎 РАБОТА С БАЗОЙ ПРОДУКТОВ (твои 70+ позиций)
async function renderProducts(search = '') {
    let query = _supabase.from('products').select('id, name, price, kcal').order('name');
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    const cont = document.getElementById('products-list');
    
    if (error || !data) { cont.innerHTML = "Ошибка загрузки продуктов"; return; }

    cont.innerHTML = data.map(p => `
        <div class="product-item">
            <div style="flex:1">
                <strong>${p.name}</strong><br>
                <small style="color:#888">${p.kcal || 0} ккал / 100г</small>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <input type="number" value="${p.price || 0}" 
                    onchange="updateProdPrice(${p.id}, this.value)" 
                    style="width:65px; border:1px solid #eee; padding:5px; border-radius:8px; text-align:center;">
                <b>₽</b>
            </div>
        </div>
    `).join('');
}

async function updateProdPrice(id, val) {
    const { error } = await _supabase.from('products').update({ price: parseFloat(val) }).eq('id', id);
    if (error) alert("Ошибка сохранения!");
}

// 🍴 ФИЛЬТРАЦИЯ РЕЦЕПТОВ ПО КАТЕГОРИЯМ
function filterByCategory(cat) {
    const filtered = allRecipes.filter(r => r.category === cat);
    document.getElementById('main-categories').style.display = 'none';
    document.getElementById('recipe-grid').style.display = 'grid';
    document.getElementById('search-bar').style.display = 'flex';
    document.getElementById('page-title').innerText = cat;

    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = filtered.map(r => `
        <div class="card" onclick="openRecipe(${r.id})">
            <img src="${r.image_url || ''}" class="card-img" onerror="this.src='https://via.placeholder.com/150?text=Food'">
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

// 👨‍🍳 МОДАЛЬНОЕ ОКНО РЕЦЕПТА
async function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const body = document.getElementById('modal-body');
    
    const { data: invData } = await _supabase.from('inventory').select('*');
    const ings = r.ings ? r.ings.split(',').map(i => i.trim()) : [];
    
    const stockHTML = ings.map(ing => {
        const has = invData ? invData.some(i => ing.toLowerCase().includes(i.name.toLowerCase())) : false;
        return `<li style="color:${has ? '#2ecc71' : '#e74c3c'}; margin-bottom:5px;">${has ? '✅' : '❌'} ${ing}</li>`;
    }).join('');

    body.innerHTML = `
        <img src="${r.image_url || ''}" class="card-img" style="height:160px; border-radius:15px;" onerror="this.src='https://via.placeholder.com/150?text=${r.name}'">
        <h2 style="margin:15px 0 10px 0;">${r.name}</h2>
        <div class="tabs">
            <button onclick="showTab('ings-tab', this)" class="btn-tab active-tab">Состав</button>
            <button onclick="showTab('desc-tab', this)" class="btn-tab">Готовка</button>
            <button onclick="showTab('edit-tab', this)" class="btn-tab">Ред.</button>
        </div>
        <div id="ings-tab" class="recipe-tab">
            <ul style="padding:0; list-style:none;">${stockHTML || 'Нет данных'}</ul>
        </div>
        <div id="desc-tab" class="recipe-tab" style="display:none;">
            ${renderSteps(r.instructions)}
        </div>
        <div id="edit-tab" class="recipe-tab" style="display:none;">
            <textarea id="edit-text" class="edit-input" style="height:150px; width:100%;" placeholder="Шаги через Enter...">${r.instructions || ''}</textarea>
            <button class="btn-main" style="margin-top:10px" onclick="saveDesc(${r.id})">💾 Сохранить описание</button>
        </div>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function renderSteps(text) {
    if (!text) return '<p style="color:#999">Инструкции еще не добавлены...</p>';
    return text.split('\n').filter(s => s.trim()).map((s, i) => `
        <div class="step-item">
            <input type="checkbox" id="s${i}">
            <label for="s${i}">${s}</label>
        </div>
    `).join('');
}

async function saveDesc(id) {
    const txt = document.getElementById('edit-text').value;
    const { error } = await _supabase.from('recipes').update({ instructions: txt }).eq('id', id);
    if (!error) {
        const idx = allRecipes.findIndex(r => r.id === id);
        allRecipes[idx].instructions = txt;
        alert("Сохранено!");
        showTab('desc-tab', document.querySelectorAll('.btn-tab')[1]);
    }
}

function showTab(id, btn) {
    document.querySelectorAll('.recipe-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active-tab'));
    document.getElementById(id).style.display = 'block';
    if(btn) btn.classList.add('active-tab');
}

// 📦 СКЛАД
async function renderInventory() {
    const { data } = await _supabase.from('inventory').select('*').order('name');
    const cont = document.getElementById('inventory-list');
    cont.innerHTML = data.map(i => `
        <div class="product-item">
            <span><b>${i.name}</b></span>
            <span style="color:var(--primary)">${i.amount} ${i.unit}</span>
        </div>
    `).join('');
}

// 📅 КАЛЕНДАРЬ
async function renderCalendar() {
    const { data: plan } = await _supabase.from('meal_plan').select('*, recipes(name)');
    const cont = document.getElementById('weekly-planner');
    cont.innerHTML = days.map(day => {
        const dPlan = plan ? plan.filter(p => p.day_name === day) : [];
        return `
            <div class="product-item" style="display:block; margin-bottom:12px;">
                <div style="color:var(--primary); font-weight:bold; border-bottom:1px solid #eee; margin-bottom:5px;">${day}</div>
                <div style="font-size:13px;">🍳 Завтрак: ${getMeal(dPlan, 'Завтрак')}</div>
                <div style="font-size:13px;">🥣 Обед: ${getMeal(dPlan, 'Завтрак')}</div>
                <div style="font-size:13px;">🥩 Ужин: ${getMeal(dPlan, 'Завтрак')}</div>
            </div>
        `;
    }).join('');
}

function getMeal(plan, type) {
    const m = plan.find(p => p.meal_type === type);
    return m ? m.recipes.name : '<span style="color:#ccc">---</span>';
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }

// Запуск
init();
