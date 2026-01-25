const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

// 1. ЗАГРУЗКА РЕЦЕПТОВ
async function loadRecipes() {
    const { data, error } = await _supabase.from('recipes').select('*').order('category');
    if (error) {
        console.error("Ошибка загрузки:", error);
        return;
    }
    allRecipes = data || [];
    renderCategorized(allRecipes);
}

// 2. ОТРИСОВКА МЕНЮ
function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = '';

    // Кнопка действия (появляется только если выбраны блюда)
    if (selectedRecipes.size > 0) {
        const actionBtn = document.createElement('div');
        actionBtn.style.padding = '0 20px 20px';
        actionBtn.innerHTML = `
            <button onclick="sendSelectedToCart()" style="width:100%; padding:18px; background:#46b8bc; color:white; border:none; border-radius:18px; font-weight:bold; font-size:16px; box-shadow: 0 8px 20px rgba(70,184,188,0.3);">
                🛒 Добавить в покупки (${selectedRecipes.size})
            </button>`;
        container.appendChild(actionBtn);
    }

    const groups = list.reduce((acc, r) => {
        const cat = r.category || 'Другое';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.innerHTML = `
            <div style="font-weight:600; padding:10px 20px; color:#888; font-size:12px; text-transform:uppercase;">${category}</div>
            <div class="category-row" style="display:flex; overflow-x:auto; gap:15px; padding:10px 20px; scroll-snap-type:x mandatory;">
                ${items.map(r => `
                    <div class="card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}" 
                         onclick="toggleRecipeSelect(${r.id})" 
                         style="flex:0 0 75%; background:white; padding:20px; border-radius:25px; box-shadow:0 4px 12px rgba(0,0,0,0.05); border:2px solid ${selectedRecipes.has(r.id) ? '#46b8bc' : 'transparent'}; scroll-snap-align:center;">
                        <div style="font-size:35px; margin-bottom:10px;">🍲</div>
                        <div style="font-weight:bold; font-size:16px; margin-bottom:5px;">${r.name}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:#46b8bc; font-size:14px; font-weight:600;">${r.kcal || 0} ккал</span>
                            <button onclick="event.stopPropagation(); openRecipeInfo(${r.id})" style="background:none; border:none; color:gray; font-size:12px; text-decoration:underline;">Состав</button>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        container.appendChild(section);
    }
}

// 3. ЛОГИКА ВЫБОРА
function toggleRecipeSelect(id) {
    selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id);
    renderCategorized(allRecipes);
}

// 4. ПОДРОБНОСТИ РЕЦЕПТА (С РАСЧЕТОМ ГРАММ)
async function openRecipeInfo(id) {
    const r = allRecipes.find(x => x.id === id);
    const modal = document.getElementById('recipe-modal');
    modal.style.display = 'block';
    
    const ings = r.ings ? r.ings.split(',').map(i => i.trim().toLowerCase()) : [];
    const amounts = r.amounts ? r.amounts.split(',').map(a => parseFloat(a)) : new Array(ings.length).fill(100);
    
    const { data: prods } = await _supabase.from('products').select('name, price').in('name', ings);
    
    let total = 0;
    const html = ings.map((ing, idx) => {
        const p = prods?.find(item => item.name.toLowerCase() === ing);
        const weight = amounts[idx] || 100;
        const price = p ? Math.round((p.price / 1000) * weight) : 0;
        total += price;
        return `<div style
