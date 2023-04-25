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
// app.get('/welcome', (req, res) => {
//   res.json({ status: 'success', message: 'Welcome!' });
// });

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
  if(button == "add"){
    query = `select * from products
              where products.name = $1;`;
    db.any(query, [name])
      .then((item_id) => {
        query = `INSERT INTO user_to_products(user_id, product_id) VALUES ($1,$2);`;
        db.any(query, [user.user_id, item_id[0].product_id])
        .then((data) => {
          query = `DELETE FROM cart_items WHERE cart_items.product_id = $1;`;
          db.any(query, [item_id[0].product_id])
          .then((data1) => {
            res.redirect('/cart');
          })
          .catch((err) => {
            console.log(err);
          });
        })
        .catch((err) => {
          console.log(err);
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }else {
    query = `select * from products
              where products.name = $1;`;
    db.any(query, [name])
      .then((item_id) => {
        query = `DELETE FROM cart_items WHERE cart_items.product_id = $1;`;
        db.any(query, [item_id[0].product_id])
        .then((data1) => {
          res.redirect('/cart');
        })
        .catch((err) => {
          console.log(err);
        });
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

app.get('/login', (req, res) => {
  res.render('pages/login')
});

app.get('/register', (req, res) => {
  res.render('pages/register')
});

// Login submission
// app.post('/login', async (req,res) => {
//   // check if password from request matches with password in DB
//   const userQuery = `SELECT * FROM users WHERE username = '${req.body.username}';`;

//   db.tx(async (t) => {
//     return await t.one(
//       userQuery
//     );
//   })
//   .then(async (user) => {
//     const match = await bcrypt.compare(req.body.password, user.password);
//     //save user details in session like in lab 8
//     if (!match) {
//       res.send({message: "Invalid input"});
//     } else {
//       // req.session.user = user;
//       // req.session.save();
//       // res.redirect('/discover')
//       // Authentication Middleware.
//       //const auth = (req, res, next) => {
//         // if (!req.session.user) {
//         //   // Default to login page.
//         //   //return res.redirect('/login');
//         // }
//         res.send({message: "Success"});
//         next();
//       };

//       // Authentication Required
//       app.use(auth);
//     });
//   })
//   .catch((error) => {
//     console.log(error);
//     // res.redirect('/register');
//   });


app.get('/home', (req,res) => {
  res.render('pages/home');
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login");
  
});
app.get("/trips", (req, res) => {
  const query = " SELECT * FROM trips";
  db.any(query)
  .then((trips)=>{
    res.render("pages/trips",{
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
app.get("/trips", (req, res)=>{
  res.render("pages/trips");
})
app.post("/login", async (req, res) => {
  res.redirect("/resort");

})



// Renders the resort page with the information from the trips database
app.get("/resort", (req, res) => {

  // Variables for the query
  const resortName = req.query.trip_name;
  const resortQuery = `SELECT * FROM trips WHERE trip_name = $1;`;

  // Gets all of the data from the trips table for the specific resort
  db.any(resortQuery, [resortName])
  .then(function(data){

    res.render("pages/resort", {
      status: 201,
      data: data,
    });
  })
  .catch(function(err){
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

  console.log(resortName);
  console.log(duration);
  console.log(link);

  // Queries
  const tripIdQuery = `SELECT trip_id FROM trips WHERE trip_name = $1;`;
  const queryPastTrips = `INSERT INTO past_trips(trip_id, link, location, duration) VALUES ($1, $2, $3, $4) returning *;`;
  const queryUserToTrips = `INSERT INTO user_to_trips(user_id, trip_id) VALUES ($1, $2) returning *;`;
  const reResortQuery = `SELECT * FROM trips WHERE trip_name = $1;`;

  // Gets the trip_id
  db.any(tripIdQuery, [resortName])
  .then(function(data){

    const trip_id = data[0]["trip_id"];

    // Inserts into past trips table
    db.any(queryPastTrips, [trip_id, link, resortName, duration])
    .then(function (data) {

      // Find user in user's table
      db.any(`SELECT user_id FROM users WHERE user_id = ${user.user_id}`)
      .then( function(data) {

        const user_id = data[0]["user_id"];

        // Connects past trips to the user's account
        db.any(queryUserToTrips, [user_id, trip_id])
        .then( function(data) {

          // Re-renders the page 
          db.any(reResortQuery, [resortName])
          .then( function(data) {
            res.render("pages/resort",{
              data: data,
              message: "Trip added!"
            })
          })
          .catch(function (err){
            console.log(err);
            res.redirect(`/resort?trip_name=${trip_name}`);
          });
        })
        .catch(function (err){
          console.log(err);
          // Re-renders the page 
          db.any(reResortQuery, [resortName])
          .then( function(data) {
            res.render("pages/resort",{
              data: data,
              error: true,
              message: "There was a problem adding your trip, please try again"
            })
          })
          .catch(function (err){
            console.log(err);
            res.redirect(`/resort?trip_name=${trip_name}`);
          });
        });
      })
        .catch(function (err){
          console.log(err);
          // Re-renders the page 
          db.any(reResortQuery, [resortName])
          .then( function(data) {
            res.render("pages/resort",{
              data: data,
              error: true,
              message: "There was a problem adding your trip, please try again"
            })
          })
          .catch(function (err){
            console.log(err);
            res.redirect(`/resort?trip_name=${resortName}}`);
          });
          // res.redirect(`/resort?trip_name=${trip_name}&added=failed`);
        });
      })
    .catch(function (err){
      console.log(err);
          // Re-renders the page 
          db.any(reResortQuery, [resortName])
          .then( function(data) {
            res.render("pages/resort",{
              data: data,
              error: true,
              message: "There was a problem adding your trip, please try again"
            })
          })
          .catch(function (err){
            console.log(err);
            res.redirect(`/resort?trip_name=${resortName}}`);
          });
      // res.redirect(`/resort?trip_name=${trip_name}&added=failed`);
    });
  })
  .catch(function (err){
    console.log(err);
    res.redirect(`/resort?trip_name=${resortName}`);
  });
});



app.get('/search', function(req, res) {
  const query = req.query.query; // Get the search query from the URL query string
  db.any(`SELECT * FROM products WHERE name ILIKE '%${query}%' OR product_type ILIKE '%${query}%'`) // Use ILIKE to perform a case-insensitive search
    .then(function(data) {
      res.render('pages/search', { results: data }); // Render the search template with the search results
    })
    .catch(function(error) {
      console.log(error);
    });
});
// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');