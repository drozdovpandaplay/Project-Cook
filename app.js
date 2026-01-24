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
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка...</p>';
    const { data, error } = await _supabase.from('recipes').select('*');
    if (error) return container.innerHTML = 'Ошибка загрузки';

    container.innerHTML = data.map(r => `
        <div class="card" onclick='openRecipe(${JSON.stringify(r)})'>
            <h3 style="margin:0 0 10px 0;">${r.name}</h3>
            <div style="font-size:14px; color:#636e72; display:grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <span>🔥 ${r.kcal || 0} ккал</span>
                <span>⚖️ ${r.weight || 0} г</span>
                <b style="color:#46b8bc; grid-column: span 2;">💰 ${r.price || 0} ₽</b>
            </div>
        </div>
    `).join('');
}

function openRecipe(r) {
    const modalBody = document.getElementById('modal-body');
    const stepsHtml = r.steps ? r.steps.split(';').map(s => `<li>${s.trim()}</li>`).join('') : 'Шаги не указаны';

    modalBody.innerHTML = `
        <h2 style="color:#46b8bc; margin-bottom:10px;">${r.name}</h2>
        <p style="background:#f1f2f6; padding:10px; border-radius:10px; font-size:14px;">${r.ings}</p>
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold;">
            <span>${r.price || 0} ₽</span> <span>${r.kcal || 0} ккал</span>
        </div>
        <ol style="padding-left:20px; font-size:15px;">${stepsHtml}</ol>
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="action-btn" style="flex:2;" onclick="addToCart('${r.ings.replace(/'/g, "\\'")}', '${r.name.replace(/'/g, "\\'")}', ${r.price || 0})">🛒 В корзину</button>
            <button class="action-btn" style="flex:1; background:#f39c12;" onclick="startRecipeTimer('${r.name.replace(/'/g, "\\'")}')">⏲️ Таймер</button>
        </div>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

async function saveRecipe() {
    const name = document.getElementById('new-name').value;
    const ingsRaw = document.getElementById('new-ings').value;
    let kcal = parseInt(document.getElementById('new-kcal').value) || 0;
    let price = parseInt(document.getElementById('new-price').value) || 0;
    const weight = document.getElementById('new-weight').value;
    const steps = document.getElementById('new-steps').value;

    const ingNames = ingsRaw.split(',').map(i => i.trim());
    const { data: products } = await _supabase.from('products').select('*').in('name', ingNames);

    if (products && products.length > 0) {
        let autoP = 0, autoK = 0;
        products.forEach(p => { autoP += p.price || 0; autoK += p.kcal || 0; });
        if (price === 0) price = autoP;
        if (kcal === 0) kcal = autoK;
    }

    const { error } = await _supabase.from('recipes').insert([{ name, kcal, weight, price, ings: ingsRaw, steps }]);
    if (!error) { toggleAddForm(); loadRecipes(); }
}

async function addToCart(ings, dishName, totalPrice) {
    const ingList = ings.split(',').map(i => i.trim());
    const pricePerItem = Math.round((totalPrice || ingList.length * 50) / ingList.length);
    const items = ingList.map(i => ({ item_name: i, dish_name: dishName, price: pricePerItem }));
    await _supabase.from('cart').insert(items);
    alert('Добавлено!'); closeModal();
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    const { data, error } = await _supabase.from('cart').select('*');
    if (error || !data.length) return container.innerHTML = '<p style="text-align:center; padding:20px;">Корзина пуста</p>';
    const total = data.reduce((s, i) => s + (i.price || 0), 0);

    container.innerHTML = `
        <div style="padding:15px;">
            <div style="background:#46b8bc; color:white; padding:15px; border-radius:15px; margin-bottom:15px; text-align:center;">
                <h2 style="margin:0;">Итого: ${total} ₽</h2>
            </div>
            ${data.map(item => `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin:0 0 10px 0;">
                    <div><b>${item.item_name}</b><br><small style="color:#999;">${item.dish_name}</small></div>
                    <button onclick="deleteCartItem(${item.id})" style="background:none; border:none; color:#ff7675; font-size:20px;">✕</button>
                </div>
            `).join('')}
            <button onclick="clearCart()" style="width:100%; border:none; background:none; color:#ff7675; cursor:pointer; font-weight:bold;">Очистить всё</button>
        </div>
    `;
}

function startRecipeTimer(dishName) {
    const minutes = prompt(`Минут для "${dishName}":`, "10");
    if (!minutes || isNaN(minutes)) return;
    let timeLeft = parseInt(minutes) * 60;
    document.getElementById('active-timer-display').style.display = 'flex';
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        document.getElementById('timer-countdown').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (timeLeft-- <= 0) { clearInterval(timerInterval); alert('Готово!'); stopVisualTimer(); }
    }, 1000);
}

function stopVisualTimer() { 
    clearInterval(timerInterval); 
    document.getElementById('active-timer-display').style.display = 'none'; 
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function toggleAddForm() { 
    const m = document.getElementById('add-form-modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
}
async function deleteCartItem(id) { await _supabase.from('cart').delete().eq('id', id); loadCart(); }
async function clearCart() { if(confirm('Очистить?')) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }

document.addEventListener('DOMContentLoaded', loadRecipes);
