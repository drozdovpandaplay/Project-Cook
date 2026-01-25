const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

async function loadRecipes() {
    try {
        const { data, error } = await _supabase.from('recipes').select('*').order('category');
        if (error) throw error;
        allRecipes = data || [];
        renderCategorized(allRecipes);
    } catch (e) {
        console.error("Ошибка загрузки данных:", e);
    }
}

function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    const btnBox = document.getElementById('action-btn-container');
    if (!container) return;
    
    container.innerHTML = '';
    btnBox.innerHTML = selectedRecipes.size > 0 
        ? `<button class="main-btn" onclick="sendToCart()">🛒 Собрать список (${selectedRecipes.size})</button>` 
        : '';

    const groups = list.reduce((acc, r) => {
        const cat = r.category || 'Меню';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.innerHTML = `<div class="category-title">${category}</div>`;
        
        const row = document.createElement('div');
        row.className = 'category-row';

        items.forEach(r => {
            // ФОРМИРУЕМ ССЫЛКУ НА ФОТО (если в базе пусто, берем из сервиса)
            const imgUrl = r.image_url || `https://loremflickr.com/400/300/food,dish,${encodeURIComponent(r.name.split(' ')[0])}`;
            
            const card = document.createElement('div');
            card.className = `card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}`;
            card.onclick = () => toggleSelect(r.id);
            
            card.innerHTML = `
                <img src="${imgUrl}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Food'">
                <div style="display:flex; justify-content:space-between; align-items: center; min-height:44px;">
                    <div style="font-weight:700; font-size:16px; line-height:1.2;">${r.name}</div>
                    <button onclick="event.stopPropagation(); openRecipe(${r.id})" class="card-info-btn">СОСТАВ</button>
                </div>
                <div class="card-meta">
                    <span>⚖️ ${r.weight || 0}г</span>
                    <span>👥 ${r.servings || 1}</span>
                    <span style="color:#46b8bc; font-weight:800;">${r.price || 0} ₽</span>
                </div>
            `;
            row.appendChild(card);
        });
        
        section.appendChild(row);
        container.appendChild(section);
    }
}

// Функции переключения вкладок
function switchTab(tab) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    if (tab === 'recipes') {
        document.getElementById('recipe-list-section').classList.add('active');
        document.getElementById('btn-recipes').classList.add('active');
        loadRecipes();
    } else if (tab === 'cart') {
        document.getElementById('cart-list-section').classList.add('active');
        document.getElementById('btn-cart').classList.add('active');
        loadCart();
    } else if (tab === 'all-ingredients') {
        document.getElementById('all-ingredients-section').classList.add('active');
        loadAllIngredients();
    }
}

// Загрузка корзины и прочее (без изменений, но с исправлением ошибок)
async function loadCart() {
    const container = document.getElementById('cart-list');
    container.innerHTML = '<p style="text-align:center;">Загрузка...</p>';
    const { data } = await _supabase.from('cart').select('*');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:50px;">Пусто</p>';
        return;
    }
    let html = `<button onclick="clearCart()" class="main-btn" style="background:#ff7675; margin-bottom:20px;">ОЧИСТИТЬ</button>`;
    data.forEach(item => {
        html += `<div class="cart-card"><b>${item.dish_name}</b><span>${item.price} ₽</span></div>`;
    });
    container.innerHTML = html;
}

function openRecipe(id) {
    const r = allRecipes.find(x => x.id === id);
    if (!r) return;
    document.getElementById('modal-body').innerHTML = `
        <h2>${r.name}</h2>
        <p>Ингредиенты: ${r.ings || 'не указаны'}</p>
        <button onclick="closeModal()" class="main-btn">ЗАКРЫТЬ</button>
    `;
    document.getElementById('recipe-modal').style.display = 'block';
}

function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
function toggleSelect(id) {
    selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id);
    renderCategorized(allRecipes);
}
async function clearCart() { if(confirm("Очистить?")) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
async function loadAllIngredients() {
    const { data } = await _supabase.from('products').select('*');
    document.getElementById('ingredients-full-list').innerHTML = data ? data.map(i => `<div class="ing-item"><b>${i.name}</b> ${i.price}₽</div>`).join('') : '';
}

document.addEventListener('DOMContentLoaded', loadRecipes);
