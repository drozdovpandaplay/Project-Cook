const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

async function init() {
    const { data } = await _supabase.from('recipes').select('*').order('name');
    allRecipes = data || [];
}

function switchSection(name, el) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.getElementById(name + '-section').style.display = 'block';

    if (name === 'menu') showCategories();
    if (name === 'calendar') renderCalendar();
    if (name === 'products') renderProducts();
    if (name === 'inventory') renderInventory();
}

// РАБОТА С ПРОДУКТАМИ (70+ ПОЗИЦИЙ)
async function renderProducts(search = '') {
    let query = _supabase.from('products').select('id, name, kcal, price').order('name');
    if (search) query = query.ilike('name', `%${search}%`);
    const { data } = await query;
    const cont = document.getElementById('products-list');
    cont.innerHTML = data.map(p => `
        <div class="product-item">
            <div style="flex:1"><b>${p.name}</b><br><small>${p.kcal || 0} ккал</small></div>
            <div>
                <input type="number" value="${p.price || 0}" onchange="updateProd(${p.id}, 'price', this.value)" style="width:60px; padding:4px;">
                <small>₽</small>
            </div>
        </div>
    `).join('');
}

async function updateProd(id, field, val) {
    const obj = {}; obj[field] = parseFloat(val);
    await _supabase.from('products').update(obj).eq('id', id);
}

// МОДАЛКА И ИНТЕРАКТИВНЫЙ РЕЦЕПТ
async function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const body = document.getElementById('modal-body');
    const { data: invData } = await _supabase.from('inventory').select('*');
    
    const ings = r.ings ? r.ings.split(',').map(i => i.trim()) : [];
    const stockHTML = ings.map(ing => {
        const has = invData.some(i => ing.toLowerCase().includes(i.name.toLowerCase()));
        return `<li style="color:${has ? '#2ecc71' : '#e74c3c'}; margin-bottom:5px;">${has ? '✅' : '❌'} ${ing}</li>`;
    }).join('');

    body.innerHTML = `
        <img src="${r.image_url || ''}" class="card-img" style="height:150px; border-radius:15px;" onerror="this.src='https://via.placeholder.com/150?text=Food'">
        <h2>${r.name}</h2>
        <div class="tabs">
            <button onclick="showTab('ings-tab', this)" class="btn-tab active-tab">Состав</button>
            <button onclick="showTab('desc-tab', this)" class="btn-tab">Готовка</button>
            <button onclick="showTab('edit-tab', this)" class="btn-tab">Ред.</button>
        </div>
        <div id="ings-tab" class="recipe-tab"><ul>${stockHTML}</ul></div>
        <div id="desc-tab" class="recipe-tab" style="display:none;">${renderSteps(r.instructions)}</div>
        <div id="edit-tab" class="recipe-tab" style="display:none;">
            <textarea id="edit-text" class="edit-input" style="height:150px">${r.instructions || ''}</textarea>
            <button class="btn-main" style="margin-top:10px" onclick="saveDesc(${r.id})">Сохранить</button>
        </div>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function renderSteps(text) {
    if(!text) return '<p>Описания нет</p>';
    return text.split('\n').map((s, i) => `
        <div class="step-item"><input type="checkbox" id="s${i}"><label for="s${i}">${s}</label></div>
    `).join('');
}

async function saveDesc(id) {
    const txt = document.getElementById('edit-text').value;
    await _supabase.from('recipes').update({ instructions: txt }).eq('id', id);
    const idx = allRecipes.findIndex(r => r.id === id);
    allRecipes[idx].instructions = txt;
    alert("Сохранено!");
}

function showTab(id, btn) {
    document.querySelectorAll('.recipe-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active-tab'));
    document.getElementById(id).style.display = 'block';
    btn.classList.add('active-tab');
}

function filterByCategory(cat) {
    const filtered = allRecipes.filter(r => r.category === cat);
    document.getElementById('main-categories').style.display = 'none';
    document.getElementById('recipe-grid').style.display = 'grid';
    document.getElementById('search-bar').style.display = 'flex';
    document.getElementById('page-title').innerText = cat;
    document.getElementById('recipe-grid').innerHTML = filtered.map(r => `
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

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
init();
