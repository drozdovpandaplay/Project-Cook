const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';

const _supabase = supabase.createClient(SB_URL, SB_KEY);

function switchTab(type) {
    console.log('Switching to tab:', type);
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
    if (error) {
        container.innerHTML = 'Ошибка загрузки данных';
        return;
    }

    container.innerHTML = data.map(r => `
        <div class="card" onclick='openRecipe(${JSON.stringify(r)})'>
            <h3 style="margin:0 0 10px 0;">${r.name}</h3>
            <span style="color:#999; font-size:14px;">🔥 ${r.kcal || 0} ккал | ⚖️ ${r.weight || 0} г</span>
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
        <p><b>Приготовление:</b></p>
        <ol style="padding-left:20px;">${stepsHtml}</ol>
        <button class="action-btn" onclick="addToCart('${r.ings.replace(/'/g, "\\'")}', '${r.name.replace(/'/g, "\\'")}')">🛒 В корзину</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('recipe-modal').style.display = 'none';
}

function toggleAddForm() {
    const modal = document.getElementById('add-form-modal');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

async function saveRecipe() {
    const name = document.getElementById('new-name').value;
    const kcal = document.getElementById('new-kcal').value;
    const weight = document.getElementById('new-weight').value;
    const ings = document.getElementById('new-ings').value;
    const steps = document.getElementById('new-steps').value;

    if (!name || !ings) return alert('Название и ингредиенты обязательны!');

    const { error } = await _supabase.from('recipes').insert([{
        name, kcal: parseInt(kcal) || 0, weight: parseInt(weight) || 0, ings, steps
    }]);

    if (error) {
        alert('Ошибка: ' + error.message);
    } else {
        alert('Рецепт добавлен!');
        toggleAddForm();
        loadRecipes();
    }
}

async function addToCart(ings, dishName) {
    const items = ings.split(',').map(i => ({ item_name: i.trim(), dish_name: dishName }));
    const { error } = await _supabase.from('cart').insert(items);
    if (!error) { alert('В списке покупок!'); closeModal(); }
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка...</p>';
    
    const { data, error } = await _supabase.from('cart').select('*');
    if (error || !data.length) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Корзина пуста</p>';
        return;
    }

    container.innerHTML = `
        <div style="padding:15px;">
            ${data.map(item => `
                <div style="background:white; padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <div>
                        <b style="display:block;">${item.item_name}</b>
                        <small style="color:#999; font-style:italic;">${item.dish_name}</small>
                    </div>
                    <button onclick="deleteCartItem(${item.id})" style="background:none; border:none; font-size:18px; color:#ff7675; cursor:pointer; padding:5px;">✕</button>
                </div>
            `).join('')}
            <button onclick="clearCart()" style="background:#ff7675; color:white; border:none; padding:15px; width:100%; border-radius:12px; margin-top:20px; font-weight:bold; cursor:pointer;">Очистить всё</button>
        </div>
    `;
}

async function deleteCartItem(id) {
    const { error } = await _supabase.from('cart').delete().eq('id', id);
    if (error) alert('Ошибка удаления'); else loadCart();
}

async function clearCart() {
    if (confirm('Очистить корзину?')) {
        await _supabase.from('cart').delete().neq('id', 0);
        loadCart();
    }
}

document.addEventListener('DOMContentLoaded', loadRecipes);
