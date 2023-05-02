// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.

//const bcrypt = require('bcrypt'); //  To hash passwords

const bcrypt = require('bcrypt'); //  To hash passwords

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
const path = require('path')
app.use(express.static(path.join(__dirname, "/resources/js")))
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
  user_id: undefined,
  username: undefined,
  password: undefined,
  email: undefined,
};
// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
app.get('/', (req, res) => {
  res.redirect('/home');
});
// TODO - Include your API routes here


app.get('/login', (req, res) => {
  res.render('pages/login')
});

app.get('/register', (req, res) => {
  res.render('pages/register')
});



// Login submission
app.post('/login', async (req, res) => {
  const query = "SELECT * FROM users where username = $1;";
  const values = [req.body.username];

  // get the student_id based on the emailid
  db.one(query, values)
    .then(async (data) => {
      const match = await bcrypt.compare(req.body.password, data.password);
      if (!match)
        throw 'Incorrect username or password.';
      else {
        user.username = req.body.username;
        user.password = data.password;
        user.email = data.email;
        user.user_id = data.user_id;
        req.session.user = user;
        req.session.save();
        //res.json({status: 'success', message: 'Success'});
        res.redirect("/home");
      }
    })
    .catch((err) => {
      console.log(err);
      //res.json({status: 'success', message: 'Invalid input'});
      res.redirect("/register");
    });
});

app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const query = "SELECT * FROM users where username = $1;";
  const values = [req.body.username];
  
  db.any(query, values)
    .then((users) => {
      console.log(users.length);
      if(users.length >= 1)
        throw new Error('Username already exist');
      else{
        const query = "INSERT INTO users(username, email, password) VALUES ($1, $2, $3);";
        db.any(query, [req.body.username, req.body.email, hash])
        .then((user_data) => {
          //res.json({status: 'success', message: 'Success'});
          res.redirect("/login");
        })
        .catch((err) => {
          //res.json({status: 'success', message: 'Username already exist'});
          res.redirect("/register");
          return console.log(err);
        });
      }
    })
    .catch((err) => {
      //res.json({status: 'success', message: 'Username already exist'});
      res.render("pages/register", {
        error: true,
        message: err.message,
      });
      return console.log(err);
    });
});

const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
app.use(express.static('resources'))
// Authentication Required
app.use(auth);

app.get('/cart', (req, res) => {
  const query = `select * from products
                left join cart_items
                on products.product_id = cart_items.product_id
                where products.product_id = cart_items.product_id;`;
  db.any(query)
    .then((cart_data) => {
      res.render("pages/cart", {
        cart_data,
        message: `Successfully got results`,
      });
    })
    .catch((err) => {
      res.render("pages/cart", {
        cart_data: [],
        error: true,
        message: err.message,
      });
    });
});

