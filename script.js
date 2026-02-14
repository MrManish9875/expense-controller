// Global variables
let currentUser = null;
let transactions = [];
let expenseChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initDatabase();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add any global event listeners here
}

// Initialize database (using localStorage)
function initDatabase() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }
}

// Show register form
function showRegister() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
}

// Show login form
function showLogin() {
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

// Register new user
function register() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const income = parseFloat(document.getElementById('reg-income').value);

    // Validation
    if (!username || !password || !email || !income) {
        showNotification('All fields are required!', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters!', 'error');
        return;
    }

    if (income <= 0) {
        showNotification('Please enter a valid income amount!', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users'));
    
    if (users.find(u => u.username === username)) {
        showNotification('Username already exists!', 'error');
        return;
    }

    const newUser = {
        id: Date.now(), // Use timestamp as unique ID
        username,
        password,
        email,
        monthlyIncome: income
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showNotification('Registration successful! Please login.', 'success');
    
    // Clear registration form
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-income').value = '';
    
    showLogin();
}

// Login user
function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        showNotification('Please enter username and password!', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-dashboard').style.display = 'block';
        document.getElementById('welcome-user').textContent = `Welcome, ${user.username}!`;
        
        // Set today's date in date input
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('trans-date').value = today;
        
        // Set current year in report
        document.getElementById('report-year').value = new Date().getFullYear();
        
        // Load all data
        loadTransactions();
        updateDashboard();
        updatePredictions();
        
        showNotification('Login successful!', 'success');
    } else {
        showNotification('Invalid username or password!', 'error');
    }
}

// Logout user
function logout() {
    currentUser = null;
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('main-dashboard').style.display = 'none';
    
    // Clear login form
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    
    showNotification('Logged out successfully!', 'info');
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-btn').classList.add('active');
    
    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Refresh data when switching to specific tabs
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'predictor') {
        updatePredictions();
    }
}

// Add transaction
function addTransaction() {
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        return;
    }

    const type = document.getElementById('trans-type').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('trans-date').value;
    const description = document.getElementById('description').value.trim();

    // Validation
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount!', 'error');
        return;
    }

    if (!date) {
        showNotification('Please select a date!', 'error');
        return;
    }

    const transactions = JSON.parse(localStorage.getItem('transactions'));
    
    const newTransaction = {
        id: Date.now(),
        userId: currentUser.id,
        date,
        category,
        amount,
        type,
        description: description || 'No description'
    };

    transactions.push(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Clear form
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('trans-type').value = 'expense';
    document.getElementById('category').value = 'Food';
    
    showNotification('Transaction added successfully!', 'success');
    
    // Refresh data
    loadTransactions();
    updateDashboard();
    updatePredictions();
}

// Load recent transactions
function loadTransactions() {
    if (!currentUser) return;

    const allTransactions = JSON.parse(localStorage.getItem('transactions'));
    const userTransactions = allTransactions
        .filter(t => t.userId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';

    if (userTransactions.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="5" style="text-align: center;">No transactions found</td>';
        return;
    }

    userTransactions.forEach(t => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${formatDate(t.date)}</td>
            <td><span class="badge ${t.type}">${t.type.toUpperCase()}</span></td>
            <td>${t.category}</td>
            <td>₹${t.amount.toFixed(2)}</td>
            <td>${t.description || '-'}</td>
        `;
    });
}

// Get summary
function getSummary() {
    if (!currentUser) return { totalIncome: 0, totalExpense: 0, balance: 0 };

    const allTransactions = JSON.parse(localStorage.getItem('transactions'));
    const userTransactions = allTransactions.filter(t => t.userId === currentUser.id);
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    userTransactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }
    });
    
    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense
    };
}

// Update dashboard
function updateDashboard() {
    if (!currentUser) return;

    const summary = getSummary();
    
    document.getElementById('total-income').textContent = `₹${summary.totalIncome.toFixed(2)}`;
    document.getElementById('total-expense').textContent = `₹${summary.totalExpense.toFixed(2)}`;
    document.getElementById('balance').textContent = `₹${summary.balance.toFixed(2)}`;
    
    updateExpenseChart();
}

// Update expense chart
function updateExpenseChart() {
    if (!currentUser) return;

    const allTransactions = JSON.parse(localStorage.getItem('transactions'));
    const userTransactions = allTransactions.filter(t => t.userId === currentUser.id && t.type === 'expense');
    
    const categoryTotals = {};
    userTransactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    if (categories.length > 0) {
        expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Category-wise Expenses',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    } else {
        // Show empty chart message
        ctx.font = '14px Poppins';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('No expense data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
}

// Update predictions
function updatePredictions() {
    if (!currentUser) return;

    const allTransactions = JSON.parse(localStorage.getItem('transactions'));
    const userTransactions = allTransactions.filter(t => t.userId === currentUser.id && t.type === 'expense');
    
    // Group by month
    const monthlyExpenses = {};
    userTransactions.forEach(t => {
        const month = t.date.substring(0, 7); // YYYY-MM format
        monthlyExpenses[month] = (monthlyExpenses[month] || 0) + t.amount;
    });
    
    const monthlyTotals = Object.values(monthlyExpenses);
    const predictions = [];
    
    if (monthlyTotals.length > 0) {
        const avgExpense = monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length;
        const monthlyIncome = currentUser.monthlyIncome;
        
        for (let i = 0; i < 3; i++) {
            let predictedExpense = avgExpense;
            
            if (monthlyTotals.length > 1) {
                // Calculate trend based on last 2 months
                const months = Object.keys(monthlyExpenses).sort();
                const lastMonth = monthlyExpenses[months[months.length - 1]];
                const prevMonth = monthlyExpenses[months[months.length - 2]];
                const trend = (lastMonth - prevMonth) / 2;
                predictedExpense = avgExpense + (trend * (i + 1));
            }
            
            const predictedSaving = Math.max(monthlyIncome - predictedExpense, 0);
            predictions.push(predictedSaving);
        }
    } else {
        predictions.push(currentUser.monthlyIncome * 0.2, // Assume 20% savings
                        currentUser.monthlyIncome * 0.2,
                        currentUser.monthlyIncome * 0.2);
    }
    
    // Display predictions
    const predictionsDiv = document.getElementById('predictions');
    predictionsDiv.innerHTML = '';
    
    const monthNames = ['Next Month', 'In 2 Months', 'In 3 Months'];
    
    predictions.forEach((pred, i) => {
        const predItem = document.createElement('div');
        predItem.className = 'prediction-item';
        
        // Determine color based on prediction
        let bgColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        if (pred < 1000) {
            bgColor = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        } else if (pred > 5000) {
            bgColor = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
        }
        
        predItem.style.background = bgColor;
        
        predItem.innerHTML = `
            <h4>${monthNames[i]}</h4>
            <p>₹${pred.toFixed(2)}</p>
            <small>Predicted Savings</small>
        `;
        predictionsDiv.appendChild(predItem);
    });
    
    // Show warning if needed
    const warningDiv = document.getElementById('warning-message');
    if (predictions[0] < 1000) {
        warningDiv.style.display = 'block';
        warningDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> WARNING: Your predicted savings are low! Consider reducing expenses.';
    } else {
        warningDiv.style.display = 'none';
    }
}

// Generate PDF report
function generateReport() {
    if (!currentUser) return;

    const month = document.getElementById('report-month').value;
    const year = document.getElementById('report-year').value;
    
    const monthNames = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    
    const monthNum = monthNames[month];
    const searchPattern = `${year}-${monthNum}`;
    
    const allTransactions = JSON.parse(localStorage.getItem('transactions'));
    const monthTransactions = allTransactions.filter(t => {
        return t.userId === currentUser.id && 
               t.date.startsWith(searchPattern);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (monthTransactions.length === 0) {
        showNotification('No transactions found for this month!', 'warning');
        return;
    }
    
    // Update preview
    const preview = document.getElementById('report-preview');
    let previewText = `EXPENSE REPORT - ${month} ${year}\n`;
    previewText += '='.repeat(60) + '\n\n';
    previewText += `User: ${currentUser.username}\n`;
    previewText += `Email: ${currentUser.email}\n`;
    previewText += `Generated: ${new Date().toLocaleString()}\n`;
    previewText += '='.repeat(60) + '\n\n';
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    monthTransactions.forEach((t, index) => {
        previewText += `Transaction #${index + 1}\n`;
        previewText += `Date: ${formatDate(t.date)}\n`;
        previewText += `Category: ${t.category}\n`;
        previewText += `Type: ${t.type.toUpperCase()}\n`;
        previewText += `Amount: ₹${t.amount.toFixed(2)}\n`;
        previewText += `Description: ${t.description || 'N/A'}\n`;
        previewText += '-'.repeat(40) + '\n';
        
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }
    });
    
    previewText += '\n' + '='.repeat(60) + '\n';
    previewText += `SUMMARY\n`;
    previewText += '='.repeat(60) + '\n';
    previewText += `Total Income:  ₹${totalIncome.toFixed(2)}\n`;
    previewText += `Total Expense: ₹${totalExpense.toFixed(2)}\n`;
    previewText += `Net Savings:   ₹${(totalIncome - totalExpense).toFixed(2)}\n`;
    previewText += '='.repeat(60) + '\n';
    
    preview.textContent = previewText;
    
    // Generate PDF using jsPDF
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.setTextColor(102, 126, 234);
        doc.text('Smar Expense & Saving Predictor', 105, 20, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(`Expense Report - ${month} ${year}`, 105, 35, { align: 'center' });
        
        // User Info
        doc.setFontSize(12);
        doc.text(`User: ${currentUser.username}`, 20, 50);
        doc.text(`Email: ${currentUser.email}`, 20, 60);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 70);
        
        // Summary
        doc.setFontSize(14);
        doc.setTextColor(46, 204, 113);
        doc.text('Summary', 20, 90);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 30, 105);
        doc.text(`Total Expense: ₹${totalExpense.toFixed(2)}`, 30, 115);
        
        doc.setFontSize(14);
        if (totalIncome - totalExpense >= 0) {
            doc.setTextColor(46, 204, 113);
        } else {
            doc.setTextColor(231, 76, 60);
        }
        doc.text(`Net Savings: ₹${(totalIncome - totalExpense).toFixed(2)}`, 30, 130);
        
        // Transactions Table
        doc.setFontSize(14);
        doc.setTextColor(102, 126, 234);
        doc.text('Transaction Details', 20, 150);
        
        const tableData = monthTransactions.map(t => [
            formatDate(t.date),
            t.category,
            t.type.toUpperCase(),
            `₹${t.amount.toFixed(2)}`,
            t.description?.substring(0, 20) || '-'
        ]);
        
        doc.autoTable({
            startY: 160,
            head: [['Date', 'Category', 'Type', 'Amount', 'Description']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [102, 126, 234],
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 10,
                cellPadding: 5
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 35 },
                2: { cellWidth: 25 },
                3: { cellWidth: 30 },
                4: { cellWidth: 60 }
            }
        });
        
        // Save PDF
        doc.save(`expense_report_${month}_${year}.pdf`);
        
        showNotification('PDF Report generated successfully!', 'success');
        
    } catch (error) {
        console.error('PDF Generation Error:', error);
        showNotification('Error generating PDF. Using preview only.', 'warning');
    }
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${getIconForType(type)}"></i>
        <span>${message}</span>
    `;
    
    // Add styles for notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontWeight = '500';
    notification.style.zIndex = '9999';
    notification.style.animation = 'slideIn 0.3s ease';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Get icon for notification type
function getIconForType(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .badge.income {
        background: #27ae60;
        color: white;
    }
    
    .badge.expense {
        background: #e74c3c;
        color: white;
    }
    
    .prediction-item {
        transition: transform 0.3s ease;
    }
    
    .prediction-item:hover {
        transform: translateY(-5px);
    }
    
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

document.head.appendChild(style);