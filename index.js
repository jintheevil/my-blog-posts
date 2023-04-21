const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const helmet = require('helmet');

// Use Helmet
// app.use(helmet());

// Use Cookies
const cookieParser = require('cookie-parser')

// Firebase config and initialisation
const firebase = require('firebase/app');
const db = require('firebase/firestore')

const firebaseConfig = {
    apiKey: "AIzaSyCjDkerlFoFKTMSmPEtnAzNbunIUF_lE1k",
    authDomain: "my-blog-posts-ad38f.firebaseapp.com",
    projectId: "my-blog-posts-ad38f",
    storageBucket: "my-blog-posts-ad38f.appspot.com",
    messagingSenderId: "641654895578",
    appId: "1:641654895578:web:0221ae67a9a062285586e3",
    measurementId: "G-Z1HHHG3WXY"
};

firebase.initializeApp(firebaseConfig);
db.getFirestore(firebase.initializeApp(firebaseConfig));



// Allow app to use static files
app.use(express.static(__dirname + '/public'));

// Use EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// App automatically reroutes to login upon entering /
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Render views
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/register', (req, res) => {
    res.render('register');
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Use JSON and Cookies
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/user", require('./routes/userRoutes'));
app.use('/blog', require('./routes/blogRoutes'));