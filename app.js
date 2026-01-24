const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';

const _supabase = supabase.createClient(SB_URL, SB_KEY);

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
            <span style="color:#999; font-size:14px;">🔥 ${r.kcal || 0} ккал | ⚖️ ${r.weight || 0} г</span>
        </div>
    `).join('');
}

function openRecipe(r) {
    const modalBody = document.getElementById('modal-body');
    const stepsHtml = r.steps ? r.steps.split(';').map(s => `<li>${s.trim()}</li>`).join('') : 'Шаги не указаны';

    modalBody.innerHTML = `
        <h2 style="color:#46b8bc; margin:0 0 15px 0;">${r.name}</h2>
        <p><b>Ингредиенты:</b><br>${r.ings}</p>
        <p><b>Приготовление:</b></p>
        <ol>${stepsHtml}</ol>
        <button class="action-btn" onclick="addToCart('${r.ings}', '${r.name}')">🛒 В корзину</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('recipe-modal').style.display = 'none';
}

function toggleAddForm() {
    const modal = document.getElementById('add-form-modal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

async function saveRecipe() {
    const name = document.getElementById('new-name').value;
    const kcal = document.getElementById('new-kcal').value;
    const weight = document.getElementById('new-weight').value;
    const ings = document.getElementById('new-ings').value;
    const steps = document.getElementById('new-steps').value;

    if (!name || !ings) return alert('Название и ингредиенты обязательны!');

    const { error } = await _supabase.from('recipes').insert([{ name, kcal, weight, ings, steps }]);

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
    const { data, error } = await _supabase.from('cart').select('*');
    if (error || !data.length) return container.innerHTML = '<p style="text-align:center; padding:20px;">Список пуст</p>';

    container.innerHTML = data.map(item => `
        <div style="background:white; margin:10px 15px; padding:15px; border-radius:12px; display:flex; justify-content:space-between;">
            <b>${item.item_name}</b>
            <small style="color:#999">${item.dish_name}</small>
        </div>
    `).join('') + `<button onclick="clearCart()" style="margin:20px; color:red; background:none; border:none; width:90%; cursor:pointer;">Очистить всё</button>`;
}

async function clearCart() {
    if (confirm('Очистить корзину?')) {
        await _supabase.from('cart').delete().neq('id', 0);
        loadCart();
    }
}

document.addEventListener('DOMContentLoaded', loadRecipes);
