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
  user_id: 1,
  username: undefined,
  password: undefined,
  email: undefined,
};
// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
app.get('/', (req, res) => {
  res.redirect('/profile');
});
// TODO - Include your API routes here
app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});
app.get('/profile', (req, res) => {
  const query = "select * from users where user_id = $1;";

  db.any(query, [user.user_id])
    .then((user_data) => {
      const query = `select * from past_trips 
                       left join user_to_trips
                       on past_trips.trip_id = user_to_trips.trip_id
                       where user_to_trips.user_id = $1;`;
      db.any(query, [user.user_id])
        .then((trip_data) => {
          const query = `select * from products 
                            left join user_to_products
                            on products.product_id = user_to_products.product_id
                            where user_to_products.user_id = $1;`;
          db.any(query, [user.user_id])
            .then((item_data) => {
              res.render("pages/profile", {
                user_data,
                trip_data,
                item_data,
                message: `Successfully got results`,
              });
            })
            .catch((err) => {
              res.render("pages/profile", {
                user_data: [],
                trip_data: [],
                item_data: [],
                error: true,
                message: err.message,
              });
            });
        })
        .catch((err) => {
          res.render("pages/profile", {
            user_data: [],
            trip_data: [],
            item_data: [],
            error: true,
            message: err.message,
          });
        });
    })
    .catch((err) => {
      res.render("pages/profile", {
        user_data: [],
        trip_data: [],
        item_data: [],
        error: true,
        message: err.message,
      });
    });
});

app.post('/update-profile', (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const query = `update users 
                   set username = $1,email = $2 
                   where user_id = $3 returning * ;`;
  if (username != null & email != null) {
    db.any(query, [username, email, user.user_id])
      .then((data) => {
        user.username = username;
        user.email = email;
        res.redirect('/profile');
      })
      .catch((err) => {
        return console.log(err);
      });
  }
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
      if (false) {
        res.send({ message: "Invalid Input" });
      }
      else {
        user.username = req.body.username;
        user.password = req.body.password;
        req.session.user = user;
        req.session.save();
        res.send({ message: "Success" })
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
  res.render('pages/home', {})
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login");

});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');