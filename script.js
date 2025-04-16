// Sample data storage (in a real application, this would be a database)
let users = [];
let inventory = [];
let orders = [];
let currentUser = null;

// OTP related variables
let currentOTP = null;
let registrationData = null;

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load saved credentials
    const savedUsername = localStorage.getItem('username');
    const savedPassword = localStorage.getItem('password');
    
    if (savedUsername && savedPassword) {
        document.getElementById('username').value = savedUsername;
        document.getElementById('password').value = savedPassword;
        document.getElementById('rememberMe').checked = true;
    }

    // Load data from localStorage
    const savedUsers = localStorage.getItem('users');
    const savedInventory = localStorage.getItem('inventory');
    const savedOrders = localStorage.getItem('orders');

    if (savedUsers) {
        users = JSON.parse(savedUsers);
    } else {
        // Initialize with default users if no saved data
        users = [
            { username: 'admin', email: 'admin@example.com', password: 'admin123', type: 'admin' },
            { username: 'customer', email: 'customer@example.com', password: 'customer123', type: 'customer' }
        ];
        saveUsers();
    }

    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    } else {
        // Initialize with default inventory if no saved data
        inventory = [
            { id: 1, name: 'Mouse', price: 10, quantity: 100 },
            { id: 2, name: 'Speaker', price: 20, quantity: 50 }
        ];
        saveInventory();
    }

    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
});

// Save functions
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

function saveOrders() {
    localStorage.setItem('orders', JSON.stringify(orders));
}

// DOM Elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const adminDashboard = document.getElementById('adminDashboard');
const customerDashboard = document.getElementById('customerDashboard');
const adminContent = document.getElementById('adminContent');
const customerContent = document.getElementById('customerContent');

// OTP related elements
const otpSection = document.getElementById('otpSection');
const otpForm = document.getElementById('otpForm');
const resendOTPLink = document.getElementById('resendOTP');
const backToRegisterLink = document.getElementById('backToRegister');

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', handleLogin);
document.getElementById('registerForm').addEventListener('submit', handleRegister);
document.getElementById('registerLink').addEventListener('click', showRegister);
document.getElementById('loginLink').addEventListener('click', showLogin);

// OTP event listeners
otpForm.addEventListener('submit', handleOTPVerification);
resendOTPLink.addEventListener('click', resendOTP);
backToRegisterLink.addEventListener('click', showRegister);

// Functions
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Save credentials if remember me is checked
    if (rememberMe) {
        localStorage.setItem('username', username);
        localStorage.setItem('password', password);
    } else {
        localStorage.removeItem('username');
        localStorage.removeItem('password');
    }

    // Try to find user by username or email
    const user = users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password
    );
    
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
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const userType = document.getElementById('userType').value;

    // Validate email format
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    // Check if username or email already exists
    if (users.some(u => u.username === username)) {
        alert('Username already exists');
        return;
    }
    if (users.some(u => u.email === email)) {
        alert('Email already registered');
        return;
    }

    // Store registration data temporarily
    registrationData = { username, email, password, userType };
    
    // Send OTP
    sendOTP(email);
    
    // Show OTP verification section
    registerSection.style.display = 'none';
    otpSection.style.display = 'block';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

