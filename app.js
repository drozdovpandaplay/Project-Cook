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
        section.innerHTML = `
            <div class="section-header">
                <div class="section-title">${category}</div>
                <span class="count-badge">${items.length}</span>
            </div>
            <div class="category-row">
                ${items.map(r => `
                    <div class="card" onclick='openRecipe(${JSON.stringify(r)})'>
                        <div class="card-thumb">${getEmoji(category)}</div>
                        <div class="card-content">
                            <div class="card-title">${r.name}</div>
                            <div class="card-price">${r.kcal || 0} ккал</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(section);
    }
}

function search(query) {
    const q = query.toLowerCase();
    const filtered = allRecipes.filter(r => r.name.toLowerCase().includes(q) || r.ings.toLowerCase().includes(q));
    renderCategorized(filtered);
}

async function openRecipe(r) {
    const modal = document.getElementById('recipe-modal');
    modal.style.display = 'block';
    const ings = r.ings.split(',').map(i => i.trim().toLowerCase());
    const { data: prods } = await _supabase.from('products').select('name, price').in('name', ings);
    
    let total = 0;
    const html = ings.map(ing => {
        const p = prods?.find(item => item.name.toLowerCase() === ing);
        total += p ? p.price : 0;
        return `<div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f1f2f6;">
            <span style="text-transform:capitalize;">${ing}</span><b>${p ? p.price + ' ₽' : '—'}</b>
        </div>`;
    }).join('');

    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin-top:0;">${r.name}</h2>
        <div style="margin: 20px 0;">${html}</div>
        <div style="background:#f7f9fb; padding:20px; border-radius:20px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:600;">Себестоимость:</span>
            <span style="font-size:22px; font-weight:bold; color:var(--primary);">${total} ₽</span>
        </div>
        <button onclick="addToCart('${r.ings}', '${r.name}')" style="width:100%; padding:18px; background:var(--primary); color:white; border:none; border-radius:15px; margin-top:20px; font-weight:600; font-size:16px;">🛒 Добавить в покупки</button>
    `;
}

async function addToCart(ings, name) {
    await _supabase.from('cart').insert([{ items: ings.split(',').map(i => i.trim().toLowerCase()), recipe_name: name }]);
    alert('Ингредиенты добавлены в корзину!');
    closeModal();
}

async function loadStock() {
    const { data } = await _supabase.from('products').select('*').order('category');
    const cats = [...new Set(data.map(i => i.category || 'Прочее'))];
    document.getElementById('stock-list').innerHTML = cats.map(cat => `
        <div style="padding:0 20px;">
            <h4 style="color:var(--primary); margin:20px 0 10px; border-left:4px solid var(--primary); padding-left:10px;">${cat}</h4>
            ${data.filter(i => i.category === cat).map(p => `
                <div class="card" style="display:flex; justify-content:space-between; padding:15px; margin-bottom:10px; width:auto; flex:none;">
                    <span style="font-weight:600;">${p.name}</span>
                    <div><b>${p.price} ₽</b> <button onclick="editPrice(${p.id}, '${p.name}', ${p.price})" style="border:none; background:none; font-size:16px; cursor:pointer;">✏️</button></div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

async function editPrice(id, name, old) {
    const val = prompt(`Новая цена для ${name}:`, old);
    if(val && !isNaN(val)) {
        await _supabase.from('products').update({ price: parseInt(val) }).eq('id', id);
        loadStock();
    }
}

async function loadCart() {
    const { data: items } = await _supabase.from('cart').select('*');
    if(!items?.length) return document.getElementById('cart-list').innerHTML = '<p style="text-align:center; padding:50px; color:#b2bec3;">Список покупок пуст</p>';
    
    let all = []; items.forEach(i => all = all.concat(i.items));
    const summary = all.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
    const { data: prods } = await _supabase.from('products').select('name, price').in('name', Object.keys(summary));

    let total = 0;
    let html = '<div style="padding:0 20px;"><button onclick="clearCart()" style="width:100%; background:#ff7675; color:white; border:none; padding:15px; border-radius:15px; margin-bottom:20px; font-weight:600;">Очистить всё</button>';
    for (let [n, c] of Object.entries(summary)) {
        const p = prods?.find(x => x.name.toLowerCase() === n);
        const line = (p?.price || 0) * c;
        total += line;
        html += `<div class="card" style="padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; width:auto; flex:none;">
            <div><div style="font-weight:600; text-transform:capitalize;">${n}</div><div style="font-size:12px; color:#636e72;">${c} шт. x ${p?.price || 0} ₽</div></div>
            <b style="font-size:16px;">${line} ₽</b>
        </div>`;
    }
    html += `<div style="background:linear-gradient(135deg, var(--primary), #3498db); color:white; padding:25px; border-radius:25px; margin-top:20px; box-shadow:0 10px 20px rgba(70,184,188,0.3);">
        <div style="opacity:0.8; font-size:14px;">Итого к оплате:</div>
        <div style="font-size:32px; font-weight:bold;">${total} ₽</div>
    </div></div>`;
    document.getElementById('cart-list').innerHTML = html;
}

async function clearCart() { if(confirm('Очистить список покупок?')) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
function switchTab(type) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    ['recipe-list-section', 'stock-list-section', 'cart-list-section'].forEach(s => document.getElementById(s).style.display = 'none');
    document.getElementById(`${type}-list-section`).style.display = 'block';
    if(type === 'recipes') loadRecipes();
    if(type === 'stock') loadStock();
    if(type === 'cart') loadCart();
}
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', () => loadRecipes());
