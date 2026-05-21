const connect_to_local_mongo = require('./database.js');

const start_server = async () => {
    // connect to database first
    await connect_to_local_mongo();

    // your server logic here
    console.log("server is running and database is ready.");
};

start_server();