app.post('/purchase', (req, res) => {
  const name = req.body.item_name;
  const button = req.body.button;
  if (button == "add") {
    query = `select * from products
              where products.name = $1;`;
    db.any(query, [name])
      .then((item_id) => {
        query = `INSERT INTO user_to_products(user_id, product_id) VALUES ($1,$2);`;
        db.any(query, [user.user_id, item_id[0].product_id])
          .then((data) => {
            query = `select * from cart_items
                    where product_id = $1;`
            db.any(query, [item_id[0].product_id])
              .then((items) => {
                query = `DELETE FROM cart_items WHERE cart_id = $1;`;
                db.any(query, [items[0].cart_id])
                  .then((data1) => {
                    res.redirect('/cart');
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              })
              .catch((err) => {
                console.log(err);
              })
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    query = `select * from products
              where products.name = $1;`;
    db.any(query, [name])
      .then((item_id) => {
        query = `select * from cart_items
                    where product_id = $1;`
        db.any(query, [item_id[0].product_id])
          .then((items) => {
            query = `DELETE FROM cart_items WHERE cart_id = $1;`;
            db.any(query, [items[0].cart_id])
              .then((data1) => {
                res.redirect('/cart');
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .catch((err) => {
            console.log(err);
          })
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get('/profile', (req, res) => {
  const query = "select * from users where user_id = $1;";

  db.any(query, [user.user_id])
    .then((user_data) => {
      const query = `select distinct * from past_trips 
                       left join user_to_trips
                       on past_trips.trip_id = user_to_trips.trip_id
                       where user_to_trips.user_id = $1;`;
      db.any(query, [user.user_id])
        .then((trip_data) => {
          // console.log(trip_data);
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

app.get('/home', (req, res) => {
  res.render('pages/home');
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login");

});
app.get("/trips", (req, res) => {
  const query = "SELECT * FROM trips ORDER BY state_ ASC;";
  db.any(query)
    .then((trips) => {
      res.render("pages/trips", {
        trips,
      });
    })
    .catch((err) => {
      res.render("pages/trips", {
        trips: [],
        error: true,
        message: err.message,
      });
    });


});
app.post("/trips", (req, res) => {
  res.redirect("pages/resort");
})
app.post("/login", async (req, res) => {
  res.redirect("/resort");

})

// Renders the resort page with the information from the trips database
app.get("/resort", (req, res) => {
  // Variables for the query
  const resortName = req.query.trip_name;
  const tripAdd = req.query.added;
  const resortQuery = `SELECT * FROM trips WHERE trip_name = $1;`;
  var message = "";
  var error = false;

  if(tripAdd == "success")
  {
    message = "Trip added!";
  }
  else if(tripAdd == "failed")
  {
    message = "There was a problem adding your trip, please try again";
    error = true;
  }

  // Gets all of the data from the trips table for the specific resort
  db.any(resortQuery, [resortName])
    .then(function (data) {
      res.render("pages/resort", {
        status: 201,
        data: data,
        message: message,
        error: error
      });
    })
    .catch(function (err) {
      console.log(err);
      res.redirect("/trips");
    });

});

// Adds the trip to the past trips table
app.post("/resort/add", async (req, res) => {

  // Gets data from the form
  duration = req.body.duration;
  resortName = req.body.trip_name;
  link = req.body.trip_link;

  // Queries
  const tripIdQuery = `SELECT trip_id FROM trips WHERE trip_name = $1;`;
  const pastTripsInsertQuery = `INSERT INTO past_trips(trip_id, link, location, duration) VALUES ($1, $2, $3, $4);`;
  const userToTripsQuery = `INSERT INTO user_to_trips(user_id, trip_id) VALUES ($1, $2);`;

  // Get the trip_id
  db.any(tripIdQuery, [resortName])
  .then(function (trips) {

    const trip_id = trips[0]["trip_id"];

    // Insert into past_trips
    db.any(pastTripsInsertQuery, [trip_id, link, resortName, duration])
    .then(function (pastTrips) {

      // Insert into user_to_trips
      db.any(userToTripsQuery, [user.user_id, trip_id])
      .then(function(data){
        res.redirect(`/resort?trip_name=${resortName}&added=success`);
      })
      .catch(function (err) {
        console.log(err);
        res.redirect(`/resort?trip_name=${resortName}&added=failed`);
      });

    })
    .catch(function (err) {
      console.log(err);
      res.redirect(`/resort?trip_name=${resortName}&added=failed`);
    });
    
  })
  .catch(function (err) {
    console.log(err);
    res.redirect(`/resort?trip_name=${resortName}&added=failed`);
  });

});

app.post('/add-to-cart', async (req, res) => {
  const productId = req.body.product_id;
  db.none('INSERT INTO cart_items (product_id) VALUES ($1)', [productId])
    .then(function (data) {
      message = "item added";
      res.redirect(`/search?query=`)
    })
    .catch(function (error) {
      console.log(error);
      res.sendStatus(500);
    });
});

app.get('/products', function (req, res) {
  const message = req.query.message;
  db.any('SELECT * FROM products')
    .then(function (data) {
      res.render('pages/product', { products: data, message: message });
    })
    .catch(function (error) {
      console.log(error);
    });
});


app.get('/search', function (req, res) {
  const query = req.query.query; // Get the search query from the URL query string
  db.any(`SELECT * FROM products WHERE name ILIKE '%${query}%' OR product_type ILIKE '%${query}%'`) // Use ILIKE to perform a case-insensitive search
    .then(function (data) {
      res.render('pages/search', { results: data }); // Render the search page
    })
    .catch(function (error) {
      console.log(error);
    });
});







// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');