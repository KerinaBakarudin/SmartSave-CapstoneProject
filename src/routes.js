const { addIncomeHandler, 
    addExpenseHandler, 
    registerUsersHandler,
    loginUsersHandler,
    getTotalMonthIncomeHandler,
    getTotalMonthExpenseHandler,
    getActivityHandler,
    getBalanceHandler,
    getUserNameHandler,
    getIncomeByCategoriesHandler,
    getExpenseByCategoriesHandler,
 } = require('./handler');

    const Joi = require('joi');

const routes = [
    //register
    {
        method: 'POST',
        path: '/API/register',
        handler: registerUsersHandler,
        options: {
            validate: {
                payload: Joi.object({
                    name: Joi.string().required(),
                    email: Joi.string().email().required(),
                    password: Joi.string().min(6).required(),
                }),
            },
        },
    },

    //login
    {
        method: 'POST',
        path: '/API/login',
        handler: loginUsersHandler,
        options: {
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().required(),
                }),
            },
        },
    },

    // menampilkan nama pengguna
    {
        method: 'GET',
        path: '/API/name',
        handler: getUserNameHandler,
        options: {
            notes: 'This API requires a Bearer token for authentication',
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required().description('Bearer token for authentication'),
                }).options({ allowUnknown: true }),
            },
        },
    },
    
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
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
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
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
            },
        },
    },

    // menampilkan total income berdasarkan bulan
    {
        method: 'GET',
        path: '/API/income/total',
        handler: getTotalMonthIncomeHandler,
        options: {
            description: 'Get total income of the user',
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required().description('Bearer token for authentication'),
                }).options({ allowUnknown: true }),
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
            description: 'Get total expense of the user',
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required().description('Bearer token for authentication'),
                }).options({ allowUnknown: true }),
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
                headers: Joi.object({
                    authorization: Joi.string().required().description('Bearer token for authentication'),
                }).options({ allowUnknown: true }),
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
                headers: Joi.object({
                    authorization: Joi.string().required().description('Bearer token for authentication'),
                }).options({ allowUnknown: true }),
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
        options: {
            description: 'Get balance for logged-in user',
        },
    },

    // menampilkan activity
    {
        method: 'GET',
        path: '/API/activity',
        handler: getActivityHandler,
        options: { 
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required().description('Bearer token for authentication'),
                }).options({ allowUnknown: true }),
            },
        },
    },

];

module.exports = routes;
