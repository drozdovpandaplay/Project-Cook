const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co'; 
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
let selectedRecipes = new Set();

async function loadRecipes() {
    const { data, error } = await _supabase.from('recipes').select('*').order('category');
    if (error) return console.error("Ошибка:", error);
    allRecipes = data || [];
    renderCategorized(allRecipes);
}

function renderCategorized(list) {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = '';

    if (selectedRecipes.size > 0) {
        container.innerHTML = `<div style="padding: 20px;">
            <button onclick="sendSelectedToCart()" style="width:100%; padding:16px; background:#46b8bc; color:white; border:none; border-radius:15px; font-weight:bold; box-shadow: 0 5px 15px rgba(70,184,188,0.3);">
                🛒 Собрать продукты для ${selectedRecipes.size} блюд
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
        section.innerHTML = `
            <div style="font-weight:bold; padding: 10px 20px; font-size: 14px; color: #636e72;">${category.toUpperCase()}</div>
            <div class="category-row">${items.map(r => `
                <div class="card ${selectedRecipes.has(r.id) ? 'selected-card' : ''}" onclick="toggleRecipeSelect(${r.id})">
                    <div class="badge">${selectedRecipes.has(r.id) ? '✓' : '+'}</div>
                    <div style="font-size:35px; margin-bottom:10px;">🍲</div>
                    <div style="font-weight:bold; font-size:15px; line-height:1.2;">${r.name}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <span style="color:#46b8bc; font-size:13px; font-weight:600;">${r.kcal || 0} ккал</span>
                        <button onclick="event.stopPropagation(); openRecipe(${JSON.stringify(r).replace(/'/g, "&apos;")})" style="background:none; border:none; color:gray; font-size:11px; text-decoration:underline;">Состав</button>
                    </div>
                </div>`).join('')}</div>`;
        container.appendChild(section);
    }
}

function toggleRecipeSelect(id) {
    selectedRecipes.has(id) ? selectedRecipes.delete(id) : selectedRecipes.add(id);
    renderCategorized(allRecipes);
}

async function openRecipe(r) {
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
        return `<div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f1f2f6;">
            <span style="text-transform:capitalize;">${ing} (${weight}г)</span><b>${price} ₽</b>
        </div>`;
    }).join('');

    document.getElementById('modal-body').innerHTML = `
        <h3 style="margin:0 0 15px 0;">${r.name}</h3>
        ${html}
        <div style="margin-top:20px; background:#f7f9fb; padding:15px; border-radius:15px; display:flex; justify-content:space-between; font-weight:bold;">
            <span>Итого (порция):</span><span style="color:#46b8bc">${total} ₽</span>
        </div>
        <button onclick="closeModal()" style="width:100%; padding:15px; background:#eee; border:none; border-radius:12px; margin-top:15px; font-weight:bold;">Закрыть</button>`;
}

async function sendSelectedToCart() {
    const toAdd = allRecipes.filter(r => selectedRecipes.has(r.id));
    for (const r of toAdd) {
        const ings = r.ings ? r.ings.split(',').map(i => i.trim().toLowerCase()) : [];
        await _supabase.from('cart').insert([{ items: ings, recipe_name: r.name }]);
    }
    alert('Продукты добавлены в корзину!');
    selectedRecipes.clear();
    switchTab('cart');
}

async function loadCart() {
    const container = document.getElementById('cart-list');
    const { data: items } = await _supabase.from('cart').select('*');
    
    if(!items || items.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:50px; color:gray;">Список покупок пуст</p>';
        return;
    }

    let allIngs = []; items.forEach(i => allIngs = allIngs.concat(i.items));
    const summary = allIngs.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
    const { data: prods } = await _supabase.from('products').select('name, price').in('name', Object.keys(summary));

    let totalBudget = 0;
    let html = `<div style="padding:20px;">
        <button onclick="clearCart()" style="width:100%; padding:15px; background:#ff7675; color:white; border:none; border-radius:12px; margin-bottom:20px; font-weight:bold;">Очистить всё</button>`;
    
    Object.entries(summary).forEach(([name, count]) => {
        const p = prods?.find(x => x.name.toLowerCase() === name);
        const price = (p?.price || 0) * count;
        totalBudget += price;
        html += `<div class="card" style="width:auto; margin-bottom:10px; flex:none; display:flex; justify-content:space-between; align-items:center;" onclick="this.classList.toggle('checked-item')">
            <div><b style="text-transform:capitalize;">${name}</b><br><small style="color:gray">${count} шт/уп</small></div>
            <b style="font-size:16px;">${price} ₽</b>
        </div>`;
    });

    html += `<div style="background:#46b8bc; color:white; padding:20px; border-radius:20px; margin-top:20px; display:flex; justify-content:space-between; font-weight:bold;">
        <span>Общий бюджет:</span><span>${totalBudget} ₽</span>
    </div></div>`;
    container.innerHTML = html;
}

function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + tab).classList.add('active');
    document.getElementById('recipe-list-section').style.display = tab === 'recipes' ? 'block' : 'none';
    document.getElementById('cart-list-section').style.display = tab === 'cart' ? 'block' : 'none';
    if(tab === 'recipes') loadRecipes();
    if(tab === 'cart') loadCart();
}

async function clearCart() { if(confirm('Удалить всё?')) { await _supabase.from('cart').delete().neq('id', 0); loadCart(); } }
function search(q) { renderCategorized(allRecipes.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))); }
function closeModal() { document.getElementById('recipe-modal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', loadRecipes);
