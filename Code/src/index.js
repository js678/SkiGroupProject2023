// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
//const bcrypt = require('bcrypt'); //  To hash passwords
//const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

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

// Login submission
app.post("/login", (req, res) => {
    const password = req.body.password;
    const username = req.body.username;
    const query = "select * from users where users.username = $1";
    const values = [username];
  
    // get the student_id based on the emailid
    db.one(query, values)
      .then((data) => {
        // const match = await bcrypt.compare(req.body.password, data.password);
        if (false)
        {
            res.send({message: "Invalid Input"});
        }
        else
        {
            user.username = req.body.username;
            user.password = req.body.password;
            req.session.user = user;
            req.session.save();
            res.send({message: "Success"})
        }
        
      })
      .catch((err) => {
        console.log(err);
        // res.redirect("/login");
      });
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

app.get("/resort", (req, res) => {
  res.render("pages/resort");
})
app.get("/trips", (req, res) => {
  res.render("pages/trips");
})
app.post("/trips", async (req, res)=>{
  res.redirect('/resort')
})
// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');