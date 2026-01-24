const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let timerInterval;

function switchTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    document.getElementById('recipe-list').style.display = type === 'recipes' ? 'block' : 'none';
    document.getElementById('cart-list').style.display = type === 'cart' ? 'block' : 'none';
    type === 'recipes' ? loadRecipes() : loadCart();
}

async function loadRecipes() {
    const container = document.getElementById('recipe-list');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Загрузка меню...</p>';
    
    // Убрали сложную сортировку для стабильности
    const { data, error } = await _supabase.from('recipes').select('*');
    
    if (error) {
        console.error("Ошибка базы:", error);
        container.innerHTML = `<p style="color:red; text-align:center;">Ошибка: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Рецептов пока нет. Добавьте первый!</p>';
        return;
    }

    container.innerHTML = data.map(r => `
        <div class="card" onclick='openRecipe(${JSON.stringify(r)})' style="padding:0; overflow:hidden; margin-bottom:15px; background:white; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            ${r.image_url ? `<img src="${r.image_url}" style="width:100%; height:160px; object-fit:cover;">` : `<div style="height:160px; background:#f1f2f6; display:flex; align-items:center; justify-content:center; color:#ccc;">📸 Нет фото</div>`}
            <div style="padding:15px;">
                <h3 style="margin:0 0 8px 0; color:#2d3436;">${r.name}</h3>
                <div style="font-size:13px; color:#636e72;">💰 ${r.price || 0} ₽ | 🔥 ${r.kcal || 0} ккал</div>
            </div>
        </div>
    `).join('');
}

function openRecipe(r) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        ${r.image_url ? `<img src="${r.image_url}" style="width:100%; height:200px; object-fit:cover; border-radius:15px; margin-bottom:15px;">` : ''}
        <h2 style="color:#46b8bc; margin-bottom:10px;">${r.name}</h2>
        <p style="background:#f1f2f6; padding:12px; border-radius:10px; font-size:14px; color:#2d3436;"><b>Состав:</b> ${r.ings}</p>
        <p><b>Приготовление:</b></p>
        <ol style="padding-left:20px; font-size:14px; line-height:1.6;">${r.steps ? r.steps.split(';').map(s => `<li>${s.trim()}</li>`).join('') : 'Инструкция скоро появится'}</ol>
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
    let price = parseInt(document.getElementById('new-price').value) || 0;
    let image_url = null;

    if (!name || !ingsRaw) return alert('Название и состав обязательны!');

    if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const { data: upData, error: upErr } = await _supabase.storage.from('recipe-images').upload(fileName, imageFile);
        if (!upErr) {
            const { data: urlData } = _supabase.storage.from('recipe-images').getPublicUrl(fileName);
            image_url = urlData.publicUrl;
        }
    }

    const { error } = await _supabase.from('recipes').insert([{ name, kcal, price, ings: ingsRaw, steps, image_url }]);
    if (error) alert("Ошибка сохранения: " + error.message);
    else { toggleAddForm(); loadRecipes(); }
}

async function addToCart(ings, dishName, totalPrice) {
    const ingList = ings.split(',').map(i => i.trim());
    const ppi = Math.round((totalPrice || 100) / ingList.length);
    const items = ingList.map(i => ({ item_name: i, dish_name: dishName, price: ppi }));
    await _supabase.from('cart').insert(items);
    alert('Добавлено!'); closeModal();
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    const { data } = await _supabase.from('cart').select('*');
    if (!data || data.length === 0) return container.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Корзина пуста</p>';
    
    const total = data.reduce((s, i) => s + (i.price || 0), 0);
    container.innerHTML = `
        <div style="padding:15px;">
            <div style="background:#46b8bc; color:white; padding:15px; border-radius:15px; margin-bottom:15px; text-align:center;">
                <h2 style="margin:0;">${total} ₽</h2>
            </div>
            ${data.map(item => `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin-bottom:10px; background:white;">
                    <div><b>${item.item_name}</b><br><small style="color:#999;">${item.dish_name}</small></div>
                    <button onclick="deleteCartItem(${item.id})" style="color:#ff7675; background:none; border:none; font-size:20px; cursor:pointer;">✕</button>
                </div>
            `).join('')}
        </div>
    `;
}

function startRecipeTimer(dishName) {
    const min = prompt(`Минут для "${dishName}":`, "10");
    if (!min) return;
    let sec = parseInt(min) * 60;
    document.getElementById('active-timer-display').style.display = 'flex';
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const m = Math.floor(sec / 60), s = sec % 60;
        document.getElementById('timer-countdown').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (sec-- <= 0) { clearInterval(timerInterval); alert('Готово!'); stopVisualTimer(); }
    }, 1000);
}

function stopVisualTimer() { clearInterval(timerInterval); document.getElementById('active-timer-display').style.display = 'none'; }
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function toggleAddForm() { 
    const m = document.getElementById('add-form-modal');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
}
async function deleteCartItem(id) { await _supabase.from('cart').delete().eq('id', id); loadCart(); }

document.addEventListener('DOMContentLoaded', loadRecipes);
