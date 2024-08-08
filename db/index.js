const mongoose = require('mongoose')

mongoose.set('strictQuery', false);

console.log(process.env.DB_CONNECTION, 'db')

mongoose.connect(process.env.DB_CONNECTION, {
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
