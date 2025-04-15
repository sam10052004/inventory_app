// Sample data storage (in a real application, this would be a database)
let users = [
    { username: 'admin', password: 'admin123', type: 'admin' },
    { username: 'customer', password: 'customer123', type: 'customer' }
];

let inventory = [
    { id: 1, name: 'Product 1', price: 10, quantity: 100 },
    { id: 2, name: 'Product 2', price: 20, quantity: 50 }
];

let orders = [];
let currentUser = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const adminDashboard = document.getElementById('adminDashboard');
const customerDashboard = document.getElementById('customerDashboard');
const adminContent = document.getElementById('adminContent');
const customerContent = document.getElementById('customerContent');

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', handleLogin);
document.getElementById('registerForm').addEventListener('submit', handleRegister);
document.getElementById('registerLink').addEventListener('click', showRegister);
document.getElementById('loginLink').addEventListener('click', showLogin);

// Functions
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        loginSection.style.display = 'none';
        if (user.type === 'admin') {
            adminDashboard.style.display = 'block';
            showInventoryManagement();
        } else {
            customerDashboard.style.display = 'block';
            viewInventory();
        }
    } else {
        alert('Invalid credentials');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const userType = document.getElementById('userType').value;

    if (users.some(u => u.username === username)) {
        alert('Username already exists');
        return;
    }

    users.push({ username, password, type: userType });
    alert('Registration successful!');
    showLogin();
}

function showRegister() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
}

function showLogin() {
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
}

function logout() {
    // Clear current user
    currentUser = null;
    
    // Hide all sections
    adminDashboard.style.display = 'none';
    customerDashboard.style.display = 'none';
    
    // Clear any forms
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    
    // Show login section
    loginSection.style.display = 'block';
    
    // Clear any content
    adminContent.innerHTML = '';
    customerContent.innerHTML = '';
    
    // Clear cart if exists
    if (typeof cart !== 'undefined') {
        cart = [];
    }
}

// Admin Functions
function showInventoryManagement() {
    adminContent.innerHTML = `
        <h3>Manage Inventory</h3>
        <div class="inventory-form">
            <input type="text" id="itemName" placeholder="Item Name">
            <input type="number" id="itemPrice" placeholder="Price">
            <input type="number" id="itemQuantity" placeholder="Quantity">
            <button onclick="addItem()">Add Item</button>
        </div>
        <div class="inventory-list">
            <h4>Current Inventory</h4>
            <table>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                </tr>
                ${inventory.map(item => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>$${item.price}</td>
                        <td>${item.quantity}</td>
                        <td>
                            <button onclick="updateItem(${item.id})">Update</button>
                            <button onclick="deleteItem(${item.id})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
}

function showOrders() {
    adminContent.innerHTML = `
        <h3>All Customer Orders</h3>
        <div class="order-filters">
            <select id="orderStatusFilter" onchange="filterOrders()">
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
            </select>
            <input type="text" id="customerSearch" placeholder="Search by customer name" onkeyup="filterOrders()">
        </div>
        <div class="orders-table-container">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="ordersTableBody">
                    ${orders.map(order => `
                        <tr>
                            <td>${order.id}</td>
                            <td>${order.customer}</td>
                            <td>${order.date || 'N/A'}</td>
                            <td>
                                <ul>
                                    ${order.items.map(item => `
                                        <li>${item.name} (${item.quantity}) - $${item.price * item.quantity}</li>
                                    `).join('')}
                                </ul>
                            </td>
                            <td>$${order.total}</td>
                            <td>
                                <select onchange="updateOrderStatus(${order.id}, this.value)">
                                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                    <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </td>
                            <td>
                                <button onclick="viewOrderDetails(${order.id})">View Details</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div id="orderDetailsModal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close" onclick="closeOrderDetails()">&times;</span>
                <div id="orderDetailsContent"></div>
            </div>
        </div>
    `;
}

function filterOrders() {
    const statusFilter = document.getElementById('orderStatusFilter').value;
    const customerSearch = document.getElementById('customerSearch').value.toLowerCase();
    
    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesCustomer = order.customer.toLowerCase().includes(customerSearch);
        return matchesStatus && matchesCustomer;
    });

    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.date || 'N/A'}</td>
            <td>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} (${item.quantity}) - $${item.price * item.quantity}</li>
                    `).join('')}
                </ul>
            </td>
            <td>$${order.total}</td>
            <td>
                <select onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <button onclick="viewOrderDetails(${order.id})">View Details</button>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        alert(`Order ${orderId} status updated to ${newStatus}`);
    }
}

function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        const modal = document.getElementById('orderDetailsModal');
        const content = document.getElementById('orderDetailsContent');
        
        content.innerHTML = `
            <h3>Order Details #${order.id}</h3>
            <div class="order-details">
                <p><strong>Customer:</strong> ${order.customer}</p>
                <p><strong>Date:</strong> ${order.date || 'N/A'}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <h4>Items:</h4>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} - Quantity: ${item.quantity} - Price: $${item.price} - Total: $${item.price * item.quantity}</li>
                    `).join('')}
                </ul>
                <p><strong>Total Amount:</strong> $${order.total}</p>
            </div>
        `;
        
        modal.style.display = 'block';
    }
}

