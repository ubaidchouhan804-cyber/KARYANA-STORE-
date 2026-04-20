// App State
let state = {
    inventory: [
        { id: 1, name: 'Atta (Flour) 10kg', price: 1200, stock: 5, min: 10 },
        { id: 2, name: 'Basmati Rice 5kg', price: 950, stock: 12, min: 5 },
        { id: 3, name: 'Sugar 1kg', price: 150, stock: 45, min: 20 },
        { id: 4, name: 'Cooking Oil 1L', price: 550, stock: 8, min: 15 },
        { id: 5, name: 'Daal Chana 1kg', price: 220, stock: 3, min: 10 },
        { id: 6, name: 'Tea Leaves 800g', price: 850, stock: 10, min: 5 },
        { id: 7, name: 'Salt 800g', price: 50, stock: 30, min: 10 },
        { id: 8, name: 'Spices Mix 50g', price: 100, stock: 18, min: 15 }
    ],
    cart: [],
    partners: [
        { id: 1, name: 'Ali', investment: 100000, withdrawals: 12000 },
        { id: 2, name: 'Bilal', investment: 100000, withdrawals: 5000 },
        { id: 3, name: 'Zayed', investment: 100000, withdrawals: 15000 }
    ],
    salesToday: 4250,
    totalRevenue: 250000,
    profitMargin: 0.15 // 15% overall profit margin assumption
};

// Format Currency
const formatCurr = (num) => 'Rs. ' + num.toLocaleString();

// DOM Elements
const navLinks = document.querySelectorAll('.nav-links li');
const sections = document.querySelectorAll('.page-section');

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const target = link.getAttribute('data-target');
        sections.forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === target) sec.classList.add('active');
        });
        renderActiveSection(target);
    });
});

function renderActiveSection(section) {
    if (section === 'dashboard') renderDashboard();
    else if (section === 'pos') renderPOS();
    else if (section === 'inventory') renderInventory();
    else if (section === 'ledger') renderLedger();
}

// Dashboard
function renderDashboard() {
    document.getElementById('dash-sales').innerText = formatCurr(state.salesToday);
    const invValue = state.inventory.reduce((sum, item) => sum + (item.price * item.stock), 0);
    document.getElementById('dash-inv-val').innerText = formatCurr(invValue);

    const totalProfit = state.totalRevenue * state.profitMargin;
    document.getElementById('dash-profit').innerText = formatCurr(totalProfit);

    const alertsContainer = document.getElementById('dash-alerts');
    alertsContainer.innerHTML = '';
    const lowStockItems = state.inventory.filter(item => item.stock <= item.min);
    if (lowStockItems.length === 0) {
        alertsContainer.innerHTML = '<p style="color:var(--success); font-weight:500;">All stock levels are optimal.</p>';
    } else {
        lowStockItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'alert-item';
            div.innerText = `⚠️ Low stock for ${item.name} (Only ${item.stock} left)`;
            alertsContainer.appendChild(div);
        });
    }
}

// POS System
function renderPOS() {
    const grid = document.getElementById('pos-grid');
    grid.innerHTML = '';
    state.inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'pos-item-card';
        div.innerHTML = `
            <h4>${item.name}</h4>
            <div class="price">${formatCurr(item.price)}</div>
            <div style="font-size: 0.85rem; color: #64748b; font-weight: 500;">Stock: ${item.stock}</div>
        `;
        div.onclick = () => addToCart(item);
        grid.appendChild(div);
    });
    renderCart();
}

function addToCart(item) {
    if (item.stock <= 0) return alert('Out of stock!');
    const existing = state.cart.find(c => c.id === item.id);
    if (existing) {
        if (existing.qty >= item.stock) return alert('Cannot add more than available stock.');
        existing.qty++;
    } else {
        state.cart.push({ ...item, qty: 1 });
    }
    renderCart();
}

function removeFromCart(id) {
    state.cart = state.cart.filter(c => c.id !== id);
    renderCart();
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    let total = 0;
    state.cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <span>${item.qty} x ${formatCurr(item.price)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <strong>${formatCurr(itemTotal)}</strong>
                <button class="btn btn-remove" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
        cartItems.appendChild(div);
    });
    document.getElementById('cart-total-amt').innerText = formatCurr(total);
}

