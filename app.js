const SB_URL = 'https://fwgxtjkqmslbmnecfhwj.supabase.co';
const SB_KEY = 'sb_publishable_27NdQpJDXhOWC_Y7kzNn7A__xs0jCUi';
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let allRecipes = [];
const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

async function init() {
    const { data } = await _supabase.from('recipes').select('*').order('name');
    allRecipes = data || [];
}

// Переключение разделов
function switchSection(name, el) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.getElementById(name + '-section').style.display = 'block';

    if (name === 'calendar') renderCalendar();
    if (name === 'products') renderProducts();
    if (name === 'inventory') renderInventory();
}

// КАЛЕНДАРЬ
async function renderCalendar() {
    const { data: plan } = await _supabase.from('meal_plan').select('*, recipes(name)');
    const cont = document.getElementById('weekly-planner');
    
    cont.innerHTML = days.map(day => {
        const dPlan = plan.filter(p => p.day_name === day);
        return `
            <div class="calendar-day">
                <strong>${day}</strong>
                <div class="meal-row"><span>🌅 Завтрак:</span> <span>${getMeal(dPlan, 'Завтрак')}</span></div>
                <div class="meal-row"><span>🥣 Обед:</span> <span>${getMeal(dPlan, 'Завтрак')}</span></div>
                <div class="meal-row"><span>🌙 Ужин:</span> <span>${getMeal(dPlan, 'Завтрак')}</span></div>
            </div>
        `;
    }).join('');
}
function getMeal(plan, type) {
    const m = plan.find(p => p.meal_type === type);
    return m ? m.recipes.name : '<span style="color:#ccc">Не запланировано</span>';
}

// БАЗА ПРОДУКТОВ
async function renderProducts(search = '') {
    let query = _supabase.from('products').select('*').order('name');
    if (search) query = query.ilike('name', `%${search}%`);
    const { data } = await query;

    const cont = document.getElementById('products-list');
    cont.innerHTML = data.map(p => `
        <div class="product-item">
            <span style="flex:1">${p.name}</span>
            <input type="number" value="${p.price_per_kg}" onchange="updatePrice(${p.id}, this.value)">
            <small>руб/кг</small>
        </div>
    `).join('');
}

async function updatePrice(id, val) {
    await _supabase.from('products').update({ price_per_kg: val }).eq('id', id);
}

// ... Функции фильтрации категорий и открытия рецептов из предыдущих версий ...

init();
