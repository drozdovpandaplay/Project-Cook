const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';

const _supabase = supabase.createClient(SB_URL, SB_KEY);

function switchTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${type}`);
    if (activeBtn) activeBtn.classList.add('active');

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
                <span style="color:var(--main-color); font-weight:bold; grid-column: span 2;">💰 Цена: ${r.price || 0} ₽</span>
            </div>
        </div>
    `).join('');
}

function openRecipe(r) {
    const modalBody = document.getElementById('modal-body');
    const stepsHtml = r.steps ? r.steps.split(';').map(s => `<li>${s.trim()}</li>`).join('') : 'Шаги не указаны';

    modalBody.innerHTML = `
        <h2 style="color:#46b8bc; margin:0 0 15px 0;">${r.name}</h2>
        <div style="background:#f9f9f9; padding:15px; border-radius:15px; margin-bottom:15px;">
            <b>Ингредиенты:</b><br>${r.ings}
        </div>
        <p><b>Стоимость: ${r.price || 0} ₽</b></p>
        <p><b>Приготовление:</b></p>
        <ol style="padding-left:20px;">${stepsHtml}</ol>
        <button class="action-btn" onclick="addToCart('${r.ings.replace(/'/g, "\\'")}', '${r.name.replace(/'/g, "\\'")}', ${r.price || 0})">🛒 В корзину</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

async function saveRecipe() {
    const name = document.getElementById('new-name').value;
    const kcal = document.getElementById('new-kcal').value;
    const weight = document.getElementById('new-weight').value;
    const price = document.getElementById('new-price').value; // Новое поле
    const ings = document.getElementById('new-ings').value;
    const steps = document.getElementById('new-steps').value;

    if (!name || !ings) return alert('Название и ингредиенты обязательны!');

    const { error } = await _supabase.from('recipes').insert([{
        name, kcal: parseInt(kcal) || 0, weight: parseInt(weight) || 0, price: parseInt(price) || 0, ings, steps
    }]);

    if (error) alert('Ошибка: ' + error.message);
    else { alert('Рецепт добавлен!'); toggleAddForm(); loadRecipes(); }
}

async function addToCart(ings, dishName, totalPrice) {
    // Рассчитываем примерную цену за один ингредиент (общая цена / количество ингредиентов)
    const ingList = ings.split(',');
    const pricePerItem = Math.round(totalPrice / ingList.length);

    const items = ingList.map(i => ({ 
        item_name: i.trim(), 
        dish_name: dishName,
        price: pricePerItem 
    }));

    const { error } = await _supabase.from('cart').insert(items);
    if (!error) { alert('Добавлено в корзину!'); closeModal(); }
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    const { data, error } = await _supabase.from('cart').select('*');
    if (error || !data.length) return container.innerHTML = '<p style="text-align:center; padding:20px;">Пусто</p>';

    const totalSum = data.reduce((sum, item) => sum + (item.price || 0), 0);

    container.innerHTML = `
        <div style="padding:15px;">
            <div style="background:var(--main-color); color:white; padding:15px; border-radius:15px; margin-bottom:15px; text-align:center;">
                <h3 style="margin:0">Итого к оплате: ${totalSum} ₽</h3>
            </div>
            ${data.map(item => `
                <div style="background:white; padding:12px; border-radius:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <b>${item.item_name}</b><br>
                        <small>${item.dish_name} (~${item.price || 0} ₽)</small>
                    </div>
                    <button onclick="deleteCartItem(${item.id})" style="background:none; border:none; color:#ff7675; font-size:18px;">✕</button>
                </div>
            `).join('')}
            <button onclick="clearCart()" style="width:100%; color:#ff7675; background:none; border:none; margin-top:10px; cursor:pointer;">Очистить всё</button>
        </div>
    `;
}

// Остальные функции (closeModal, toggleAddForm, deleteCartItem, clearCart) остаются прежними
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function toggleAddForm() { 
    const modal = document.getElementById('add-form-modal');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}
async function deleteCartItem(id) { await _supabase.from('cart').delete().eq('id', id); loadCart(); }
async function clearCart() { if (confirm('Очистить?')) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
document.addEventListener('DOMContentLoaded', loadRecipes);
