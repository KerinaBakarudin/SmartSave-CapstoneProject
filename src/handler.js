const { nanoid } = require('nanoid');
const Joi = require('joi');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});


// menambah data pemasukan
const addIncomeHandler = async (request, h) => {
  try {
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

    const [results] = await pool.execute(query, [incomeId, amount, category, currentDate]);

    return h.response({
      status: 'success',
      message: 'Income has been added successfully',
      dataIncome: { income_id: incomeId, amount, category, created_at: currentDate },
    }).code(201);
  } catch (err) {
    return h.response({
      status: 'fail',
      message: `Failed to add income: ${err.message}`,
    }).code(500);
  }
};

// menambah data pengeluaran
const addExpenseHandler = async (request, h) => {
  try {
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

    const [results] = await pool.execute(query, values);

    return h.response({
      status: 'success',
      message: 'Expense has been added successfully',
      dataExpense: { expense_id: expenseId, amount, category, created_at: currentDate },
    }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({
      status: 'fail',
      message: 'Failed to add expense',
    }).code(500);
  }
};

// menampilkan total income per bulan
const getTotalMonthIncomeHandler = async (request, h) => {
  try {
    const { month } = request.query; 

    let query = 'SELECT SUM(amount) AS total_income FROM income';
    let values = [];

    if (month) {
      query += ' WHERE created_at LIKE ?';
      values.push(`${month}%`);
    }

    const [results] = await pool.execute(query, values);

    const totalIncome = results[0].total_income || 0;

    return h.response({ 
      status: 'success', 
      total_income: totalIncome 
    }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({
      status: 'fail',
      message: 'Failed to get total income',
    }).code(500);
  }
};

// menampilkan total expense per bulan
const getTotalMonthExpenseHandler = async (request, h) => {
  try {
    const { month } = request.query;

    let query = 'SELECT SUM(amount) AS total_expense FROM expense';
    let values = [];

    if (month) {
      query += ' WHERE created_at LIKE ?';
      values.push(`${month}%`);
    }

    const [results] = await pool.execute(query, values);

    const totalExpense = results[0].total_expense || 0;

    return h.response({ 
      status: 'success', 
      total_expense: totalExpense 
    }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({
      status: 'fail',
      message: 'Failed to get total expense',
    }).code(500);
  }
};

// menampilkan total balance pengguna
const getBalanceHandler = async (request, h) => {
  try {
    const incomeQuery = 'SELECT SUM(amount) AS total_income FROM income';
    const expenseQuery = 'SELECT SUM(amount) AS total_expense FROM expense';

    const [incomeResults] = await pool.execute(incomeQuery);
    const [expenseResults] = await pool.execute(expenseQuery);

    const totalIncome = incomeResults[0].total_income || 0;
    const totalExpense = expenseResults[0].total_expense || 0;
    const balance = totalIncome - totalExpense;

    return h.response({
      status: 'success',
      dataBalance: {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance,
      },
    }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({
      status: 'fail',
      message: 'Failed to get balance',
    }).code(500);
  }
};


// menampilkan data pemasukan per kategori
const getIncomeByCategoriesHandler = async (request, h) => {
  try {
    const { month } = request.query;

    let query = 'SELECT category, SUM(amount) AS total_income FROM income';
    let values = [];

    if (month) {
      query += ' WHERE created_at LIKE ?';
      values.push(`${month}%`);
    }

    query += ' GROUP BY category';

    const [results] = await pool.execute(query, values);

    const response = results.map(row => ({
      category: row.category,
      total_income: row.total_income,
    }));

    return h.response({
      status: 'success',
      incomeCategories: response,
    }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({
      status: 'fail',
      message: 'Failed to retrieve income data',
    }).code(500);
  }
};

// menampilkan data pengeluaran per kategori
const getExpenseByCategoriesHandler = async (request, h) => {
  try {
    const { month } = request.query;

    let query = 'SELECT category, SUM(amount) AS total_expense FROM expense';
    let values = [];

    if (month) {
      query += ' WHERE created_at LIKE ?';
      values.push(`${month}%`);
    }

    query += ' GROUP BY category';

    const [results] = await pool.execute(query, values);

    const response = results.map(row => ({
      category: row.category,
      total_expense: row.total_expense,
    }));

    return h.response({
      status: 'success',
      expenseCategories: response,
    }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({
      status: 'fail',
      message: 'Failed to retrieve expense data',
    }).code(500);
  }
};

// Menampilkan activity income dan expense pengguna
const getActivityHandler = async (request, h) => {
  try {
      const query = `
          SELECT 'income' AS type, category, amount, created_at 
          FROM income
          UNION ALL
          SELECT 'expense' AS type, category, amount, created_at 
          FROM expense
          ORDER BY created_at ASC;
      `;
      const [results] = await pool.execute(query);
      return h.response({
          status: 'success',
          dataActivity: results.map(row => ({
              type: row.type,
              category: row.category,
              amount: row.amount,
              created_at: row.created_at.toISOString().split('T')[0],
          })),
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