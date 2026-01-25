const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let recipes = [];
let cartIds = new Set();

async function init() {
    const { data } = await _supabase.from('recipes').select('*');
    recipes = data || [];
    render();
}

function render() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';
    
    // Группировка по категориям
    const cats = [...new Set(recipes.map(r => r.category))];
    cats.forEach(cat => {
        const section = document.createElement('div');
        section.innerHTML = `<h3 style="padding: 10px 20px; margin:0;">${cat}</h3>`;
        const row = document.createElement('div');
        row.className = 'category-row';
        
        recipes.filter(r => r.category === cat).forEach(r => {
            row.innerHTML += `
                <div class="card" onclick="toggle(${r.id})" style="border: 2px solid ${cartIds.has(r.id) ? '#46b8bc' : 'transparent'}">
                    <img src="${r.image_url}" class="card-image" onerror="this.src='https://via.placeholder.com/400x300?text=Нет+фото'">
                    <h4>${r.name}</h4>
                    <p>${r.price} ₽</p>
                </div>`;
        });
        section.appendChild(row);
        container.appendChild(section);
    });

    if(cartIds.size > 0) {
        container.innerHTML += `<button class="main-btn" onclick="toCart()">Собрать продукты (${cartIds.size})</button>`;
    }
}

function toggle(id) {
    cartIds.has(id) ? cartIds.delete(id) : cartIds.add(id);
    render();
}

async function toCart() {
    const selected = recipes.filter(r => cartIds.has(r.id));
    const items = selected.map(r => ({
        dish_name: r.name,
        item_name: r.ings || "",
        price: r.price
    }));
    await _supabase.from('cart').insert(items);
    cartIds.clear();
    showTab('cart');
}

async function loadCart() {
    const { data } = await _supabase.from('cart').select('*');
    const cont = document.getElementById('cart-container');
    cont.innerHTML = '<h2>Ваш список:</h2>';
    if(!data.length) cont.innerHTML += '<p>Пусто</p>';
    data.forEach(i => {
        cont.innerHTML += `<div style="background:white; padding:10px; margin-bottom:10px; border-radius:10px;">
            <b>${i.dish_name}</b><br><small>${i.item_name}</small>
        </div>`;
    });
}

function showTab(t) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(t).classList.add('active');
    if(t === 'cart') loadCart();
}

init();
