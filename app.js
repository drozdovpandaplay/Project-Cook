const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];

async function loadRecipes() {
    const { data } = await _supabase.from('recipes').select('*').order('name');
    allRecipes = data || [];
    renderRecipes(allRecipes);
}

function renderRecipes(list) {
    const container = document.getElementById('categories-container');
    container.innerHTML = list.map(r => `
        <div class="card" onclick="openRecipe(${r.id})">
            <img src="${r.image_url || 'https://via.placeholder.com/150'}" class="card-img" onerror="this.src='https://via.placeholder.com/150'">
            <span class="card-title">${r.name}</span>
            <small style="color:var(--primary)">${r.category}</small>
        </div>
    `).join('');
}

async function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const modal = document.getElementById('recipe-modal');
    const content = document.getElementById('recipe-detail-content');
    
    const steps = r.instructions || [];
    
    content.innerHTML = `
        <img src="${r.image_url}" style="width:100%; border-radius:15px; height:200px; object-fit:cover;">
        <h2>${r.name}</h2>
        
        <h3>Ингредиенты</h3>
        <p>${r.ings || 'Не указаны'}</p>

        <h3>Инструкция (Чек-лист)</h3>
        <div id="steps-list">
            ${steps.map((s, i) => `
                <div class="step-row">
                    <input type="checkbox" id="st-${i}">
                    <label for="st-${i}">${s.text}</label>
                    ${s.timer ? `<button onclick="startTimer(${s.timer})">⏰ ${s.timer}м</button>` : ''}
                </div>
            `).join('')}
        </div>

        <button class="btn btn-save" onclick="showEditor(${r.id})">✏️ РЕДАКТИРОВАТЬ</button>
    `;
    modal.style.display = 'block';
}

function showEditor(id) {
    const r = allRecipes.find(x => x.id === id);
    const content = document.getElementById('recipe-detail-content');
    const steps = r.instructions || [];

    content.innerHTML = `
        <h3>Редактирование</h3>
        <label>Название:</label>
        <input type="text" id="edit-name" class="edit-input" value="${r.name}">
        
        <label>Ссылка на фото:</label>
        <input type="text" id="edit-img" class="edit-input" value="${r.image_url || ''}">

        <label>Ингредиенты:</label>
        <textarea id="edit-ings" class="edit-input" rows="4">${r.ings || ''}</textarea>

        <label>Шаги (текст | минуты):</label>
        <div id="edit-steps-container">
            ${steps.map((s, i) => `
                <div class="step-row">
                    <input type="text" class="step-txt edit-input" value="${s.text}" style="margin:0">
                    <input type="number" class="step-tm edit-input" value="${s.timer || 0}" style="width:60px; margin:0">
                </div>
            `).join('')}
        </div>
        <button onclick="addStepField()" class="btn">➕ Добавить шаг</button>

        <button class="btn btn-save" onclick="saveToSupabase(${r.id})">✅ СОХРАНИТЬ В БАЗУ</button>
    `;
}

function addStepField() {
    const container = document.getElementById('edit-steps-container');
    container.innerHTML += `
        <div class="step-row">
            <input type="text" class="step-txt edit-input" placeholder="Что делать?" style="margin:0">
            <input type="number" class="step-tm edit-input" placeholder="Мин" style="width:60px; margin:0">
        </div>`;
}

async function saveToSupabase(id) {
    const name = document.getElementById('edit-name').value;
    const img = document.getElementById('edit-img').value;
    const ings = document.getElementById('edit-ings').value;
    
    const txts = document.querySelectorAll('.step-txt');
    const tms = document.querySelectorAll('.step-tm');
    const instructions = Array.from(txts).map((t, i) => ({
        text: t.value,
        timer: parseInt(tms[i].value) || 0
    })).filter(s => s.text.trim() !== '');

    const { error } = await _supabase.from('recipes').update({
        name, image_url: img, ings, instructions
    }).eq('id', id);

    if (error) alert("Ошибка: " + error.message);
    else { alert("Сохранено!"); closeRecipe(); loadRecipes(); }
}

// ТАЙМЕР
let timerInt;
function startTimer(m) {
    stopTimer();
    let sec = m * 60;
    const display = document.getElementById('global-timer');
    const count = document.getElementById('timer-count');
    display.style.display = 'flex';
    
    timerInt = setInterval(() => {
        sec--;
        let mm = Math.floor(sec / 60);
        let ss = sec % 60;
        count.innerText = `${mm}:${ss < 10 ? '0' : ''}${ss}`;
        if (sec <= 0) { stopTimer(); alert("Готово!"); }
    }, 1000);
}
function stopTimer() { clearInterval(timerInt); document.getElementById('global-timer').style.display = 'none'; }

function closeRecipe() { document.getElementById('recipe-modal').style.display = 'none'; }

document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    renderRecipes(allRecipes.filter(r => r.name.toLowerCase().includes(term)));
});

loadRecipes();
