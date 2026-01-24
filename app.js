const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = []; // Будем хранить тут для быстрого поиска

// --- НАВИГАЦИЯ ---
function switchTab(type) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    
    // Скрываем все секции
    document.getElementById('recipe-list-section').style.display = 'none';
    document.getElementById('stock-list-section').style.display = 'none';
    document.getElementById('cart-list-section').style.display = 'none';
    
    if (type === 'recipes') {
        document.getElementById('recipe-list-section').style.display = 'block';
        loadRecipes();
    } else if (type === 'stock') {
        document.getElementById('stock-list-section').style.display = 'block';
        loadStock();
    } else if (type === 'cart') {
        document.getElementById('cart-list-section').style.display = 'block';
        loadCart();
    }
}

// --- УМНЫЙ ПОИСК ---
function search(query) {
    const q = query.toLowerCase();
    const filtered = allRecipes.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.ings.toLowerCase().includes(q)
    );
    renderRecipes(filtered);
}

// --- РЕЦЕПТЫ ---
async function loadRecipes() {
    const { data } = await _supabase.from('recipes').select('*');
    allRecipes = data || [];
    renderRecipes(allRecipes);
}

function renderRecipes(list) {
    const container = document.getElementById('recipe-list');
    container.innerHTML = list.map(r => `
        <div class="card" onclick='openRecipe(${JSON.stringify(r)})'>
            <div class="card-img" style="background: linear-gradient(45deg, #e1e8ed, #f7f9fb); display:flex; align-items:center; justify-content:center; color:#adb5bd;">
                ${r.name.charAt(0)}
            </div>
            <div class="card-content">
                <div class="card-title">${r.name}</div>
                <div class="card-price">${r.kcal || 0} ккал</div>
            </div>
        </div>
    `).join('');
}

// --- МОДАЛЬНОЕ ОКНО С РАСЧЕТОМ ---
async function openRecipe(r) {
    const modal = document.getElementById('recipe-modal');
    const modalBody = document.getElementById('modal-body');
    modal.style.display = 'block';
    modalBody.innerHTML = '<p style="text-align:center;">Загружаем цены со склада...</p>';

    const ingredientsList = r.ings.split(',').map(i => i.trim().toLowerCase());
    const { data: products } = await _supabase.from('products').select('name, price').in('name', ingredientsList);

    let total = 0;
    const ingsHtml = ingredientsList.map(ing => {
        const p = products?.find(prod => prod.name.toLowerCase() === ing);
        const price = p ? p.price : 0;
        total += price;
        return `
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f1f2f6;">
                <span style="text-transform:capitalize;">${ing}</span>
                <span style="font-weight:600;">${price > 0 ? price + ' ₽' : '<span style="color:#ff7675;">?</span>'}</span>
            </div>
        `;
    }).join('');

    modalBody.innerHTML = `
        <h2 style="margin-top:0;">${r.name}</h2>
        <p style="color:#636e72; font-size:14px;">Состав блюда и цены:</p>
        <div style="margin: 20px 0;">${ingsHtml}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f7f9fb; padding:15px; border-radius:15px;">
            <span style="font-weight:600;">Итоговая стоимость:</span>
            <span style="font-size:20px; font-weight:bold; color:var(--primary);">${total} ₽</span>
        </div>
        <button onclick="addToCart('${r.ings}', '${r.name}')" style="width:100%; padding:15px; margin-top:20px; background:var(--primary); color:white; border:none; border-radius:15px; font-weight:600; font-size:16px;">
            🛒 В корзину покупок
        </button>
    `;
}

// --- СКЛАД ---
async function loadStock() {
    const container = document.getElementById('stock-list');
    const { data } = await _supabase.from('products').select('*').order('category');
    
    const categories = [...new Set(data.map(i => i.category || 'Прочее'))];
    container.innerHTML = categories.map(cat => `
        <div style="padding: 0 20px;">
            <h4 style="color:var(--primary); margin: 20px 0 10px;">${cat}</h4>
            ${data.filter(i => (i.category || 'Прочее') === cat).map(p => `
                <div class="card" style="display:flex; justify-content:space-between; padding:15px; margin-bottom:10px; grid-template-columns: none; width:auto;">
                    <span style="font-weight:600;">${p.name}</span>
                    <span style="color:var(--primary); font-weight:bold;">${p.price} ₽</span>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// Вспомогательные
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', () => loadRecipes());
