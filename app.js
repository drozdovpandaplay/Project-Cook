const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];

async function init() {
    const { data } = await _supabase.from('recipes').select('*').order('name');
    allRecipes = data || [];
}

function switchSection(name, el) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    if (name === 'menu') showCategories();
    else {
        document.getElementById(name + '-section').style.display = 'block';
        if (name === 'inventory') renderInventory();
        if (name === 'shopping') renderShopping();
    }
}

async function renderInventory() {
    const { data } = await _supabase.from('inventory').select('*').order('name');
    document.getElementById('inventory-list').innerHTML = data.map(i => `
        <div class="inventory-card">
            <span><strong>${i.name}</strong> (${i.amount} ${i.unit})</span>
            <button onclick="deleteInvItem(${i.id})" style="border:none;background:none;">🗑️</button>
        </div>
    `).join('');
}

async function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const { data: invData } = await _supabase.from('inventory').select('*');
    const ingredientList = r.ings ? r.ings.split(',').map(i => i.trim()) : [];
    
    // Проверка склада
    const stockHTML = ingredientList.map(ing => {
        const has = invData.some(i => ing.toLowerCase().includes(i.name.toLowerCase()));
        return `<li style="color:${has ? 'green' : 'red'}">${has ? '✅' : '❌'} ${ing}</li>`;
    }).join('');

    document.getElementById('modal-body').innerHTML = `
        <img src="${r.image_url || ''}" style="width:100%; border-radius:15px;">
        <h2>${r.name}</h2>
        <div class="stock-check">
            <h4>Проверка склада:</h4>
            <ul style="padding:0; list-style:none;">${stockHTML}</ul>
        </div>
        <button class="btn-main" onclick="addToCart('${r.ings}')">🛒 В корзину недостающее</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function filterByCategory(cat) {
    const filtered = allRecipes.filter(r => r.category === cat);
    document.getElementById('main-categories').style.display = 'none';
    document.getElementById('recipe-grid').style.display = 'grid';
    document.getElementById('search-bar').style.display = 'flex';
    document.getElementById('page-title').innerText = cat;
    
    document.getElementById('recipe-grid').innerHTML = filtered.map(r => `
        <div class="card" onclick="openRecipe(${r.id})">
            <img src="${r.image_url || 'https://via.placeholder.com/150'}" class="card-img">
            <div style="padding:10px; font-weight:bold; font-size:14px;">${r.name}</div>
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
