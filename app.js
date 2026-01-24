const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let timerInterval;

function switchTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    
    document.getElementById('recipe-list').style.display = 'none';
    document.getElementById('stock-list').style.display = 'none';
    document.getElementById('cart-list').style.display = 'none';
    
    // Меняем функцию кнопки "+" в шапке в зависимости от вкладки
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

// РАБОТА СО СКЛАДОМ
async function loadStock() {
    const container = document.getElementById('stock-list');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка склада...</p>';
    const { data, error } = await _supabase.from('products').select('*').order('category');
    if (error) return;

    const categories = [...new Set(data.map(i => i.category || 'Прочее'))];
    container.innerHTML = categories.map(cat => `
        <div style="margin: 15px;">
            <h4 style="color:#46b8bc; margin-bottom:10px; border-bottom:1px solid #eee;">${cat}</h4>
            ${data.filter(i => (i.category || 'Прочее') === cat).map(p => `
                <div class="card" style="display:flex; justify-content:space-between; padding:12px; margin-bottom:8px; background:white;">
                    <span>${p.name}</span>
                    <span style="font-size:12px; color:#999;">${p.price}₽ | ${p.kcal}ккал</span>
                </div>
            `).join('')}
        </div>
    `).join('');
}

async function saveProduct() {
    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-cat').value;
    const kcal = parseInt(document.getElementById('prod-kcal').value) || 0;
    const price = parseInt(document.getElementById('prod-price').value) || 0;

    if (!name) return alert('Введите название!');
    const { error } = await _supabase.from('products').insert([{ name, category, kcal, price }]);
    if (!error) { toggleProductForm(); loadStock(); }
}

function toggleProductForm() {
    const m = document.getElementById('add-product-modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

// --- ОСТАЛЬНЫЕ ФУНКЦИИ (Recipes & Cart) ---
async function loadRecipes() {
    const container = document.getElementById('recipe-list');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка...</p>';
    const { data } = await _supabase.from('recipes').select('*');
    container.innerHTML = data.map(r => `
        <div class="card" onclick='openRecipe(${JSON.stringify(r)})' style="padding:0; overflow:hidden; margin:15px; background:white; border-radius:15px;">
            ${r.image_url ? `<img src="${r.image_url}" style="width:100%; height:160px; object-fit:cover;">` : `<div style="height:160px; background:#f1f2f6;"></div>`}
            <div style="padding:15px;">
                <h3 style="margin:0 0 8px 0;">${r.name}</h3>
                <div style="font-size:13px; color:#636e72;">💰 ${r.price || 0} ₽ | 🔥 ${r.kcal || 0} ккал</div>
            </div>
        </div>
    `).join('');
}

function openRecipe(r) {
    document.getElementById('modal-body').innerHTML = `
        ${r.image_url ? `<img src="${r.image_url}" style="width:100%; height:200px; object-fit:cover; border-radius:15px; margin-bottom:15px;">` : ''}
        <h2>${r.name}</h2>
        <p style="background:#f1f2f6; padding:10px; border-radius:10px;">${r.ings}</p>
        <button class="action-btn" onclick="addToCart('${r.ings}', '${r.name}', ${r.price})">🛒 В корзину</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

async function saveRecipe() {
    const name = document.getElementById('new-name').value;
    const imageFile = document.getElementById('new-image').files[0];
    const ingsRaw = document.getElementById('new-ings').value;
    let image_url = null;

    if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const { data } = await _supabase.storage.from('recipe-images').upload(fileName, imageFile);
        if (data) image_url = _supabase.storage.from('recipe-images').getPublicUrl(fileName).data.publicUrl;
    }

    const { error } = await _supabase.from('recipes').insert([{ 
        name, ings: ingsRaw, 
        kcal: parseInt(document.getElementById('new-kcal').value) || 0,
        price: parseInt(document.getElementById('new-price').value) || 0,
        image_url 
    }]);
    if (!error) { toggleAddForm(); loadRecipes(); }
}

async function addToCart(ings, dish, price) {
    const list = ings.split(',').map(i => ({ item_name: i.trim(), dish_name: dish, price: Math.round(price/ings.split(',').length) }));
    await _supabase.from('cart').insert(list);
    alert('В корзине!'); closeModal();
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    const { data } = await _supabase.from('cart').select('*');
    container.innerHTML = `<div style="padding:15px;">${data.map(i => `<div class="card" style="padding:12px; margin-bottom:10px; display:flex; justify-content:space-between;"><span>${i.item_name}</span><button onclick="deleteCartItem(${i.id})" style="color:red; background:none; border:none;">✕</button></div>`).join('')}</div>`;
}

async function deleteCartItem(id) { await _supabase.from('cart').delete().eq('id', id); loadCart(); }
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function toggleAddForm() { 
    const m = document.getElementById('add-form-modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
}
function stopVisualTimer() { clearInterval(timerInterval); document.getElementById('active-timer-display').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', loadRecipes);