function closeOrderDetails() {
    document.getElementById('orderDetailsModal').style.display = 'none';
}

function addItem() {
    const name = document.getElementById('itemName').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const quantity = parseInt(document.getElementById('itemQuantity').value);

    if (name && price && quantity) {
        const newItem = {
            id: inventory.length + 1,
            name,
            price,
            quantity
        };
        inventory.push(newItem);
        showInventoryManagement();
    }
}

function updateItem(id) {
    const item = inventory.find(i => i.id === id);
    if (item) {
        const newQuantity = prompt('Enter new quantity:', item.quantity);
        if (newQuantity !== null) {
            item.quantity = parseInt(newQuantity);
            showInventoryManagement();
        }
    }
}

function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(item => item.id !== id);
        showInventoryManagement();
    }
}

// Customer Functions
function viewInventory() {
    customerContent.innerHTML = `
        <h3>Available Products</h3>
        <table>
            <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Action</th>
            </tr>
            ${inventory.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>$${item.price}</td>
                    <td>${item.quantity}</td>
                    <td>
                        <input type="number" id="quantity-${item.id}" min="1" max="${item.quantity}" value="1">
                        <button onclick="addToCart(${item.id})">Add to Cart</button>
                    </td>
                </tr>
            `).join('')}
        </table>
        <div id="cart">
            <h4>Shopping Cart</h4>
            <div id="cartItems"></div>
            <button onclick="placeOrder()">Place Order</button>
        </div>
    `;
}

let cart = [];

function addToCart(itemId) {
    const item = inventory.find(i => i.id === itemId);
    const quantity = parseInt(document.getElementById(`quantity-${itemId}`).value);
    
    if (quantity > item.quantity) {
        alert('Not enough stock available');
        return;
    }

    const cartItem = cart.find(i => i.id === itemId);
    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: quantity
        });
    }

    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = cart.map(item => `
        <div>
            ${item.name} - $${item.price} x ${item.quantity}
            <button onclick="removeFromCart(${item.id})">Remove</button>
        </div>
    `).join('');
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
}

function placeOrder() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }

    const order = {
        id: orders.length + 1,
        customer: document.getElementById('username').value,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'Pending'
    };

    orders.push(order);
    cart = [];
    alert('Order placed successfully!');
    viewOrders();
}

function viewOrders() {
    const customerUsername = currentUser.username;
    const customerOrders = orders.filter(order => order.customer === customerUsername);
    
    customerContent.innerHTML = `
        <h3>My Orders</h3>
        <div class="orders-table-container">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${customerOrders.map(order => `
                        <tr>
                            <td>${order.id}</td>
                            <td>${order.date || 'N/A'}</td>
                            <td>
                                <ul>
                                    ${order.items.map(item => `
                                        <li>${item.name} (${item.quantity}) - $${item.price * item.quantity}</li>
                                    `).join('')}
                                </ul>
                            </td>
                            <td>$${order.total}</td>
                            <td>${order.status}</td>
                            <td>
                                <button onclick="viewOrderDetails(${order.id})">View Details</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div id="orderDetailsModal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close" onclick="closeOrderDetails()">&times;</span>
                <div id="orderDetailsContent"></div>
            </div>
        </div>
    `;
}