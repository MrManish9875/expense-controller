// Global variables
let currentUser = null;
let transactions = [];
let expenseChart = null;

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
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const email = document.getElementById('reg-email').value;
    const income = parseFloat(document.getElementById('reg-income').value);

    if (!username || !password || !email || !income) {
        alert('All fields are required!');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users'));
    
    if (users.find(u => u.username === username)) {
        alert('Username already exists!');
        return;
    }

    const newUser = {
        id: users.length + 1,
        username,
        password,
        email,
        monthlyIncome: income
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Registration successful! Please login.');
    showLogin();
}

// Login user
function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

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
        
        loadTransactions();
        updateDashboard();
        updatePredictions();
    } else {
        alert('Invalid username or password!');
    }
}

// Logout user
function logout() {
    currentUser = null;
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('main-dashboard').style.display = 'none';
    
    // Clear forms
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
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
}

// Add transaction
function addTransaction() {
    const type = document.getElementById('trans-type').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('trans-date').value;
    const description = document.getElementById('description').value;

    if (!amount || !date) {
        alert('Please fill all required fields!');
        return;
    }

    const transactions = JSON.parse(localStorage.getItem('transactions'));
    
    const newTransaction = {
        id: transactions.length + 1,
        userId: currentUser.id,
        date,
        category,
        amount,
        type,
        description
    };

    transactions.push(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Clear form
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('trans-type').value = 'expense';
    document.getElementById('category').value = 'Food';
    
    alert('Transaction added successfully!');
    loadTransactions();
    updateDashboard();
    updatePredictions();
}

// Load recent transactions
function loadTransactions() {
    const allTransactions = JSON.parse(localStorage.getItem('transactions'));
    const userTransactions = allTransactions
        .filter(t => t.userId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';

    userTransactions.forEach(t => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${t.date}</td>
            <td><span class="badge ${t.type}">${t.type}</span></td>
            <td>${t.category}</td>
            <td>₹${t.amount.toFixed(2)}</td>
            <td>${t.description || '-'}</td>
        `;
    });
}

// Get summary
function getSummary() {
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
    const summary = getSummary();
    
    document.getElementById('total-income').textContent = `₹${summary.totalIncome.toFixed(2)}`;
    document.getElementById('total-expense').textContent = `₹${summary.totalExpense.toFixed(2)}`;
    document.getElementById('balance').textContent = `₹${summary.balance.toFixed(2)}`;
    
    updateExpenseChart();
}

// Update expense chart
function updateExpenseChart() {
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
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384',
                        '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Update predictions
function updatePredictions() {
    const allTransactions = JSON.parse(localStorage.getItem('transactions'));
    const userTransactions = allTransactions.filter(t => t.userId === currentUser.id && t.type === 'expense');
    
    // Group by month
    const monthlyExpenses = {};
    userTransactions.forEach(t => {
        const month = t.date.substring(0, 7);
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
                const lastTwo = [monthlyTotals[monthlyTotals.length - 1], monthlyTotals[monthlyTotals.length - 2]];
                const trend = (lastTwo[0] - lastTwo[1]) / 2;
                predictedExpense = avgExpense + (trend * (i + 1));
            }
            
            const predictedSaving = Math.max(monthlyIncome - predictedExpense, 0);
            predictions.push(predictedSaving);
        }
    } else {
        predictions.push(0, 0, 0);
    }
    
    // Display predictions
    const predictionsDiv = document.getElementById('predictions');
    predictionsDiv.innerHTML = '';
    
    predictions.forEach((pred, i) => {
        const predItem = document.createElement('div');
        predItem.className = 'prediction-item';
        predItem.innerHTML = `
            <h4>Month ${i + 1}</h4>
            <p>₹${pred.toFixed(2)}</p>
        `;
        predictionsDiv.appendChild(predItem);
    });
    
    // Show warning if needed
    const warningDiv = document.getElementById('warning-message');
    if (predictions[0] < 1000) {
        warningDiv.style.display = 'block';
    } else {
        warningDiv.style.display = 'none';
    }
}

// Generate PDF report
function generateReport() {
    const month = document.getElementById('report-month').value;
    const year = document.getElementById('report-year').value;
    
    const monthNames = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    
    const monthNum = monthNames[month];
    
    const allTransactions = JSON.parse(localStorage.getItem('transactions'));
    const monthTransactions = allTransactions.filter(t => {
        return t.userId === currentUser.id && 
               t.date.startsWith(`${year}-${monthNum}`);
    });
    
    if (monthTransactions.length === 0) {
        alert('No transactions found for this month!');
        return;
    }
    
    // Update preview
    const preview = document.getElementById('report-preview');
    let previewText = `Expense Report - ${month} ${year}\n`;
    previewText += `User: ${currentUser.username}\n`;
    previewText += '='.repeat(50) + '\n\n';
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    monthTransactions.forEach(t => {
        previewText += `Date: ${t.date}\n`;
        previewText += `Category: ${t.category}\n`;
        previewText += `Type: ${t.type}\n`;
        previewText += `Amount: ₹${t.amount.toFixed(2)}\n`;
        previewText += `Description: ${t.description || '-'}\n`;
        previewText += '-'.repeat(40) + '\n';
        
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }
    });
    
    previewText += '\n' + '='.repeat(50) + '\n';
    previewText += `Total Income: ₹${totalIncome.toFixed(2)}\n`;
    previewText += `Total Expense: ₹${totalExpense.toFixed(2)}\n`;
    previewText += `Net Savings: ₹${(totalIncome - totalExpense).toFixed(2)}\n`;
    
    preview.textContent = previewText;
    
    // Generate PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Expense Report - ${month} ${year}`);
}