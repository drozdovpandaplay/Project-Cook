// 1. Превращаем текст в список с галочками
function renderInstructionsAsList(text) {
    if (!text || text.trim() === '') {
        return '<p style="color:#999; text-align:center; padding:20px;">Описание еще не добавлено. Перейдите во вкладку "Ред.", чтобы написать рецепт.</p>';
    }
    
    return text.split('\n')
        .filter(line => line.trim() !== '')
        .map((line, index) => `
            <div class="step-item">
                <input type="checkbox" id="step-${index}">
                <label for="step-${index}">${line.trim()}</label>
            </div>
        `).join('');
}

// 2. Основная функция открытия рецепта
async function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    const body = document.getElementById('modal-body');
    
    // Проверка ингредиентов на складе
    const { data: invData } = await _supabase.from('inventory').select('*');
    const ingredientList = r.ings ? r.ings.split(',').map(i => i.trim()) : [];
    
    const stockHTML = ingredientList.map(ing => {
        const has = invData.some(i => ing.toLowerCase().includes(i.name.toLowerCase()));
        return `<li style="color:${has ? '#2ecc71' : '#e74c3c'}; margin-bottom:8px; font-size:15px;">
            ${has ? '✅' : '❌'} ${ing}
        </li>`;
    }).join('');

    body.innerHTML = `
        <div style="position:relative;">
            <img src="${r.image_url || 'https://via.placeholder.com/400x200'}" 
                 style="width:100%; border-radius:15px; height:180px; object-fit:cover; margin-bottom:15px;">
        </div>
        
        <h2 style="margin-bottom:15px;">${r.name}</h2>
        
        <div class="tabs">
            <button onclick="showTab('ings-tab', this)" class="btn-tab active-tab">🛒 Состав</button>
            <button onclick="showTab('desc-tab', this)" class="btn-tab">👨‍🍳 Готовка</button>
            <button onclick="showTab('edit-tab', this)" class="btn-tab">✏️ Ред.</button>
        </div>

        <div id="ings-tab" class="recipe-tab">
            <ul style="padding:0; list-style:none;">${stockHTML || 'Ингредиенты не указаны'}</ul>
        </div>

        <div id="desc-tab" class="recipe-tab" style="display:none;">
            <div class="steps-container">
                ${renderInstructionsAsList(r.instructions)}
            </div>
        </div>

        <div id="edit-tab" class="recipe-tab" style="display:none;">
            <textarea id="edit-instructions" class="edit-input" 
                style="height:200px; resize:none;" 
                placeholder="Напишите шаги (каждый с новой строки)...">${r.instructions || ''}</textarea>
            <button class="btn-main" style="margin-top:10px;" onclick="saveInstructions(${r.id})">💾 Сохранить</button>
        </div>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

// 3. Переключение вкладок
function showTab(tabId, btn) {
    document.querySelectorAll('.recipe-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active-tab'));
    
    document.getElementById(tabId).style.display = 'block';
    btn.classList.add('active-tab');
}

// 4. Сохранение в базу данных
async function saveInstructions(id) {
    const text = document.getElementById('edit-instructions').value;
    
    const { error } = await _supabase
        .from('recipes')
        .update({ instructions: text })
        .eq('id', id);

    if (error) {
        alert("Ошибка сохранения: " + error.message);
    } else {
        // Обновляем данные локально
        const index = allRecipes.findIndex(r => r.id === id);
        allRecipes[index].instructions = text;
        
        // Переключаем на вкладку просмотра, чтобы увидеть результат
        const descBtn = document.querySelectorAll('.btn-tab')[1];
        showTab('desc-tab', descBtn);
    }
}
