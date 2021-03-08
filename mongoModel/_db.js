const mongoose = require('mongoose');
const fs = require('fs');
const CONFIG = JSON.parse(fs.readFileSync('./config.json').toString());
mongoose.connect('mongodb://'+CONFIG.mongo_host+':27017/'+CONFIG.mongo_database,{ 
    user: CONFIG.mongo_user,
    pass: CONFIG.mongo_password,
    useNewUrlParser: true
});

const db = mongoose.connection;
const Schema = mongoose.Schema;

db.on('error', (err) => {
	console.log(err);
});

module.exports = {
    mongoose: mongoose,
    Schema: Schema,
    db: db
};