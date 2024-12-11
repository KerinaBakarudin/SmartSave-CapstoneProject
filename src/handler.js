const { nanoid } = require('nanoid');
const income = require('./income');
const expense = require('./expense');
const Joi = require('joi');
const mysql = require('mysql2');


const pool = mysql.createPool({
  socketPath: '/cloudsql/smartsave-444401:asia-southeast2:smartsave-database',
  user: 'root',   
  password: 'smartsave', 
  database: 'smartsave_db', 
});


// menambah data pemasukan
const addIncomeHandler = (request, h) => {
    const { amount, category } = request.payload;

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

    const incomeId = nanoid(10);
    const currentDate = new Date().toISOString().split('T')[0];

    const query = `
        INSERT INTO income (income_id, amount, category, created_at) 
        VALUES (?, ?, ?, ?)
    `;
    
    pool.query(query, [incomeId, amount, category, currentDate], (err, results) => {
        if (err) {
            return h.response({
                status: 'fail',
                message: `Failed to add income: ${err.message}`,
            }).code(500);
        }

        return h.response({
            status: 'success',
            message: 'Income has been added successfully',
            data: { income_id: incomeId, amount, category, created_at: currentDate },
        }).code(201);
    });
};


// menambah data pengeluaran
const addExpenseHandler = (request, h) => {
    const { amount, category } = request.payload;

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

    const currentDate = new Date().toISOString().split('T')[0];
    const expenseId = nanoid(10);

    const query = 'INSERT INTO expense (expense_id, amount, category, created_at) VALUES (?, ?, ?, ?)';
    const values = [expenseId, amount, category, currentDate];

    pool.query(query, values, (error, results) => {
        if (error) {
            console.error(error);
            return h.response({
                status: 'fail',
                message: 'Failed to add expense',
            }).code(500);
        }

        return h.response({
            status: 'success',
            message: 'Expense has been added successfully',
            data: { expense_id: expenseId, amount, category, created_at: currentDate },
        }).code(201);
    });
};

// menampilkan total income per bulan
const getTotalMonthIncomeHandler = (request, h) => {
    const { month } = request.query; 

    let query = 'SELECT SUM(amount) AS total_income FROM income';
    let values = [];

    if (month) {
        query += ' WHERE created_at LIKE ?';
        values.push(`${month}%`);
    }

    pool.query(query, values, (error, results) => {
        if (error) {
            console.error(error);
            return h.response({
                status: 'fail',
                message: 'Failed to get total income',
            }).code(500);
        }

        const totalIncome = results[0].total_income || 0;

        return h.response({ 
            status: 'success', 
            total_income: totalIncome 
        }).code(200);
    });
};

// menampilkan total expense per bulan
const getTotalMonthExpenseHandler = (request, h) => {
    const { month } = request.query;

    let query = 'SELECT SUM(amount) AS total_expense FROM expense';
    let values = [];

    if (month) {
        query += ' WHERE created_at LIKE ?';
        values.push(`${month}%`);
    }

    pool.query(query, values, (error, results) => {
        if (error) {
            console.error(error);
            return h.response({
                status: 'fail',
                message: 'Failed to get total expense',
            }).code(500);
        }

        const totalExpense = results[0].total_expense || 0;

        return h.response({ 
            status: 'success', 
            total_expense: totalExpense 
        }).code(200);
    });
};

// menampilkan total balance pengguna
const getBalanceHandler = (request, h) => {
    const incomeQuery = 'SELECT SUM(amount) AS total_income FROM income';
    const expenseQuery = 'SELECT SUM(amount) AS total_expense FROM expense';

    pool.query(incomeQuery, (incomeError, incomeResults) => {
        if (incomeError) {
            console.error(incomeError);
            return h.response({
                status: 'fail',
                message: 'Failed to get total income',
            }).code(500);
        }

        const totalIncome = incomeResults[0].total_income || 0;

        pool.query(expenseQuery, (expenseError, expenseResults) => {
            if (expenseError) {
                console.error(expenseError);
                return h.response({
                    status: 'fail',
                    message: 'Failed to get total expense',
                }).code(500);
            }

            const totalExpense = expenseResults[0].total_expense || 0;
            const balance = totalIncome - totalExpense;

            return h.response({
                status: 'success',
                data: {
                    total_income: totalIncome,
                    total_expense: totalExpense,
                    balance,
                },
            }).code(200);
        });
    });
};


// menampilkan data pemasukan per kategori
const getIncomeByCategoriesHandler = (request, h) => {
    const { month } = request.query;

    let query = 'SELECT category, SUM(amount) AS total_income FROM income';

    if (month) {
        query += ` WHERE created_at LIKE '${month}%'`; 
    }

    query += ' GROUP BY category';  

    pool.query(query, (error, results) => {
        if (error) {
            console.error(error);
            return h.response({
                status: 'fail',
                message: 'Failed to retrieve income data',
            }).code(500);
        }

        const response = results.map(row => ({
            category: row.category,
            total_income: row.total_income,
        }));

        return h.response({
            status: 'success',
            data: response,
        }).code(200);
    });
};

// menampilkan data pengeluaran per kategori
const getExpenseByCategoriesHandler = (request, h) => {
    const { month } = request.query;

    let query = 'SELECT category, SUM(amount) AS total_expense FROM expense';

    if (month) {
        query += ` WHERE created_at LIKE '${month}%'`;  
    }

    query += ' GROUP BY category'; 

    pool.query(query, (error, results) => {
        if (error) {
            console.error(error);
            return h.response({
                status: 'fail',
                message: 'Failed to retrieve expense data',
            }).code(500);
        }

        const response = results.map(row => ({
            category: row.category,
            total_expense: row.total_expense,
        }));

        return h.response({
            status: 'success',
            data: response,
        }).code(200);
    });
};

// Menampilkan activity income dan expense pengguna
const getActivityHandler = async (request, h) => {
    try {
        const [results] = await pool.promise().query(`
            SELECT 'income' AS type, category, amount, created_at 
            FROM income
            UNION ALL
            SELECT 'expense' AS type, category, amount, created_at 
            FROM expense
            ORDER BY created_at ASC;
        `);
        return h.response({
            status: 'success',
            data: results,
        }).code(200);
    } catch (error) {
        console.error(error);
        return h.response({
            status: 'fail',
            message: 'Failed to retrieve activity data',
        }).code(500);
    }
};


module.exports = {addIncomeHandler,  
    addExpenseHandler, 
    getTotalMonthIncomeHandler,
    getTotalMonthExpenseHandler,
    getBalanceHandler,
    getActivityHandler,
    getIncomeByCategoriesHandler,
    getExpenseByCategoriesHandler,
 };