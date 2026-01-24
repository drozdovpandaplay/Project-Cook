const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let timerInterval;

function switchTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    if (type === 'recipes') {
        document.getElementById('recipe-list').style.display = 'block';
        document.getElementById('cart-list').style.display = 'none';
        loadRecipes();
    } else {
        document.getElementById('recipe-list').style.display = 'none';
        document.getElementById('cart-list').style.display = 'block';
        loadCart();
    }
}

async function loadRecipes() {
    const container = document.getElementById('recipe-list');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка меню...</p>';
    const { data, error } = await _supabase.from('recipes').select('*').order('created_at', { ascending: false });
    if (error) return container.innerHTML = 'Ошибка загрузки';

    container.innerHTML = data.map(r => `
        <div class="card" onclick='openRecipe(${JSON.stringify(r)})' style="padding:0; overflow:hidden;">
            ${r.image_url ? `<img src="${r.image_url}" style="width:100%; height:160px; object-fit:cover;">` : `<div style="width:100%; height:160px; background:#f1f2f6; display:flex; align-items:center; justify-content:center; color:#ccc;">Без фото</div>`}
            <div style="padding:15px;">
                <h3 style="margin:0 0- 10px 0;">${r.name}</h3>
                <div style="font-size:13px; color:#636e72; display:grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                    <span>🔥 ${r.kcal || 0} ккал</span>
                    <span>⚖️ ${r.weight || 0} г</span>
                    <b style="color:#46b8bc; grid-column: span 2;">💰 ${r.price || 0} ₽</b>
                </div>
            </div>
        </div>
    `).join('');
}

function openRecipe(r) {
    const modalBody = document.getElementById('modal-body');
    const stepsHtml = r.steps ? r.steps.split(';').map(s => `<li>${s.trim()}</li>`).join('') : 'Инструкция отсутствует';

    modalBody.innerHTML = `
        ${r.image_url ? `<img src="${r.image_url}" style="width:100%; height:200px; object-fit:cover; border-radius:15px; margin-bottom:15px;">` : ''}
        <h2 style="color:#46b8bc; margin-bottom:10px;">${r.name}</h2>
        <p style="background:#f1f2f6; padding:12px; border-radius:12px; font-size:14px; color:#2d3436;">${r.ings}</p>
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold;">
            <span>Цена: ${r.price || 0} ₽</span> <span>⚡ ${r.kcal || 0} ккал</span>
        </div>
        <p><b>Приготовление:</b></p>
        <ol style="padding-left:20px; font-size:14px; line-height:1.6;">${stepsHtml}</ol>
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="action-btn" style="flex:2;" onclick="addToCart('${r.ings.replace(/'/g, "\\'")}', '${r.name.replace(/'/g, "\\'")}', ${r.price || 0})">🛒 В корзину</button>
            <button class="action-btn" style="flex:1; background:#f39c12;" onclick="startRecipeTimer('${r.name.replace(/'/g, "\\'")}')">⏲️ Таймер</button>
        </div>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

async function saveRecipe() {
    const name = document.getElementById('new-name').value;
    const imageFile = document.getElementById('new-image').files[0];
    const ingsRaw = document.getElementById('new-ings').value;
    const steps = document.getElementById('new-steps').value;
    let kcal = parseInt(document.getElementById('new-kcal').value) || 0;
    let weight = parseInt(document.getElementById('new-weight').value) || 0;
    let price = parseInt(document.getElementById('new-price').value) || 0;
    let image_url = null;

    if (!name || !ingsRaw) return alert('Укажите название и состав!');

    // Загрузка фото в Storage
    if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const { data: upData, error: upErr } = await _supabase.storage.from('recipe-images').upload(fileName, imageFile);
        if (!upErr) {
            const { data: urlData } = _supabase.storage.from('recipe-images').getPublicUrl(fileName);
            image_url = urlData.publicUrl;
        }
    }

    // Авторасчет из базы продуктов
    const ingNames = ingsRaw.split(',').map(i => i.trim());
    const { data: products } = await _supabase.from('products').select('*').in('name', ingNames);
    if (products?.length > 0) {
        let ap = 0, ak = 0;
        products.forEach(p => { ap += p.price || 0; ak += p.kcal || 0; });
        if (price === 0) price = ap;
        if (kcal === 0) kcal = ak;
    }

    const { error } = await _supabase.from('recipes').insert([{ name, kcal, weight, price, ings: ingsRaw, steps, image_url }]);
    if (!error) { alert('Успешно!'); toggleAddForm(); loadRecipes(); }
}

async function addToCart(ings, dishName, totalPrice) {
    const ingList = ings.split(',').map(i => i.trim());
    const ppi = Math.round((totalPrice || ingList.length * 50) / ingList.length);
    const items = ingList.map(i => ({ item_name: i, dish_name: dishName, price: ppi }));
    const { error } = await _supabase.from('cart').insert(items);
    if (!error) { alert('Добавлено в покупки!'); closeModal(); }
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    const { data, error } = await _supabase.from('cart').select('*');
    if (error || !data?.length) return container.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Корзина пуста</p>';
    const total = data.reduce((s, i) => s + (i.price || 0), 0);

    container.innerHTML = `
        <div style="padding:15px;">
            <div style="background:#46b8bc; color:white; padding:20px; border-radius:15px; margin-bottom:15px; text-align:center;">
                <h2 style="margin:0;">Сумма: ${total} ₽</h2>
            </div>
            ${data.map(item => `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin-bottom:10px;">
                    <div><b>${item.item_name}</b><br><small style="color:#999;">${item.dish_name}</small></div>
                    <button onclick="deleteCartItem(${item.id})" style="background:none; border:none; color:#ff7675; font-size:20px; cursor:pointer;">✕</button>
                </div>
            `).join('')}
            <button onclick="clearCart()" style="width:100%; border:none; background:none; color:#ff7675; padding:15px; cursor:pointer; font-weight:bold;">Очистить весь список</button>
        </div>
    `;
}

function startRecipeTimer(dishName) {
    const min = prompt(`Минут для "${dishName}":`, "10");
    if (!min || isNaN(min)) return;
    let sec = parseInt(min) * 60;
    document.getElementById('active-timer-display').style.display = 'flex';
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const m = Math.floor(sec / 60), s = sec % 60;
        document.getElementById('timer-countdown').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (sec-- <= 0) { clearInterval(timerInterval); alert('Время вышло!'); stopVisualTimer(); }
    }, 1000);
}

function stopVisualTimer() { clearInterval(timerInterval); document.getElementById('active-timer-display').style.display = 'none'; }
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function toggleAddForm() { 
    const m = document.getElementById('add-form-modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
}
async function deleteCartItem(id) { await _supabase.from('cart').delete().eq('id', id); loadCart(); }
async function clearCart() { if(confirm('Очистить корзину?')) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }

document.addEventListener('DOMContentLoaded', loadRecipes);
