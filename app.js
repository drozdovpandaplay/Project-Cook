const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';

const _supabase = supabase.createClient(SB_URL, SB_KEY);

// Переключение вкладок
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

// Загрузка меню
async function loadRecipes() {
    const container = document.getElementById('recipe-list');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка меню...</p>';

    const { data, error } = await _supabase.from('recipes').select('*');
    if (error) return container.innerHTML = 'Ошибка загрузки';

    container.innerHTML = data.map(r => `
        <div class="card" onclick='openRecipe(${JSON.stringify(r)})'>
            <h3 style="margin:0 0 10px 0;">${r.name}</h3>
            <div style="font-size:14px; color:#636e72; display:grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <span>🔥 ${r.kcal || 0} ккал</span>
                <span>⚖️ ${r.weight || 0} г</span>
                <span style="color:#46b8bc; font-weight:bold; grid-column: span 2;">💰 Цена: ${r.price || 0} ₽</span>
            </div>
        </div>
    `).join('');
}

// Открытие рецепта
function openRecipe(r) {
    const modalBody = document.getElementById('modal-body');
    const stepsHtml = r.steps ? r.steps.split(';').map(s => `<li>${s.trim()}</li>`).join('') : 'Шаги не указаны';

    modalBody.innerHTML = `
        <h2 style="color:#46b8bc; margin:0 0 15px 0;">${r.name}</h2>
        <div style="background:#f9f9f9; padding:15px; border-radius:15px; margin-bottom:15px;">
            <b>Ингредиенты:</b><br>${r.ings}
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold;">
            <span>Всего: ${r.price || 0} ₽</span>
            <span>${r.kcal || 0} ккал</span>
        </div>
        <p><b>Приготовление:</b></p>
        <ol style="padding-left:20px;">${stepsHtml}</ol>
        <button class="action-btn" onclick="addToCart('${r.ings.replace(/'/g, "\\'")}', '${r.name.replace(/'/g, "\\'")}', ${r.price || 0})">🛒 В корзину</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

// Сохранение рецепта (с учетом базы продуктов)
async function saveRecipe() {
    const name = document.getElementById('new-name').value;
    const ingsRaw = document.getElementById('new-ings').value;
    const steps = document.getElementById('new-steps').value;
    
    // Ручной ввод, если не нашли в базе
    let kcal = parseInt(document.getElementById('new-kcal').value) || 0;
    let weight = parseInt(document.getElementById('new-weight').value) || 0;
    let price = parseInt(document.getElementById('new-price').value) || 0;

    if (!name || !ingsRaw) return alert('Название и ингредиенты обязательны!');

    // ЛОГИКА БАЗЫ ПРОДУКТОВ:
    // Попробуем найти цены и ккал для ингредиентов автоматически
    const ingNames = ingsRaw.split(',').map(i => i.trim());
    const { data: foundProducts } = await _supabase.from('products').select('*').in('name', ingNames);

    if (foundProducts && foundProducts.length > 0) {
        let autoPrice = 0;
        let autoKcal = 0;
        foundProducts.forEach(p => {
            autoPrice += (p.price || 0);
            autoKcal += (p.kcal || 0);
        });
        
        // Если пользователь оставил поля пустыми, подставляем данные из базы продуктов
        if (price === 0) price = autoPrice;
        if (kcal === 0) kcal = autoKcal;
    }

    const { error } = await _supabase.from('recipes').insert([{
        name, kcal, weight, price, ings: ingsRaw, steps
    }]);

    if (error) alert('Ошибка: ' + error.message);
    else {
        alert('Рецепт успешно сохранен!');
        toggleAddForm();
        loadRecipes();
    }
}

// Добавление в корзину
async function addToCart(ings, dishName, totalPrice) {
    const ingList = ings.split(',').map(i => i.trim());
    const pricePerItem = Math.round(totalPrice / ingList.length);

    const items = ingList.map(i => ({ 
        item_name: i, 
        dish_name: dishName,
        price: pricePerItem 
    }));

    const { error } = await _supabase.from('cart').insert(items);
    if (!error) { 
        alert('Ингредиенты добавлены в список покупок!'); 
        closeModal(); 
    }
}

// Загрузка корзины
async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка...</p>';
    
    const { data, error } = await _supabase.from('cart').select('*');
    if (error || !data.length) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Корзина пуста</p>';
        return;
    }

    const totalSum = data.reduce((sum, item) => sum + (item.price || 0), 0);

    container.innerHTML = `
        <div style="padding:15px;">
            <div style="background:#46b8bc; color:white; padding:20px; border-radius:15px; margin-bottom:15px; text-align:center; box-shadow:0 4px 10px rgba(70,184,188,0.2);">
                <small>Сумма к оплате</small>
                <h2 style="margin:5px 0 0 0;">${totalSum} ₽</h2>
            </div>
            ${data.map(item => `
                <div style="background:white; padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <div>
                        <b style="display:block;">${item.item_name}</b>
                        <small style="color:#999;">${item.dish_name} (~${item.price || 0} ₽)</small>
                    </div>
                    <button onclick="deleteCartItem(${item.id})" style="background:none; border:none; font-size:18px; color:#ff7675; cursor:pointer;">✕</button>
                </div>
            `).join('')}
            <button onclick="clearCart()" style="background:none; border:none; color:#ff7675; width:100%; margin-top:15px; cursor:pointer; font-weight:bold;">Очистить весь список</button>
        </div>
    `;
}

// Вспомогательные функции
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function toggleAddForm() { 
    const modal = document.getElementById('add-form-modal');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}
async function deleteCartItem(id) { 
    await _supabase.from('cart').delete().eq('id', id); 
    loadCart(); 
}
async function clearCart() { 
    if (confirm('Очистить корзину?')) {
        await _supabase.from('cart').delete().neq('id', 0);
        loadCart();
    }
}

document.addEventListener('DOMContentLoaded', loadRecipes);
