const Hapi = require('@hapi/hapi');
const routes = require('./routes');

const init = async () => {
    try {
        const server = Hapi.server({
            port: process.env.PORT || 8080,
            host: '0.0.0.0',
            routes: {
                cors: {
                    origin: ['*'], 
                },
            },
            debug: {
                request: ['error'],
            },
        });

        server.route(routes);
        
        await server.start();
        console.log(`Server berjalan pada ${server.info.uri}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

init();