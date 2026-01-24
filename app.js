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
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка меню...</p>';

    const { data, error } = await _supabase.from('recipes').select('*');
    if (error) return container.innerHTML = 'Ошибка загрузки данных';

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
        <button class="action-btn" onclick="addToCart('${r.ings}', '${r.name}')">🛒 В корзину</button>
    `;
    document.getElementById('recipe-
