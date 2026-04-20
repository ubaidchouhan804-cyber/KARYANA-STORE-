// App State
// Start fully empty as requested
let state = {
    inventory: [],
    cart: [],
    partners: [],
    salesToday: 0,
    totalRevenue: 0,
    profitMargin: 0.15 
};

// Format Currency
const formatCurr = (num) => 'Rs. ' + Number(num).toLocaleString();

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

// ====== DASHBOARD LOGIC ======
function renderDashboard() {
    document.getElementById('dash-sales').innerText = formatCurr(state.salesToday);
    
    const invValue = state.inventory.reduce((sum, item) => sum + (item.price * item.stock), 0);
    document.getElementById('dash-inv-val').innerText = formatCurr(invValue);

    const totalProfit = state.totalRevenue * state.profitMargin;
    document.getElementById('dash-profit').innerText = formatCurr(totalProfit);

    const alertsContainer = document.getElementById('dash-alerts');
    alertsContainer.innerHTML = '';
    
    if (state.inventory.length === 0) {
        alertsContainer.innerHTML = '<div class="empty-state" style="margin:0; padding:15px;">No products to monitor yet. Store is entirely empty.</div>';
        return;
    }

    const lowStockItems = state.inventory.filter(item => item.stock <= item.min);
    if (lowStockItems.length === 0) {
        alertsContainer.innerHTML = '<div style="color:var(--success); font-weight:800; font-size:18px;">ALL STOCK OPTIMAL</div>';
    } else {
        lowStockItems.forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = 'background:var(--danger); color:var(--white); padding:10px 15px; margin-bottom:10px; font-weight:bold; border-radius:4px;';
            div.innerText = `⚠️ IMMEDIATE RESTOCK: ${item.name} (Only ${item.stock} left out of ${item.min} minimum!)`;
            alertsContainer.appendChild(div);
        });
    }
}

// ====== INVENTORY LOGIC ======
window.addProduct = function() {
    const nameInput = document.getElementById('new-item-name');
    const priceInput = document.getElementById('new-item-price');
    const minInput = document.getElementById('new-item-min');

    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const min = parseInt(minInput.value);

    // Basic Validation
    if(!name || isNaN(price) || isNaN(min)) {
        alert("Please enter valid product details!");
        return;
    }

    state.inventory.push({
        id: Date.now(),
        name: name,
        price: price,
        stock: 0, // Physical stock begins at 0 logically.
        min: min
    });

    // Clear inputs
    nameInput.value = '';
    priceInput.value = '';
    minInput.value = '';
    
    // Rerender specific views
    renderInventory();
    renderDashboard();
}

window.deleteProduct = function(id) {
    if(confirm("Are you sure you want to delete this product entirely from the system?")) {
        state.inventory = state.inventory.filter(item => item.id !== id);
        // Clean out active cart/bill as well to prevent reference errors
        state.cart = state.cart.filter(c => c.id !== id);
        renderInventory();
        renderDashboard();
        renderPOS();
    }
}

window.quickRestock = (id) => {
    const item = state.inventory.find(i => i.id === id);
    if (item) item.stock += 10; // Physically adds 10 to shelf
    renderInventory();
    renderDashboard();
}

