const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

function getEmoji(cat) {
    const icons = { 'Супы': '🥣', 'Гарниры': '🍚', 'Второе': '🥩', 'Салаты': '🥗', 'Завтраки': '🍳', 'Десерты': '🍰' };
    return icons[cat] || '🍽️';
}

async function loadRecipes() {
    const { data } = await _supabase.from('recipes').select('*').order('category');
    allRecipes = data || [];
    renderCategorized(allRecipes);
}

function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    if (selectedRecipes.size > 0) {
        container.innerHTML = `<div style="padding: 10px 20px;">
            <button onclick="sendSelectedToCart()" style="width:100%; padding:16px; background:var(--primary); color:white; border:none; border-radius:15px; font-weight:600; box-shadow: 0 8px 20px rgba(70,184,188,0.3);">
                🛒 Собрать продукты (${selectedRecipes.size})
            </button>
        </div>`;
    }

    const groups = list.reduce((acc, r) => {
        const cat = r.category || 'Другое';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `<div style="font-weight:600; padding:10px 20px;">${category}</div>
            <div class="category-row">${items.map(r => `
                <div class="card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}" onclick="toggleRecipeSelect(${r.id})">
                    <div class="card-thumb">
                        ${getEmoji(category)}
                        <div class="select-badge">${selectedRecipes.has(r.id) ? '✓' : '+'}</div>
                    </div>
                    <div class="card-content">
                        <div style="font-weight:600; font-size:14px; margin-bottom:5px;">${r.name}</div>
                        <button onclick="event.stopPropagation(); openRecipeById(${r.id})" style="background:none; border:none; color:var(--primary); padding:0; font-size:12px;">Посмотреть состав</button>
                    </div>
                </div>`).join('')}</div>`;
        container.appendChild(section);
    }
}

function toggleRecipeSelect(id) {
    selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id);
    renderCategorized(allRecipes);
}

async function sendSelectedToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    for (const r of toAdd) {
        await _supabase.from('cart').insert([{ items: r.ings.split(',').map(i => i.trim().toLowerCase()), recipe_name: r.name }]);
    }
    alert('Продукты добавлены в список покупок!');
    selectedRecipes.clear();
    switchTab('cart');
}

async function openRecipeById(id) {
    const r = allRecipes.find(x => x.id === id);
    const modal = document.getElementById('recipe-modal');
    modal.style.display = 'block';
    
    const ings = r.ings.split(',').map(i => i.trim().toLowerCase());
    const amounts = r.amounts ? r.amounts.split(',').map(a => parseFloat(a.trim())) : new Array(ings.length).fill(100);
    const { data: prods } = await _supabase.from('products').select('name, price').in('name', ings);
    
    let total = 0;
    const html = ings.map((ing, idx) => {
        const p = prods?.find(item => item.name.toLowerCase() === ing);
        const weight = amounts[idx] || 100;
        const price = p ? Math.round((p.price / 1000) * weight) : 0;
        total += price;
        return `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
            <span>${ing} (${weight}г)</span><b>${price} ₽</b>
        </div>`;
    }).join('');

    document.getElementById('modal-body').innerHTML = `<h3>${r.name}</h3>${html}
        <div style="margin-top:20px; background:#f7f9fb; padding:15px; border-radius:15px; display:flex; justify-content:space-between;">
            <b>Себестоимость:</b><b style="color:var(--primary); font-size:18px;">${total} ₽</b>
        </div>
        <button onclick="closeModal()" style="width:100%; padding:15px; background:#eee; border:none; border-radius:12px; margin-top:15px;">Закрыть</button>`;
}

async function loadCart() {
    const { data: items } = await _supabase.from('cart').select('*');
    if(!items?.length) return document.getElementById('cart-list').innerHTML = '<p style="text-align:center; padding:50px;">Список пуст</p>';
    
    let allIngs = []; items.forEach(i => allIngs = allIngs.concat(i.items));
    const summary = allIngs.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
    const { data: prods } = await _supabase.from('products').select('name, price').in('name', Object.keys(summary));

    let total = 0;
    let html = '<div style="padding:0 20px;"><button onclick="clearCart()" style="width:100%; background:#ff7675; color:white; border:none; padding:15px; border-radius:15px; margin-bottom:20px;">Очистить список</button>';
    
    Object.entries(summary).forEach(([n, c], idx) => {
        const p = prods?.find(x => x.name.toLowerCase() === n);
        const line = (p?.price || 0) * c;
        total += line;
        html += `<div class="card" id="cart-${idx}" onclick="this.classList.toggle('checked-item')" style="padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; width:auto; flex:none;">
            <div><b>${n}</b><br><small>${c} шт/уп</small></div><b>${line} ₽</b>
        </div>`;
    });
    
    html += `<div style="background:var(--primary); color:white; padding:20px; border-radius:20px; margin-top:10px;">Бюджет: <b>${total} ₽</b></div></div>`;
    document.getElementById('cart-list').innerHTML = html;
}

function switchTab(type) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    ['recipe-list-section', 'stock-list-section', 'cart-list-section'].forEach(s => document.getElementById(s).style.display = 'none');
    document.getElementById(`${type}-list-section`).style.display = 'block';
    if(type === 'recipes') loadRecipes();
    if(type === 'cart') loadCart();
}
async function clearCart() { if(confirm('Очистить?')) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
function search(q) { renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))); }
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', () => loadRecipes());
