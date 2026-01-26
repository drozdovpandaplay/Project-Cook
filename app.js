const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];

async function init() {
    const { data } = await _supabase.from('recipes').select('*').order('name');
    allRecipes = data || [];
}

// Переключение разделов
function switchSection(name, el) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    
    document.getElementById(name + '-section').style.display = 'block';
    if (name === 'menu') showCategories();
    if (name === 'products') renderProducts();
    if (name === 'inventory') renderInventory();
}

// Отрисовка БАЗЫ ПРОДУКТОВ (твои 70 позиций)
async function renderProducts(search = '') {
    let query = _supabase.from('products').select('id, name, kcal, price').order('name');
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    const cont = document.getElementById('products-list');
    
    if (error) { cont.innerHTML = "Ошибка загрузки"; return; }

    cont.innerHTML = data.map(p => `
        <div class="product-item">
            <div style="flex: 1;">
                <div style="font-weight: bold;">${p.name}</div>
                <div style="font-size: 11px; color: #888;">${p.kcal || 0} ккал</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" value="${p.price || 0}" 
                    onchange="updateProductField(${p.id}, 'price', this.value)" 
                    style="width: 65px; border: 1px solid #eee; border-radius: 6px; padding: 4px; text-align: center;">
                <span style="font-weight: bold; color: var(--primary);">₽</span>
            </div>
        </div>
    `).join('');
}

async function updateProductField(id, field, val) {
    const obj = {}; obj[field] = parseFloat(val);
    await _supabase.from('products').update(obj).eq('id', id);
}

// Работа с категориями рецептов
function filterByCategory(cat) {
    const filtered = allRecipes.filter(r => r.category === cat);
    document.getElementById('main-categories').style.display = 'none';
    document.getElementById('recipe-grid').style.display = 'grid';
    document.getElementById('search-bar').style.display = 'flex';
    document.getElementById('page-title').innerText = cat;

    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = filtered.map(r => `
        <div class="card" onclick="openRecipe(${r.id})">
            <img src="${r.image_url || 'https://via.placeholder.com/150?text=Project+Food'}" 
                 class="card-img" 
                 onerror="this.src='https://via.placeholder.com/150?text=Project+Food'">
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
