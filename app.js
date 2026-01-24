const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let timerInterval;

// Переключение вкладок
function switchTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    
    document.getElementById('recipe-list').style.display = 'none';
    document.getElementById('stock-list').style.display = 'none';
    document.getElementById('cart-list').style.display = 'none';
    
    const addBtn = document.getElementById('main-add-btn');
    
    if (type === 'recipes') {
        document.getElementById('recipe-list').style.display = 'block';
        addBtn.onclick = toggleAddForm;
        addBtn.style.display = 'flex';
        loadRecipes();
    } else if (type === 'stock') {
        document.getElementById('stock-list').style.display = 'block';
        addBtn.onclick = toggleProductForm;
        addBtn.style.display = 'flex';
        loadStock();
    } else if (type === 'cart') {
        document.getElementById('cart-list').style.display = 'block';
        addBtn.style.display = 'none';
        loadCart();
    }
}

// --- СКЛАД (ПРОДУКТЫ) ---
async function loadStock() {
    const container = document.getElementById('stock-list');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка склада...</p>';
    
    const { data, error } = await _supabase.from('products').select('*').order('category');
    if (error) return;

    const categories = [...new Set(data.map(i => i.category || 'Прочее'))];
    container.innerHTML = categories.map(cat => `
        <div style="margin: 15px;">
            <h4 style="color:#46b8bc; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">${cat}</h4>
            ${data.filter(i => (i.category || 'Прочее') === cat).map(p => `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin-bottom:8px; background:white;">
                    <div>
                        <div style="font-weight:bold;">${p.name}</div>
                        <div style="font-size:11px; color:#999;">${p.kcal} ккал/100г</div>
                    </div>
                    <div style="color:#2ecc71; font-weight:bold;">${p.price} ₽</div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// --- РЕЦЕПТЫ (МЕНЮ) ---
async function loadRecipes() {
    const container = document.getElementById('recipe-list');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка меню...</p>';
    const { data } = await _supabase.from('recipes').select('*');
    
    container.innerHTML = data.map(r => `
        <div class="card" onclick='openRecipe(${JSON.stringify(r)})' style="padding:0; overflow:hidden; margin:15px; background:white; border-radius:15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            ${r.image_url ? `<img src="${r.image_url}" style="width:100%; height:160px; object-fit:cover;">` : `<div style="height:160px; background:#f1f2f6; display:flex; align-items:center; justify-content:center; color:#ccc;">Нет фото</div>`}
            <div style="padding:15px;">
                <h3 style="margin:0 0 8px 0;">${r.name}</h3>
                <div style="font-size:13px; color:#636e72;">📊 ${r.kcal || 0} ккал | <span style="color:#46b8bc;">Состав: ${r.ings.split(',').length} инг.</span></div>
            </div>
        </div>
    `).join('');
}

// УМНОЕ ОТКРЫТИЕ РЕЦЕПТА С РАСЧЕТОМ ЦЕНЫ
async function openRecipe(r) {
    const modalBody = document.getElementById('modal-body');
    document.getElementById('recipe-modal').style.display = 'block';
    modalBody.innerHTML = '<p>Считаем стоимость...</p>';

    // Чистим список ингредиентов
    const ingredientsList = r.ings.split(',').map(i => i.trim().toLowerCase());

    // Тянем цены из базы продуктов
    const { data: products } = await _supabase
        .from('products')
        .select('name, price')
        .in('name', ingredientsList);

    let calculatedTotal = 0;
    const ingredientsHtml = ingredientsList.map(ingName => {
        const product = products.find(p => p.name.toLowerCase() === ingName);
        const price = product ? product.price : 0;
        calculatedTotal += price;
        
        return `
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f9f9f9;">
                <span style="text-transform: capitalize;">${ingName}</span>
                <span style="font-weight:bold; color:${price > 0 ? '#2d3436' : '#fab1a0'};">
                    ${price > 0 ? price + ' ₽' : '?' }
                </span>
            </div>
        `;
    }).join('');

    modalBody.innerHTML = `
        ${r.image_url ? `<img src="${r.image_url}" style="width:100%; border-radius:12px; margin-bottom:15px;">` : ''}
        <h2 style="margin-bottom:5px;">${r.name}</h2>
        <div style="color:#636e72; margin-bottom:20px;">🔥 ${r.kcal} ккал на блюдо</div>
        
        <div style="background:#f8f9fa; padding:15px; border-radius:12px; margin-bottom:20px;">
            <h4 style="margin-top:0; color:#46b8bc;">Ингредиенты (цена со склада):</h4>
            ${ingredientsHtml}
            <div style="display:flex; justify-content:space-between; margin-top:15px; padding-top:10px; border-top:2px dashed #ddd; font-weight:bold; font-size:18px;">
                <span>Итого:</span>
                <span style="color:#2ecc71;">~${calculatedTotal} ₽</span>
            </div>
        </div>
        
        <button class="action-btn" onclick="addToCart('${r.ings}', '${r.name}', ${calculatedTotal})">🛒 Добавить в покупки</button>
    `;
}

// --- СОХРАНЕНИЕ ДАННЫХ ---
async function saveProduct() {
    const name = document.getElementById('prod-name').value.toLowerCase();
    const category = document.getElementById('prod-cat').value;
    const kcal = parseInt(document.getElementById('prod-kcal').value) || 0;
    const price = parseInt(document.getElementById('prod-price').value) || 0;

    if (!name) return alert('Введите название!');
    const { error } = await _supabase.from('products').insert([{ name, category, kcal, price }]);
    if (!error) { toggleProductForm(); loadStock(); }
}

async function saveRecipe() {
    const name = document.getElementById('new-name').value;
    const ings = document.getElementById('new-ings').value.toLowerCase();
    const kcal = parseInt(document.getElementById('new-kcal').value) || 0;
    
    const { error } = await _supabase.from('recipes').insert([{ name, ings, kcal }]);
    if (!error) { toggleAddForm(); loadRecipes(); }
}

// --- КОРЗИНА ---
async function addToCart(ings, dish, price) {
    const list = ings.split(',').map(i => ({ 
        item_name: i.trim(), 
        dish_name: dish 
    }));
    const { error } = await _supabase.from('cart').insert(list);
    if (!error) { alert('Ингредиенты добавлены в корзину!'); closeModal(); }
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    const { data } = await _supabase.from('cart').select('*');
    if (!data) return;

    container.innerHTML = `
        <div style="padding:15px;">
            <h3 style="margin-bottom:15px;">Список покупок</h3>
            ${data.map(i => `
                <div class="card" style="padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:bold;">${i.item_name}</div>
                        <div style="font-size:11px; color:#999;">для: ${i.dish_name}</div>
                    </div>
                    <button onclick="deleteCartItem(${i.id})" style="color:#ff7675; background:none; border:none; font-size:20px; cursor:pointer;">✕</button>
                </div>
            `).join('')}
        </div>
    `;
}

async function deleteCartItem(id) { 
    await _supabase.from('cart').delete().eq('id', id); 
    loadCart(); 
}

// Вспомогательные функции
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function toggleAddForm() { 
    const m = document.getElementById('add-form-modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
}
function toggleProductForm() {
    const m = document.getElementById('add-product-modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', () => loadRecipes());
