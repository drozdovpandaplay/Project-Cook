// 1. НАСТРОЙКИ ПОДКЛЮЧЕНИЯ
const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';

const _supabase = supabase.createClient(SB_URL, SB_KEY);

// 2. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
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

// 3. ЗАГРУЗКА РЕЦЕПТОВ
async function loadRecipes() {
    const container = document.getElementById('recipe-list');
    container.innerHTML = '<p style="padding:20px; text-align:center;">Загрузка меню...</p>';

    const { data, error } = await _supabase.from('recipes').select('*');

    if (error) {
        container.innerHTML = `<p style="color:red; padding:20px;">Ошибка базы: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding:20px; text-align:center; color:#999;">В меню пока пусто</p>';
        return;
    }

    container.innerHTML = data.map(r => `
        <div class="card" onclick='openRecipe(${JSON.stringify(r)})'>
            <h3>${r.name}</h3>
            <p>🔥 ${r.kcal || 0} ккал | ⚖️ ${r.weight || 0} г</p>
        </div>
    `).join('');
}

// 4. ОТКРЫТИЕ РЕЦЕПТА
function openRecipe(r) {
    const modalBody = document.getElementById('modal-body');
    const stepsHtml = r.steps ? r.steps.split(';').map(s => `<li>${s.trim()}</li>`).join('') : 'Шаги не указаны';

    modalBody.innerHTML = `
        <h2 style="color:#46b8bc; margin-top:0;">${r.name}</h2>
        <div style="background:#f9f9f9; padding:15px; border-radius:15px; margin-bottom:15px;">
            <b>Ингредиенты:</b><br>${r.ings || 'Не указаны'}
        </div>
        <p><b>Приготовление:</b></p>
        <ol style="padding-left:20px; line-height:1.5;">${stepsHtml}</ol>
        <button class="action-btn" onclick="addToCart('${r.ings}', '${r.name}')">🛒 В корзину</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('recipe-modal').style.display = 'none';
}

// 5. ДОБАВЛЕНИЕ В КОРЗИНУ
async function addToCart(ings, dishName) {
    if (!ings) return alert('Нет ингредиентов');
    
    const items = ings.split(',').map(i => ({ 
        item_name: i.trim(), 
        dish_name: dishName 
    }));

    const { error } = await _supabase.from('cart').insert(items);

    if (error) {
        alert('Ошибка при добавлении: ' + error.message);
    } else {
        alert('Добавлено в список покупок!');
        closeModal();
    }
}

// 6. ЗАГРУЗКА КОРЗИНЫ
async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="padding:20px; text-align:center;">Загрузка корзины...</p>';

    const { data, error } = await _supabase.from('cart').select('*');

    if (error) {
        container.innerHTML = `<p style="padding:20px;">Ошибка: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding:20px; text-align:center; color:#999;">Корзина пуста</p>';
        return;
    }

    container.innerHTML = `
        <div style="padding:15px;">
            ${data.map(item => `
                <div style="background:white; padding:12px; border-radius:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <b style="color:#2d3436;">${item.item_name}</b>
                    <small style="color:#999; font-style:italic;">${item.dish_name}</small>
                </div>
            `).join('')}
            <button onclick="clearCart()" style="background:#ff7675; color:white; border:none; padding:15px; width:100%; border-radius:12px; margin-top:15px; font-weight:bold; cursor:pointer;">Очистить корзину</button>
        </div>
    `;
}

// 7. ОЧИСТКА КОРЗИНЫ
async function clearCart() {
    if (!confirm('Очистить весь список покупок?')) return;
    const { error } = await _supabase.from('cart').delete().neq('id', 0);
    if (!error) loadCart();
}

// СТАРТ
document.addEventListener('DOMContentLoaded', loadRecipes);
