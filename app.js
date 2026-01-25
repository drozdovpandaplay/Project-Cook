const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];

function getEmoji(cat) {
    const icons = { 'Супы': '🥣', 'Гарниры': '🍚', 'Второе': '🥩', 'Салаты': '🥗', 'Завтраки': '🍳', 'Десерты': '🍰', 'Напитки': '🥤' };
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
    const groups = list.reduce((acc, r) => {
        const cat = r.category || 'Другое';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `<div class="section-header"><div style="font-weight:600; padding:0 20px;">${category}</div></div>
            <div class="category-row">${items.map(r => `
                <div class="card" onclick='openRecipe(${JSON.stringify(r)})'>
                    <div class="card-thumb">${getEmoji(category)}</div>
                    <div class="card-content"><b>${r.name}</b><br><small style="color:var(--primary)">${r.kcal || 0} ккал</small></div>
                </div>`).join('')}</div>`;
        container.appendChild(section);
    }
}

async function openRecipe(r) {
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

    document.getElementById('modal-body').innerHTML = `<h2>${r.name}</h2>${html}
        <div style="margin-top:20px; background:#f7f9fb; padding:15px; border-radius:15px; display:flex; justify-content:space-between;">
            <b>Итого за порцию:</b><b style="color:var(--primary); font-size:20px;">${total} ₽</b>
        </div>
        <button onclick="addToCart('${r.ings}', '${r.name}')" style="width:100%; padding:18px; background:var(--primary); color:white; border:none; border-radius:15px; margin-top:20px; font-weight:600;">🛒 В покупки</button>`;
}

function toggleCheck(id) {
    document.getElementById(id).classList.toggle('checked');
}

async function loadCart() {
    const { data: items } = await _supabase.from('cart').select('*');
    if(!items?.length) return document.getElementById('cart-list').innerHTML = '<p style="text-align:center; padding:50px;">Пусто</p>';
    
    let all = []; items.forEach(i => all = all.concat(i.items));
    const summary = all.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
    const { data: prods } = await _supabase.from('products').select('name, price').in('name', Object.keys(summary));

    let total = 0;
    let html = '<div style="padding:0 20px;"><button onclick="clearCart()" style="width:100%; background:#ff7675; color:white; border:none; padding:15px; border-radius:15px; margin-bottom:20px;">Очистить</button>';
    
    Object.entries(summary).forEach(([n, c], idx) => {
        const p = prods?.find(x => x.name.toLowerCase() === n);
        const line = (p?.price || 0) * c;
        total += line;
        html += `<div class="card" id="item-${idx}" onclick="toggleCheck('item-${idx}')" style="padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; width:auto; flex:none;">
            <div class="item-text"><b>${n}</b><br><small>${c} шт/уп</small></div><b>${line} ₽</b>
        </div>`;
    });
    
    html += `<div style="background:var(--primary); color:white; padding:20px; border-radius:20px; margin-top:10px;">Бюджет: <b>${total} ₽</b></div></div>`;
    document.getElementById('cart-list').innerHTML = html;
}

// Базовые функции (остаются без изменений)
async function addToCart(ings, name) { await _supabase.from('cart').insert([{ items: ings.split(',').map(i => i.trim().toLowerCase()), recipe_name: name }]); alert('Добавлено!'); }
async function clearCart() { if(confirm('Очистить?')) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
function switchTab(type) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    ['recipe-list-section', 'stock-list-section', 'cart-list-section'].forEach(s => document.getElementById(s).style.display = 'none');
    document.getElementById(`${type}-list-section`).style.display = 'block';
    if(type === 'recipes') loadRecipes();
    if(type === 'stock') loadStock();
    if(type === 'cart') loadCart();
}
function search(q) { renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))); }
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', () => loadRecipes());
