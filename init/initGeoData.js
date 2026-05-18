const mongoose = require("mongoose");
const axios = require("axios");

const Listing = require("../models/listing");
main()
.then(() => {
    console.log("MongoDB Connected");
})
.catch(err => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/stazy");
}

async function updateListings() {

    const allListings = await Listing.find({});

    for(let listing of allListings){

        const location = `${listing.location}, ${listing.country}`;

        const response = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q: location,
                    format: "json",
                    limit: 1
                },
                headers: {
                    "User-Agent": "Stazy"
                }
            }
        );

        if(response.data.length > 0){

            const data = response.data[0];

            listing.geometry = {
                type: "Point",
                coordinates: [
                    parseFloat(data.lon),
                    parseFloat(data.lat)
                ]
            };

            await listing.save();

            console.log(`Updated: ${listing.title}`);
        }
    }

    console.log("All Listings Updated");
}

updateListings();