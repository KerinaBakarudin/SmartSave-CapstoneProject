const { addIncomeHandler, 
    addExpenseHandler, 
    getTotalMonthIncomeHandler,
    getTotalMonthExpenseHandler,
    getActivityHandler,
    getBalanceHandler,
    getIncomeByCategoriesHandler,
    getExpenseByCategoriesHandler,
 } = require('./handler');

const Joi = require('joi');

const routes = [
    // add income
    {
        method: 'POST',
        path: '/API/income',
        handler: addIncomeHandler,
        options: {
            validate: {
                payload: Joi.object({
                    amount: Joi.number().positive().required(),
                    category: Joi.string().required(),
                }),
            },
        },
    },

    // add expense
    {
        method: 'POST',
        path: '/API/expense',
        handler: addExpenseHandler,
        options: {
            validate: {
                payload: Joi.object({
                    amount: Joi.number().positive().required(),
                    category: Joi.string().required(),
                }),
            },
        },
    },

    // menampilkan total income berdasarkan bulan
    {
        method: 'GET',
        path: '/API/income/total',
        handler: getTotalMonthIncomeHandler,
        options: {
            validate: {
                query: Joi.object({
                    month: Joi.string()
                        .regex(/^\d{4}-(0[1-9]|1[0-2])$/) // Format YYYY-MM
                        .optional()
                        .description('Filter by month in format YYYY-MM'),
                }),
            },
        },
    },

    // menampilkan total expense berdasarkan bulan
    {
        method: 'GET',
        path: '/API/expense/total',
        handler: getTotalMonthExpenseHandler,
        options: {
            validate: {
                query: Joi.object({
                    month: Joi.string()
                        .regex(/^\d{4}-(0[1-9]|1[0-2])$/) // Format YYYY-MM
                        .optional()
                        .description('Filter by month in format YYYY-MM'),
                }),
            },
        },
    },
    
    // menampilkan jumlah income per kategori 
    {
        method: 'GET',
        path: '/API/income/categories',
        handler: getIncomeByCategoriesHandler,
        options: {
            validate: {
                query: Joi.object({
                    month: Joi.string()
                        .regex(/^\d{4}-(0[1-9]|1[0-2])$/) // Format YYYY-MM
                        .optional()
                        .description('Filter by month in format YYYY-MM'),
                }),
            },
        },
    },


    // menampilkan jumlah expense per kategori
    {
        method: 'GET',
        path: '/API/expense/categories',
        handler: getExpenseByCategoriesHandler,
        options: {
            validate: {
                query: Joi.object({
                    month: Joi.string()
                        .regex(/^\d{4}-(0[1-9]|1[0-2])$/) // Format YYYY-MM
                        .optional()
                        .description('Filter by month in format YYYY-MM'),
                }),
            },
        },
    },    
    

    // menampilkan total balance pengguna
    {
        method: 'GET',
        path: '/API/balance',
        handler: getBalanceHandler,
    },

    // menampilkan activity
    {
        method: 'GET',
        path: '/API/activity',
        handler: getActivityHandler,
    },

];

module.exports = routes;
