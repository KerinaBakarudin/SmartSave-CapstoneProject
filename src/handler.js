const { nanoid } = require('nanoid');
const income = require('./income');
const expense = require('./expense');
const users = require('./users');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const JWT_SECRET = 'smartsavesecret';

// User Sign Up
const registerUsersHandler = async (request, h) => {
    const { name, email, password } = request.payload;

    // Check if user already exists
    const userExists = users.find((user) => user.email === email);
    if (userExists) {
        return h.response({
            status: 'fail',
            message: 'Email already registered',
        }).code(400);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = { user_id: nanoid(10), name, email, password: hashedPassword };
    users.push(newUser);

    return h.response({
        status: 'success',
        message: 'User registered successfully',
    }).code(201);
};

// User Login
const loginUsersHandler = async (request, h) => {
    const { email, password } = request.payload;

    // Find user by email
    const user = users.find((user) => user.email === email);
    if (!user) {
        return h.response({
            status: 'fail',
            message: 'Invalid email or password',
        }).code(400);
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return h.response({
            status: 'fail',
            message: 'Invalid email or password',
        }).code(400);
    }

    // Generate JWT
    const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: '2h' });

    return h.response({
        status: 'success',
        message: 'Login successful',
        token,
    }).code(200);
};

const getUserNameHandler = async (request, h) => {
    try {
        // Ambil token dari Authorization saat login
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return h.response({
                status: 'fail',
                message: 'Authorization token is missing or invalid',
            }).code(401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // cari pengguna yang login
        const user = users.find((user) => user.user_id === decoded.user_id);
        if (!user) {
            return h.response({
                status: 'fail',
                message: 'User not found',
            }).code(404);
        }

        // nama pengguna
        return h.response({
            status: 'success',
            data: {
                name: user.name, 
            },
        }).code(200);
    } catch (error) {
        return h.response({
            status: 'fail',
            message: 'Invalid or expired token',
        }).code(401);
    }
};


const addIncomeHandler = (request, h) => {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({
            status: 'fail',
            message: 'Unauthorized access',
        }).code(401);
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return h.response({
            status: 'fail',
            message: 'Invalid or expired token',
        }).code(401);
    }

    const { user_id } = decoded; // Extract user_id from token
    const { amount, category } = request.payload;

    // Validate payload
    const schema = Joi.object({
        amount: Joi.number().positive().required(),
        category: Joi.string().required(),
    });
    const { error } = schema.validate({ amount, category });

    if (error) {
        return h.response({
            status: 'fail',
            message: error.details[0].message,
        }).code(400);
    }

    // Add income
    const incomeId = nanoid(10);
    const currentDate = new Date().toISOString().split('T')[0];
    const newIncome = { income_id: incomeId, user_id, amount, category, created_at: currentDate };
    income.push(newIncome);

    return h.response({
        status: 'success',
        message: 'Income has been added successfully',
        data: newIncome,
    }).code(201);
};

//pengeluaran
const addExpenseHandler = (request, h) => {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({
            status: 'fail',
            message: 'Unauthorized access',
        }).code(401);
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return h.response({
            status: 'fail',
            message: 'Invalid or expired token',
        }).code(401);
    }

    const { user_id } = decoded; // Extract user_id from token
    const { amount, category } = request.payload;

    // Validate payload
    const schema = Joi.object({
        amount: Joi.number().positive().required(),
        category: Joi.string().required(),
    });
    const { error } = schema.validate({ amount, category });

    if (error) {
        return h.response({
            status: 'fail',
            message: error.details[0].message,
        }).code(400);
    }

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0];

    // Add expense
    const expenseId = nanoid(10);
    const newExpense = { expense_id: expenseId, user_id, amount, category, created_at: currentDate };
    expense.push(newExpense);

    return h.response({
        status: 'success',
        message: 'Expense has been added successfully',
        data: newExpense,
    }).code(201);
};

// menampilkan total income per bulan
const getTotalMonthIncomeHandler = (request, h) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({ status: 'fail', message: 'Unauthorized access' }).code(401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return h.response({ status: 'fail', message: 'Invalid or expired token' }).code(401);
    }

    const { user_id } = decoded;
    const { month } = request.query; 

    // Filter income berdasarkan user_id
    const filteredIncomes = income.filter(income => income.user_id === user_id);

    // Total income, filter berdasarkan bulan jika ada
    const totalIncome = filteredIncomes
        .filter(income => !month || income.created_at.startsWith(month)) // Filter jika bulan diberikan
        .reduce((total, income) => total + income.amount, 0); // Jumlahkan income

    return h.response({ status: 'success', total_income: totalIncome }).code(200);
};

