const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];

async function init() {
    const { data } = await _supabase.from('recipes').select('*').order('name');
    allRecipes = data || [];
}

function filterByCategory(cat) {
    const filtered = allRecipes.filter(r => r.category === cat);
    document.getElementById('main-categories').style.display = 'none';
    document.getElementById('recipe-grid').style.display = 'grid';
    document.getElementById('search-bar').style.display = 'flex';
    
    // Красивый заголовок
    let titles = { 'Суп': 'Супы', 'Второе блюдо': 'Вторые блюда', 'Салат': 'Салаты', 'Гарнир': 'Гарниры', 'Завтрак': 'Завтраки', 'Десерт': 'Десерты', 'Напиток': 'Напитки' };
    document.getElementById('page-title').innerText = titles[cat] || cat;

    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = filtered.map(r => `
        <div class="card" onclick="openRecipe(${r.id})">
            <img src="${r.image_url || 'https://via.placeholder.com/150'}" class="card-img" onerror="this.src='https://via.placeholder.com/150'">
            <div style="padding:10px; font-size:13px; font-weight:bold;">${r.name}</div>
        </div>
    `).join('');
}

function showCategories() {
    document.getElementById('main-categories').style.display = 'grid';
    document.getElementById('recipe-grid').style.display = 'none';
    document.getElementById('search-bar').style.display = 'none';
    document.getElementById('page-title').innerText = 'Project Food';
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
    }
}

function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const body = document.getElementById('modal-body');
    body.innerHTML = `
        <h3>${r.name}</h3>
        <p><strong>Ингредиенты:</strong><br>${r.ings || 'Не указаны'}</p>
        <button onclick="closeModal()" style="width:100%; padding:10px; margin-top:10px; border:none; border-radius:10px; background:var(--primary); color:white;">Понятно</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }

init();
