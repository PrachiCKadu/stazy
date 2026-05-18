const Listing = require("../models/listing");
const axios = require("axios");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({})
    res.render('listings/index.ejs',{allListings});
}

module.exports.renderNewForm = (req, res) => {
    res.render('listings/new.ejs');
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({path:'reviews',
        populate:{
            path:"author",
        },
    })
    .populate("owner");
    if(!listing){
        req.flash('error', 'Listing you requested for does not exist!');
        return res.redirect('/listings');
    }
    res.render('./listings/show.ejs', { listing });
}

// module.exports.createListing = async (req, res, next) => {
//     let url = req.file.path;
//     let filename = req.file.filename;

//     const newListing = new Listing(req.body.listing);
//     newListing.owner = req.user._id;
//     newListing.image = {url , filename};
//     await newListing.save();
//     req.flash('success', 'Listing created successfully!');
//     res.redirect(`/listings`);
// }

module.exports.createListing = async (req, res, next) => {

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    // Location string
    const location = `${newListing.location}, ${newListing.country}`;

    // OpenStreetMap Geocoding
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

    // Coordinates save
    if(response.data.length > 0){

        const data = response.data[0];

        newListing.geometry = {
            type: "Point",
            coordinates: [
                parseFloat(data.lon),
                parseFloat(data.lat)
            ]
        };
    }

    // Owner & Image
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    await newListing.save();

    req.flash('success', 'Listing created successfully!');

    res.redirect(`/listings/${newListing._id}`);
}

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
     if(!listing){
        req.flash('error', 'Listing you requested for does not exist!');
        return res.redirect('/listings');
    }
    let OriginalImageUrl = listing.image.url;
    OriginalImageUrl=OriginalImageUrl.replace("/upload", "/upload/w_250");
    res.render('listings/edit.ejs', { listing, OriginalImageUrl });
}

// module.exports.updateListing = async (req, res) => {
//     let { id } = req.params;
//     let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
//     if(typeof req.file != "undefined"){
//     let url = req.file.path;
//     let filename = req.file.filename;
//     listing.image = {url , filename};
//     await listing.save();
// }
//     req.flash('success', 'Listing updated successfully!');
//     res.redirect(`/listings/${id}`);
// }

module.exports.updateListing = async (req, res) => {

    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true }
    );

    // Location string for geocoding
    const location = `${listing.location}, ${listing.country}`;

    // OpenStreetMap Geocoding
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

    // Update coordinates
    if (response.data.length > 0) {

        const data = response.data[0];

        listing.geometry = {
            type: "Point",
            coordinates: [
                parseFloat(data.lon),
                parseFloat(data.lat)
            ]
        };
    }

    // Image update
    if (typeof req.file != "undefined") {

        let url = req.file.path;
        let filename = req.file.filename;

        listing.image = { url, filename };
    }

    await listing.save();

    req.flash('success', 'Listing updated successfully!');

    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Listing deleted successfully!');
    res.redirect('/listings');
}