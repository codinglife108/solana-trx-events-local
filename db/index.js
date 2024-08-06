const mongoose = require('mongoose')

mongoose.set('strictQuery', false);

console.log('mongodb://127.0.0.1:27017/sol-trx', 'db')

mongoose.connect('mongodb://127.0.0.1:27017/sol-trx', {
    autoIndex: true,
    readPreference: 'primary',
    directConnection: true,
    ssl: false,
    connectTimeoutMS: 15000,
}).then(() => {
	console.log('Database is connected')
}, err => {
	console.log('Can not connect to the database' + err)
})
