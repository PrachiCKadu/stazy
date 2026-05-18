if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const port = 8080;
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL = "mongodb://localhost:27017/stazy";
const dbUrl = process.env.ATLASDB_URL;
app.engine('ejs', ejsMate);

app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error", (err) => {
    console.log("Error in MONGO SESSION STORE", err);
});


const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
       expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
         maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week 
         httpOnly: true,
    }
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
       res.locals.error = req.flash('error');
       res.locals.currUser = req.user;

    next();
});

main().then(() => {
console.log('Connected to MongoDB');
}).catch(err => {
console.error('Error connecting to MongoDB:', err);
});
    
async function main() {
    await mongoose.connect(dbUrl);
}

// app.get('/', (req, res) => { 
//     res.send("Hello World!");
// });

// app.get('/demouser', async(req, res) => {
//     let fakeUser = new User({ username: 'john_doe', email: 'john.doe@example.com' });
//    let registredUser = await User.register(fakeUser, 'password123');
//    res.send(registredUser);
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// app.get('/listings', async (req, res) => {
//     let sampleListing = new Listing({
//         title: "Sample Listing2",
//         description: "This is a sample listing.",
//         price: 100,
//         location: "Sample Location",
//         country: "Sample Country"
//     });
//     await sampleListing.save();
//     // res.json(sampleListing);
//     console.log("sample saved");
//     res.send("Listings endpoint");
// });


app.use((req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    let { statusCode=500, message='Something went wrong' } = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs", { message });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
