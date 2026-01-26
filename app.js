const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];

async function loadData() {
    const { data } = await _supabase.from('recipes').select('*').order('name');
    allRecipes = data || [];
}

function switchSection(name, el) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    if (name === 'menu') {
        showCategories();
    } else {
        document.getElementById(name + '-section').style.display = 'block';
        document.getElementById('search-bar').style.display = 'none';
        if (name === 'inventory') renderInventory();
        if (name === 'shopping') renderShopping();
    }
}

function filterByCategory(cat) {
    const filtered = allRecipes.filter(r => r.category === cat);
    document.getElementById('main-categories').style.display = 'none';
    document.getElementById('recipe-grid').style.display = 'grid';
    document.getElementById('search-bar').style.display = 'flex';
    document.getElementById('page-title').innerText = cat + 'и';
    
    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = filtered.map(r => `
        <div class="card" onclick="openRecipe(${r.id})">
            <img src="${r.image_url || 'https://via.placeholder.com/150'}" class="card-img">
            <div class="padding"><small>${r.name}</small></div>
        </div>
    `).join('');
}

function showCategories() {
    document.getElementById('main-categories').style.display = 'grid';
    document.getElementById('recipe-grid').style.display = 'none';
    document.getElementById('search-bar').style.display = 'none';
    document.getElementById('page-title').innerText = 'Project Food';
}

async function renderShopping() {
    const { data } = await _supabase.from('shopping_list').select('*');
    const container = document.getElementById('shopping-list-container');
    container.innerHTML = data.map(i => `
        <div class="list-item ${i.checked ? 'checked' : ''}" onclick="toggleShop(${i.id}, ${i.checked})">
            <span>${i.name}</span>
            <span>${i.checked ? '✅' : '⬜'}</span>
        </div>
    `).join('');
}

async function toggleShop(id, current) {
    await _supabase.from('shopping_list').update({ checked: !current }).eq('id', id);
    renderShopping();
}

// Загрузка данных при старте
loadData();
