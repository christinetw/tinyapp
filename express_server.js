const express = require("express");
var cookieParser = require('cookie-parser')

const app = express();
app.use(cookieParser())

const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// Helper method for generating a random alphanumeric string
function generateRandomString(len) {
  let randStr = "";
  let charList = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < len; i++) {
    randStr += charList.charAt(Math.floor(Math.random() * charList.length));
  }
  return randStr;
}

// Our 'database' of key-value pairs (short URL --> long URL)
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const findUserByEmail = function(email) {
  for (let user_id in users) {
    const user = users[user_id];
    if (email === user.email) {
      return user;
    }
  }
  return undefined;
};

//=============================================================

// Show the page for creating a new short URL
app.get("/urls/new", (req, res) => {
  let userID = req.cookies["user_id"];
  const templateVars = { user: users[userID] };
  res.render("urls_new", templateVars);
});

// Create a new short URL for the given long URL (in the request)
app.post("/urls", (req, res) => {
  
  // Create a new short URL
  let shortURL = generateRandomString(6);
  let longURL = req.body.longURL;
  
  // Store the long URL in our 'database'
  urlDatabase[shortURL] = longURL;
  
  // Redirect to the page that shows the long URL and short URL together
  res.redirect(`/urls/${shortURL}`);
});

// Display the page which shows a short URL with its long URL
app.get("/urls/:shortURL", (req, res) => {
   let userID = req.cookies["user_id"];
  
  // The variables that our template expects
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: users[userID]
  };

  res.render("urls_show", templateVars);
});

// Display the page which shows all our short URL's
app.get("/urls", (req, res) => {
  let userID = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, user: users[userID] };
  console.log(users);
  res.render("urls_index", templateVars);
});

// Redirect from a short URL to the actual long URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let userID = req.cookies["user_id"];
  delete urlDatabase[req.params.shortURL];
  const templateVars = { urls: urlDatabase, user: users[userID]};
  res.render("urls_index", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;

  // Store the long URL in our 'database'
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

// Display login page
app.get("/login",(req,res) => {
  let userID = req.cookies["user_id"];
  const templateVars = { user: users[userID] };
  res.render("login", templateVars);
});

// Login user
app.post("/login",(req,res) => {
  let email = req.body.email;
  let password = req.body.password;

  const userFound = findUserByEmail(req.body.email);
  if (userFound === undefined) {
    res.sendStatus(403);
    return;
  }
  
  if (password !== userFound.password) {
    res.sendStatus(403);
    return;
  }

  // Correct username and password, set the cookie, redirect to url list
  res.cookie('user_id', userFound.id);
  res.redirect("/urls");
});

// Display registration page
app.get("/register",(req,res) => {
  let userID = req.cookies["user_id"];
  const templateVars = { user: users[userID] };
  res.render("register", templateVars);
});

// Register a new user
app.post("/register",(req,res) => {
  if (req.body.email.length == 0 || req.body.password.length == 0) {
    res.status(400).send('Missing username or password.');
    return;
  }
 
  const userFound = findUserByEmail(req.body.email);
  if (userFound !== undefined) {
    res.status(400).send('That user already exists');
    return;
  }

  let userId = generateRandomString(6); 
  users[userId] = {};
  users[userId].id = userId;
  users[userId].email = req.body.email;
  users[userId].password =req.body.password
 
  res.cookie('user_id', userId);
  res.redirect("/urls");
});

//============================================================

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



