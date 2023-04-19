
// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
//const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const user = {
    
    username: undefined,
    password: undefined,
    
  };
// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - Include your API routes here
app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
  });

app.get('/login', (req, res) => {
  res.render('pages/login')
});

app.get('/register', (req, res) => {
  res.render('pages/register')
});

// Login submission
app.post('/login', async (req,res) => {
  // check if password from request matches with password in DB
  const userQuery = `SELECT * FROM users WHERE username = '${req.body.username}';`;

  db.tx(async (t) => {
    return await t.one(
      userQuery
    );
  })
  .then(async (user) => {
    const match = await bcrypt.compare(req.body.password, user.password);
    //save user details in session like in lab 8
    if (!match) {
      res.send({message: "Invalid input"});
    } else {
      // req.session.user = user;
      // req.session.save();
      // res.redirect('/discover')
      // Authentication Middleware.
      //const auth = (req, res, next) => {
        // if (!req.session.user) {
        //   // Default to login page.
        //   //return res.redirect('/login');
        // }
        res.send({message: "Success"});
        next();
      };

      // Authentication Required
      app.use(auth);
    });
  })
  .catch((err) => {
    console.log(err);
    // res.redirect('/register');
  });


// Authentication Middleware.


// Authentication Required

app.get('/discover', (req, res) => {
  res.render('pages/home',{})
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login");
  
});
app.get("/trips", (req, res)=>{
  res.render("pages/trips");
})
app.post("/login", async (req, res) => {
  res.redirect("/resort");
})

// Make axios resort view call to see specifics of the ski resort
app.get("/resort", (req, res) => {

  // const resortName = req.body.slug;

  // const resortName = 'buttermilk';

  // const options = {
  //   method: 'GET',
  //   url: `https://ski-resorts-and-conditions.p.rapidapi.com/v1/resort/${resortName}`,
  //   headers: {
  //     'X-RapidAPI-Key': '1fdf96ffb7msh43fba966a30224dp13cfa8jsnfeffe4d55e5e',
  //     'X-RapidAPI-Host': 'ski-resorts-and-conditions.p.rapidapi.com'
  //   }
  // };

  // axios.request(options).then(function (response) {
  //   // console.log(response.data);
    res.render("pages/resort");//, {
  //     response
  //   });
  // }).catch(function (error) {
  //   console.error(error);
  //   res.render("pages/trips");
  // });

});

// Adds the trip to the past trips table
app.post("/resort/add", async (req, res) => {
  // Need to finish writing this API
  const queryPastTrips = `INSERT INTO past_trips() VALUES ($1, $2, $3);`;
  const queryUserToTrips = `INSERT INTO user_to_trips() VALUES ($1, $2);`;

});


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');