window.removeFromCart = removeFromCart; // Expose globally for inline onclick

document.getElementById('btn-checkout').onclick = () => {
    if (state.cart.length === 0) return alert('Cart is empty.');
    let totalVal = 0;
    state.cart.forEach(cartItem => {
        const invItem = state.inventory.find(i => i.id === cartItem.id);
        if (invItem) invItem.stock -= cartItem.qty;
        totalVal += (cartItem.price * cartItem.qty);
    });
    state.salesToday += totalVal;
    state.totalRevenue += totalVal;
    state.cart = [];
    alert('Sale completed successfully!');
    renderPOS();
    renderDashboard(); // refresh dashboard in background
};

// Inventory Management
function renderInventory() {
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';
    state.inventory.forEach(item => {
        const tr = document.createElement('tr');
        if (item.stock <= item.min) tr.className = 'low-stock';
        tr.innerHTML = `
            <td>${item.id}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.stock}</td>
            <td>${item.min}</td>
            <td>${formatCurr(item.price)}</td>
            <td>
                <button class="btn" style="padding: 6px 12px; font-size: 0.9rem;" onclick="quickRestock(${item.id})">+10 Stock</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.quickRestock = (id) => {
    const item = state.inventory.find(i => i.id === id);
    if (item) item.stock += 10;
    renderInventory();
    renderDashboard(); // Update alerts if any
}

// Partner Ledger
function renderLedger() {
    const grid = document.getElementById('ledger-grid');
    grid.innerHTML = '';
    const totalProfit = state.totalRevenue * state.profitMargin;
    const equalShare = totalProfit / 3;

    state.partners.forEach(partner => {
        const netBalance = equalShare - partner.withdrawals;
        const div = document.createElement('div');
        div.className = 'partner-card';
        div.innerHTML = `
            <h3>${partner.name} <span style="font-size:1rem; color:#64748b;">(33.3% Share)</span></h3>
            <div class="ledger-row"><span>Initial Investment:</span> <strong>${formatCurr(partner.investment)}</strong></div>
            <div class="ledger-row"><span>Total Profit Share:</span> <strong style="color:var(--success);">${formatCurr(equalShare)}</strong></div>
            <div class="ledger-row"><span>Total Withdrawals:</span> <strong style="color:var(--danger);">${formatCurr(partner.withdrawals)}</strong></div>
            <div class="ledger-row total"><span>Net Payable Balance:</span> <span>${formatCurr(netBalance)}</span></div>
        `;
        grid.appendChild(div);
    });
}

// Chatbot Logic
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const chatWindow = document.getElementById('chat-window');

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerText = text;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function handleChat() {
    const query = chatInput.value.trim().toLowerCase();
    if (!query) return;

    addMessage(chatInput.value, 'user');
    chatInput.value = '';

    setTimeout(() => {
        let response = "I'm your Karyana Assistant. You can ask me about 'restock', 'sales', 'profits', or 'equity'.";

        if (query.includes('restock') || query.includes('low') || query.includes('inventory')) {
            const low = state.inventory.filter(i => i.stock <= i.min).map(i => i.name).join(', ');
            response = low ? `Currently, you are low on: ${low}. You should restock these immediately.` : 'All inventory levels are looking healthy! No urgent restocking needed.';
        } else if (query.includes('sales') || query.includes('today')) {
            response = `Today's total sales are ${formatCurr(state.salesToday)}.`;
        } else if (query.includes('profit') || query.includes('equity') || query.includes('split') || query.includes('partner')) {
            const profit = state.totalRevenue * state.profitMargin;
            response = `The total estimated profit is ${formatCurr(profit)}. Each of the 3 partners has an equal 33.3% share amounting to ${formatCurr(profit/3)}.`;
        } else if (query.includes('hi') || query.includes('hello')) {
            response = "Hello Partner! How can I assist you with the store management today?";
        }

        addMessage(response, 'bot');
    }, 600);
}

btnSend.onclick = handleChat;
chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleChat(); };

// Initial Render
addMessage("Hello! I am your AI assistant for the Karyana Store. Ask me about inventory, profits, or sales.", 'bot');
renderDashboard();