// menampilkan total expense per bulan
const getTotalMonthExpenseHandler = (request, h) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({ status: 'fail', message: 'Unauthorized access' }).code(401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return h.response({ status: 'fail', message: 'Invalid or expired token' }).code(401);
    }

    const { user_id } = decoded;
    const { month } = request.query;

    // Filter expense berdasarkan user_id
    const filteredExpenses = expense.filter(expense => expense.user_id === user_id);

    const totalExpense = filteredExpenses
        .filter(expense => !month || expense.created_at.startsWith(month)) 
        .reduce((total, expense) => total + expense.amount, 0); 

    return h.response({ status: 'success', total_expense: totalExpense }).code(200);
};

// menampilkan total balance pengguna
const getBalanceHandler = (request, h) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({
            status: 'fail',
            message: 'Unauthorized access',
        }).code(401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return h.response({
            status: 'fail',
            message: 'Invalid or expired token',
        }).code(401);
    }

    const { user_id } = decoded;

    // Filter incomes and expenses by user_id
    const userIncomes = income.filter((income) => income.user_id === user_id);
    const userExpenses = expense.filter((expense) => expense.user_id === user_id);

    // menghitung total income and expense
    const totalIncome = userIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpense = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // menghitung balance
    const balance = totalIncome - totalExpense;

    return h.response({
        status: 'success',
        data: {
            user_id,
            total_income: totalIncome,
            total_expense: totalExpense,
            balance,
        },
    }).code(200);
};

// Menampilkan activity income dan expense pengguna
const getActivityHandler = (request, h) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({ status: 'fail', message: 'Unauthorized access' }).code(401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return h.response({ status: 'fail', message: 'Invalid or expired token' }).code(401);
    }

    const { user_id } = decoded;

    // Ambil data income dan filter berdasarkan user_id
    const filteredIncomes = income.filter(income => income.user_id === user_id);

    // Ambil data expense dan filter berdasarkan user_id
    const filteredExpenses = expense.filter(expense => expense.user_id === user_id);

    // Gabungkan data income dan expense
    const activity = [
        ...filteredIncomes.map(income => ({
            type: 'income', 
            category: income.category,   // Menambahkan kategori income
            amount: income.amount,       // Jumlah transaksi
            created_at: income.created_at, // Tanggal transaksi
        })),
        ...filteredExpenses.map(expense => ({
            type: 'expense',
            category: expense.category,  // Menambahkan kategori expense
            amount: expense.amount,      // Jumlah transaksi
            created_at: expense.created_at, // Tanggal transaksi
        }))
    ];

    // Urutkan berdasarkan tanggal (opsional)
    activity.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return h.response({
        status: 'success',
        data: activity,
    }).code(200);
};

const getIncomeByCategoriesHandler = (request, h) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({
            status: 'fail',
            message: 'Unauthorized access',
        }).code(401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return h.response({
            status: 'fail',
            message: 'Invalid or expired token',
        }).code(401);
    }

    const { user_id } = decoded;

    const { month } = request.query;

    let filteredIncomes = income.filter(income => income.user_id === user_id); 

    if (month) {
        filteredIncomes = filteredIncomes.filter(income => {
            const incomeMonth = income.created_at.split('-').slice(0, 2).join('-'); 
            return incomeMonth === month;  
        });
    }

    // income berdasarkan kategori
    const categoryTotals = {};

    filteredIncomes.forEach(income => {
        if (categoryTotals[income.category]) {
            categoryTotals[income.category] += income.amount;
        } else {
            categoryTotals[income.category] = income.amount;
        }
    });

    const response = Object.keys(categoryTotals).map(category => ({
        category,
        total_income: categoryTotals[category],
    }));

    return h.response({
        status: 'success',
        data: response,
    }).code(200);
};

const getExpenseByCategoriesHandler = (request, h) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({
            status: 'fail',
            message: 'Unauthorized access',
        }).code(401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return h.response({
            status: 'fail',
            message: 'Invalid or expired token',
        }).code(401);
    }

    const { user_id } = decoded;

    const { month } = request.query;

    let filteredExpenses = expense.filter(expense => expense.user_id === user_id); 

    if (month) {
        filteredExpenses = filteredExpenses.filter(expense => {
            const expenseMonth = expense.created_at.split('-').slice(0, 2).join('-'); 
            return expenseMonth === month;
        });
    }

    // expense berdasarkan kategori
    const categoryTotals = {};

    filteredExpenses.forEach(expense => {
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
        } else {
            categoryTotals[expense.category] = expense.amount;
        }
    });

    const response = Object.keys(categoryTotals).map(category => ({
        category,
        total_expense: categoryTotals[category],
    }));

    return h.response({
        status: 'success',
        data: response,
    }).code(200);
};




module.exports = {addIncomeHandler,  
    addExpenseHandler, 
    registerUsersHandler,
    loginUsersHandler,
    getTotalMonthIncomeHandler,
    getTotalMonthExpenseHandler,
    getBalanceHandler,
    getActivityHandler,
    getIncomeByCategoriesHandler,
    getExpenseByCategoriesHandler,
    getUserNameHandler
 };