function showInventoryManagement() {
    adminContent.innerHTML = `
        <h3>Manage Inventory</h3>
        <div class="inventory-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="itemName">Item Name:</label>
                    <input type="text" id="itemName" placeholder="Enter item name">
                </div>
                <div class="form-group">
                    <label for="itemPrice">Price:</label>
                    <input type="number" id="itemPrice" placeholder="Enter price" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label for="itemQuantity">Quantity:</label>
                    <input type="number" id="itemQuantity" placeholder="Enter quantity" min="0">
                </div>
            </div>
            <button onclick="addItem()">Add Item</button>
        </div>
        <div class="inventory-list">
            <h4>Current Inventory</h4>
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventory.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>${item.quantity}</td>
                            <td>
                                <button onclick="updateItem(${item.id})">Update</button>
                                <button onclick="deleteItem(${item.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
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
        saveOrders(); // Save orders after status update
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
        saveInventory(); // Save inventory after adding item
        showInventoryManagement();
    }
}

function updateItem(id) {
    const item = inventory.find(i => i.id === id);
    if (item) {
        const newQuantity = prompt('Enter new quantity:', item.quantity);
        if (newQuantity !== null) {
            item.quantity = parseInt(newQuantity);
            saveInventory(); // Save inventory after updating item
            showInventoryManagement();
        }
    }
}

function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(item => item.id !== id);
        saveInventory(); // Save inventory after deleting item
        showInventoryManagement();
    }
}

function viewInventory() {
    customerContent.innerHTML = `
        <h3>Available Products</h3>
        <div class="products-list">
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Available</th>
                        <th>Quantity</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventory.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>${item.quantity}</td>
                            <td>
                                <input type="number" id="quantity-${item.id}" 
                                    min="1" max="${item.quantity}" 
                                    value="1" class="quantity-input">
                            </td>
                            <td>
                                <button onclick="addToCart(${item.id})">Add to Cart</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
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

    // Check if all items in cart have sufficient stock
    for (const cartItem of cart) {
        const inventoryItem = inventory.find(item => item.id === cartItem.id);
        if (!inventoryItem || inventoryItem.quantity < cartItem.quantity) {
            alert(`Not enough stock available for ${cartItem.name}`);
            return;
        }
    }

    // Update inventory quantities
    for (const cartItem of cart) {
        const inventoryItem = inventory.find(item => item.id === cartItem.id);
        if (inventoryItem) {
            inventoryItem.quantity -= cartItem.quantity;
        }
    }

    const order = {
        id: orders.length + 1,
        customer: currentUser.username,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'Pending',
        date: new Date().toLocaleDateString()
    };

    orders.push(order);
    saveInventory(); // Save inventory after order
    saveOrders(); // Save orders after new order
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

function showSales() {
    // Calculate sales data
    const salesData = calculateSalesData();
    
    adminContent.innerHTML = `
        <h3>Sales Report</h3>
        <div class="sales-filters">
            <button onclick="exportToExcel()" class="export-btn">Export to Excel</button>
        </div>
        <div class="sales-table-container">
            <table class="sales-table">
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Total Sold</th>
                        <th>Total Revenue</th>
                        <th>Average Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${salesData.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.totalSold}</td>
                            <td>$${item.totalRevenue.toFixed(2)}</td>
                            <td>$${item.averagePrice.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function calculateSalesData() {
    const salesMap = new Map();
    
    // Initialize sales data for all products
    inventory.forEach(item => {
        salesMap.set(item.id, {
            name: item.name,
            totalSold: 0,
            totalRevenue: 0,
            averagePrice: item.price
        });
    });
    
    // Calculate sales from orders
    orders.forEach(order => {
        order.items.forEach(item => {
            const salesItem = salesMap.get(item.id);
            if (salesItem) {
                salesItem.totalSold += item.quantity;
                salesItem.totalRevenue += item.price * item.quantity;
            }
        });
    });
    
    return Array.from(salesMap.values());
}

function exportToExcel() {
    const salesData = calculateSalesData();
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Product Name,Total Sold,Total Revenue,Average Price\n";
    
    // Add data rows
    salesData.forEach(item => {
        csvContent += `${item.name},${item.totalSold},${item.totalRevenue.toFixed(2)},${item.averagePrice.toFixed(2)}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_report.csv");
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
}

// Generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to email
async function sendOTP(email) {
    try {
        const response = await fetch('http://localhost:3000/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (data.success) {
            alert('OTP has been sent to your email. Please check your inbox.');
        } else {
            alert('Failed to send OTP. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send OTP. Please try again.');
    }
}

async function handleOTPVerification(e) {
    e.preventDefault();
    const enteredOTP = document.getElementById('otp').value;
    const email = registrationData.email;

    try {
        const response = await fetch('http://localhost:3000/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, otp: enteredOTP })
        });

        const data = await response.json();
        if (data.success) {
            // OTP is correct, complete registration
            users.push(registrationData);
            saveUsers();
            alert('Registration successful!');
            showLogin();
        } else {
            // OTP is incorrect
            alert(data.message || 'Invalid OTP. Registration failed.');
            showLogin();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to verify OTP. Please try again.');
    }

    // Clear temporary data
    registrationData = null;
    otpSection.style.display = 'none';
}

function resendOTP(e) {
    e.preventDefault();
    if (registrationData) {
        sendOTP(registrationData.email);
    }
}
