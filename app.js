const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];

async function loadRecipes() {
    const { data, error } = await _supabase.from('recipes').select('*').order('name');
    if (error) return console.error(error);
    allRecipes = data || [];
    renderRecipes(allRecipes);
}

function renderRecipes(list) {
    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = list.map(r => `
        <div class="card" onclick="openRecipe(${r.id})">
            <img src="${r.image_url || 'https://via.placeholder.com/300x200?text=Project+Food'}" class="card-img" onerror="this.src='https://via.placeholder.com/300x200?text=Food'">
            <div class="card-info">
                <span class="card-title">${r.name}</span>
                <span class="card-tag">${r.category || 'Общее'}</span>
            </div>
        </div>
    `).join('');
}

function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const body = document.getElementById('modal-body');
    const steps = Array.isArray(r.instructions) ? r.instructions : [];

    body.innerHTML = `
        <img src="${r.image_url || 'https://via.placeholder.com/600x400'}" class="recipe-hero">
        <div class="padding">
            <h2>${r.name}</h2>
            <p><strong>Ингредиенты:</strong><br>${r.ings || 'Не указаны'}</p>
            <hr>
            <h3>Инструкция</h3>
            ${steps.map((s, i) => `
                <div class="step-item">
                    <input type="checkbox" id="step-${i}">
                    <span class="step-text">${s.text}</span>
                    ${s.timer > 0 ? `<button onclick="startTimer(${s.timer})" style="border:none; background:#eee; padding:5px; border-radius:5px;">⏳ ${s.timer}м</button>` : ''}
                </div>
            `).join('')}
            <button class="btn-main" style="margin-top:20px; background:#636e72" onclick="showEditor(${r.id})">✏️ Редактировать</button>
        </div>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function showEditor(id) {
    const r = allRecipes.find(x => x.id === id);
    const body = document.getElementById('modal-body');
    const steps = Array.isArray(r.instructions) ? r.instructions : [];

    body.innerHTML = `
        <div class="padding">
            <h3>Редактор</h3>
            <input type="text" id="edit-name" class="edit-input" value="${r.name}" placeholder="Название">
            <input type="text" id="edit-img" class="edit-input" value="${r.image_url || ''}" placeholder="Ссылка на фото">
            <textarea id="edit-ings" class="edit-input" rows="4" placeholder="Ингредиенты">${r.ings || ''}</textarea>
            
            <div id="edit-steps-list">
                ${steps.map((s, i) => `
                    <div class="step-row" style="display:flex; gap:5px; margin-bottom:5px;">
                        <input type="text" class="step-t edit-input" value="${s.text}" style="margin:0">
                        <input type="number" class="step-m edit-input" value="${s.timer || 0}" style="width:60px; margin:0">
                    </div>
                `).join('')}
            </div>
            <button onclick="addStepField()" class="btn-main" style="background:#b2bec3; margin-bottom:15px;">+ Добавить шаг</button>
            <button onclick="saveChanges(${id})" class="btn-main">✅ Сохранить</button>
        </div>
    `;
}

function addStepField() {
    const container = document.getElementById('edit-steps-list');
    container.insertAdjacentHTML('beforeend', `
        <div class="step-row" style="display:flex; gap:5px; margin-bottom:5px;">
            <input type="text" class="step-t edit-input" placeholder="Шаг" style="margin:0">
            <input type="number" class="step-m edit-input" placeholder="Мин" style="width:60px; margin:0">
        </div>
    `);
}

async function saveChanges(id) {
    const name = document.getElementById('edit-name').value;
    const img = document.getElementById('edit-img').value;
    const ings = document.getElementById('edit-ings').value;
    const tFields = document.querySelectorAll('.step-t');
    const mFields = document.querySelectorAll('.step-m');

    const instructions = Array.from(tFields).map((f, i) => ({
        text: f.value,
        timer: parseInt(mFields[i].value) || 0
    })).filter(s => s.text !== '');

    const { error } = await _supabase.from('recipes').update({ name, image_url: img, ings, instructions }).eq('id', id);
    if (error) alert(error.message);
    else { closeModal(); loadRecipes(); }
}

// Таймер и поиск
let timerInt;
function startTimer(m) {
    stopTimer();
    let sec = m * 60;
    document.getElementById('global-timer').style.display = 'flex';
    timerInt = setInterval(() => {
        sec--;
        let mins = Math.floor(sec / 60);
        let secs = sec % 60;
        document.getElementById('timer-count').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (sec <= 0) { stopTimer(); alert("Время вышло!"); }
    }, 1000);
}
function stopTimer() { clearInterval(timerInt); document.getElementById('global-timer').style.display = 'none'; }
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }

document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    renderRecipes(allRecipes.filter(r => r.name.toLowerCase().includes(term)));
    // Переключение между Меню, Складом и Корзиной
function switchSection(name) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    if (name === 'menu') {
        document.getElementById('main-categories').style.display = 'grid';
        document.getElementById('recipe-grid').style.display = 'none';
    } else {
        document.getElementById(name + '-section').style.display = 'block';
        document.getElementById('main-categories').style.display = 'none';
        document.getElementById('recipe-grid').style.display = 'none';
        if (name === 'inventory') loadInventory();
        if (name === 'shopping') loadShoppingList();
    }
    // Подсветка активной кнопки в навигации
    event.currentTarget.classList.add('active');
}

// Загрузка списка покупок
async function loadShoppingList() {
    const { data } = await _supabase.from('shopping_list').select('*').order('checked');
    const container = document.getElementById('shopping-list-container');
    container.innerHTML = data.map(item => `
        <div class="list-item ${item.checked ? 'checked' : ''}" onclick="toggleShopItem(${item.id}, ${item.checked})">
            <span>${item.name} - ${item.amount} ${item.unit}</span>
            <span class="checkmark">${item.checked ? '✅' : '⬜'}</span>
        </div>
    `).join('');
}

// Функция добавления из рецепта в корзину
async function addRecipeToCart(recipeId) {
    const r = allRecipes.find(x => x.id === recipeId);
    const ingredients = r.ings.split(','); // Предполагаем, что они через запятую
    
    for (let ing of ingredients) {
        await _supabase.from('shopping_list').insert({ name: ing.trim(), amount: 0, unit: 'шт' });
    }
    alert('Ингредиенты добавлены в корзину!');
}
});

loadRecipes();