function renderInventory() {
    const tbody = document.getElementById('inventory-tbody');
    const emptyState = document.getElementById('inventory-empty-state');
    const table = document.getElementById('inventory-table');
    
    tbody.innerHTML = '';
    
    if (state.inventory.length === 0) {
        emptyState.style.display = 'block';
        table.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    table.style.display = 'table';

    state.inventory.forEach(item => {
        const tr = document.createElement('tr');
        if (item.stock <= item.min) tr.className = 'low-stock';
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td style="font-size:18px; font-weight:800;">${item.stock}</td>
            <td>${item.min}</td>
            <td>${formatCurr(item.price)}</td>
            <td>
                <button class="btn btn-restock" style="padding: 6px 12px; font-size: 12px;" onclick="quickRestock(${item.id})">+10 Stock</button>
                <button class="btn btn-delete" style="padding: 6px 12px; font-size: 12px; margin-left: 5px;" onclick="deleteProduct(${item.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ====== PARTNER LOGIC ======
window.addPartner = function() {
    const nameInput = document.getElementById('new-partner-name');
    const invInput = document.getElementById('new-partner-inv');

    const name = nameInput.value.trim();
    const inv = parseFloat(invInput.value);

    // Basic Validation
    if(!name || isNaN(inv)) {
        alert("Please enter valid partner details!");
        return;
    }

    state.partners.push({
        id: Date.now(),
        name: name,
        investment: inv,
        withdrawals: 0
    });

    nameInput.value = '';
    invInput.value = '';
    
    renderLedger();
}

window.deletePartner = function(id) {
    if(confirm("Are you sure you want to remove this partner from the ledger?")) {
        state.partners = state.partners.filter(p => p.id !== id);
        renderLedger();
    }
}

function renderLedger() {
    const grid = document.getElementById('ledger-grid');
    const emptyState = document.getElementById('ledger-empty-state');
    grid.innerHTML = '';
    
    if (state.partners.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const totalProfit = state.totalRevenue * state.profitMargin;
    // Mathematically split perfectly
    const sharePercentage = (100 / state.partners.length).toFixed(1);
    const equalShare = totalProfit / state.partners.length;

    state.partners.forEach(partner => {
        const netBalance = partner.investment + equalShare - partner.withdrawals;
        const div = document.createElement('div');
        div.className = 'partner-card';
        div.innerHTML = `
            <h3>${partner.name}
               <button class="btn btn-delete" style="padding: 4px 8px; font-size: 12px;" onclick="deletePartner(${partner.id})">Remove</button>
            </h3>
            <div style="font-size:14px; color:var(--orange); font-weight:800; margin-bottom:10px;">Equity Share: ${sharePercentage}%</div>
            <div class="ledger-row"><span>Investment:</span> <strong>${formatCurr(partner.investment)}</strong></div>
            <div class="ledger-row"><span>Profit Share:</span> <strong>${formatCurr(equalShare)}</strong></div>
            <div class="ledger-row"><span>Drawings:</span> <strong style="color:var(--danger);">${formatCurr(partner.withdrawals)}</strong></div>
            <div class="ledger-row total"><span>Net Equity:</span> <span>${formatCurr(netBalance)}</span></div>
        `;
        grid.appendChild(div);
    });
}

// ====== POINT OF SALE LOGIC ======
function renderPOS() {
    const grid = document.getElementById('pos-grid');
    const emptyState = document.getElementById('pos-empty-state');
    grid.innerHTML = '';
    
    // Handle empty inventory inside physical POS environment
    if (state.inventory.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        state.inventory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'pos-item-card';
            div.innerHTML = `
                <h4>${item.name}</h4>
                <div class="price">${formatCurr(item.price)}</div>
                <div style="font-size: 14px; color: #555; font-weight: 700;">In Stock: <span style="color:${item.stock > 0 ? "var(--success)" : "var(--danger)"}">${item.stock}</span></div>
            `;
            // Trigger cart function
            div.onclick = () => addToCart(item);
            grid.appendChild(div);
        });
    }
    renderCart();
}

function addToCart(item) {
    if (item.stock <= 0) return alert('Physical stock is completely empty on the shelf! Cannot ring up.');
    const existing = state.cart.find(c => c.id === item.id);
    if (existing) {
        if (existing.qty >= item.stock) return alert('Cannot ring up more quantities than physically available.');
        existing.qty++;
    } else {
        state.cart.push({ ...item, qty: 1 });
    }
    renderCart();
}

window.removeFromCart = function(id) {
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
        div.className = 'bill-item';
        div.innerHTML = `
            <div>
                <strong style="display:block; font-size:16px;">${item.name}</strong>
                <span style="color:#666; font-weight:bold;">${item.qty} x ${formatCurr(item.price)}</span>
            </div>
            <div style="text-align:right;">
                <strong style="display:block; font-size:16px;">${formatCurr(itemTotal)}</strong>
                <button class="btn btn-delete" style="padding: 2px 6px; font-size: 10px; margin-top:5px;" onclick="removeFromCart(${item.id})">REMOVE</button>
            </div>
        `;
        cartItems.appendChild(div);
    });
    
    document.getElementById('cart-total-amt').innerText = formatCurr(total);
}

// Print Bill / Process payment physically
document.getElementById('btn-checkout').onclick = () => {
    if (state.cart.length === 0) return alert('No items scanned in the bill.');
    
    let totalVal = 0;
    state.cart.forEach(cartItem => {
        // Find main physical item and deduct directly
        const invItem = state.inventory.find(i => i.id === cartItem.id);
        if (invItem) invItem.stock -= cartItem.qty;
        totalVal += (cartItem.price * cartItem.qty);
    });
    
    // Add logic to store today's total metrics
    state.salesToday += totalVal;
    state.totalRevenue += totalVal;
    
    // Empty current customer's bill
    state.cart = [];
    alert('Sale completely processed! Register drawer opens.');
    
    // Re-render components with newly impacted numbers
    renderPOS();
    renderDashboard();
    renderLedger(); 
};

// ====== CHATBOT LOGIC ======
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

    // Simulating AI computation
    setTimeout(() => {
        let response = "I am the intelligent Shop Manager Analytics Bot! I monitor everything. You can ask me regarding the specific state of our partners, inventory alerts, or total physical sales.";

        if (query.includes('restock') || query.includes('low') || query.includes('inventory')) {
            const low = state.inventory.filter(i => i.stock <= i.min).map(i => i.name).join(', ');
            response = low ? `URGENT WARNING: You critically need to physically restock: ${low}.` : 'Stock is completely satisfactory right now!';
            if(state.inventory.length === 0) response = "There is no physical stock installed into the POS whatsoever.";
        } else if (query.includes('sales') || query.includes('today')) {
            response = `Total counter sales today equal out to exactly ${formatCurr(state.salesToday)}.`;
        } else if (query.includes('profit') || query.includes('equity') || query.includes('partner') || query.includes('split')) {
            if (state.partners.length === 0) {
                response = "There are zero partners officially registered into the system to split the total daily revenue with.";
            } else {
                const profit = state.totalRevenue * state.profitMargin;
                response = `Current Estimated Working Profit is ${formatCurr(profit)}. It automatically splits down to ${formatCurr(profit/state.partners.length)} per partner amongst the exactly ${state.partners.length} registered system partners.`;
            }
        }

        addMessage(response, 'bot');
    }, 600);
}

btnSend.onclick = handleChat;
chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleChat(); };

// Initial Boot Processes
addMessage("System Online. Store is ready for physical sales. Remember: Add Initial Products & Partners FIRST.", 'bot');
renderDashboard();
renderInventory();
renderLedger();
renderPOS();
