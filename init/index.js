const mongoose = require('mongoose');
const Listing = require('../models/listing.js');
const initData = require('./data.js');

main().then(() => {
console.log('Connected to MongoDB');
}).catch(err => {
console.error('Error connecting to MongoDB:', err);
});
    
async function main() {
    await mongoose.connect('mongodb://localhost:27017/stazy');
}

const initDB = async () => {
    await Listing.deleteMany({});
 initData.data = initData.data.map((obj) =>({...obj,owner:"6a095ee53cab8f9ae26f5c7d",}));
    await Listing.insertMany(initData.data);
    console.log("Database initialized with sample data");
}

initDB();