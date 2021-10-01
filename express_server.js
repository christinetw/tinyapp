const express = require("express");
const bcrypt = require('bcryptjs');
let cookieSession = require('cookie-session');
const { getUserByEmail } = require('./helpers');

const app = express();
app.use(cookieSession({
  name: 'session',
  keys: ['EFCF7FFAA47CD20C68529CC828E924D9', '4E46B353F4D4B85ED5F51E614AADAA82'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// Helper method for generating a random alphanumeric string
const generateRandomString = function(len) {
  let randStr = "";
  let charList = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < len; i++) {
    randStr += charList.charAt(Math.floor(Math.random() * charList.length));
  }
  return randStr;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
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

// Returns the URL's from the database which match the 'id' parameter
// Returned value is an object of shortURL to longURL key-value pairs, eg. {"x7h19s" : "www.google.com"}
const urlsForUser = function(id) {
  let urls = {};
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL].userID) {
      urls[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return urls;
};

// Check our shortURL exists and belongs to the user, and that user is logged in
const checkShortURL = function(shortURL, userID, res) {
  // 1. Check for user not logged in, return error and message
  if (userID === undefined) {
    res.status(401).send(createHTMLmessage('Please login to use this service.'));
    return false;
  }

  // 2. Check that the shortURL exists
  if (urlDatabase[shortURL] === undefined) {
    res.status(404).send(createHTMLmessage('No such short URL exists.'));
    return false;
  }

  // 3. Make sure this shortURL belongs to this user, if not return error and message
  if (userID !== urlDatabase[shortURL].userID) {
    res.status(403).send(createHTMLmessage('This URL does not belong to you.'));
    return false;
  }

  return true;
};

// Create a basic HTML wrapper for our message
const createHTMLmessage = function(text) {
  const msg = `<html><head></head><body><h3>${text}</h3></body></html>`;
  return msg;
};

//=============================================================

// Root redirect cases
app.get("/", (req, res) => {
  let userID = req.session.user_id;
  if (userID === undefined) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});


// Show the page for creating a new short URL
app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;
  if (userID === undefined) {
    res.redirect("/login");
  }
  const templateVars = { user: users[userID] };
  res.render("urls_new", templateVars);
});

// Create a new short URL for the given long URL (in the request)
app.post("/urls", (req, res) => {

  // Create a new short URL
  let shortURL = generateRandomString(6);
  let longURL = req.body.longURL;

  // Store the long URL in our 'database'
  let userID = req.session.user_id;
  if (userID === undefined) {
    res.status(403).send(createHTMLmessage('Please login to create a new URL.'));
    return;
  }

  urlDatabase[shortURL] = { "longURL": longURL, "userID": userID };

  // Redirect to the page that shows the long URL and short URL together
  res.redirect(`/urls/${shortURL}`);
});

// Display the page which shows a short URL with its long URL
app.get("/urls/:shortURL", (req, res) => {
  let userID = req.session.user_id;

  // Check our shortURL
  if (checkShortURL(req.params.shortURL, userID, res) === false) {
    return;
  }

  // The variables that our template expects
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[userID]
  };

  res.render("urls_show", templateVars);
});

// Display the page which shows all our short URL's
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  if (userID === undefined) {
    res.status(401).send(createHTMLmessage('Please login to see your URLs.'));
    return;
  }

  const templateVars = { urls: urlsForUser(userID), user: users[userID] };
  res.render("urls_index", templateVars);
});

// Redirect from a short URL to the actual long URL
app.get("/u/:shortURL", (req, res) => {
  let userID = req.session.user_id;

  // Check our shortURL
  if (checkShortURL(req.params.shortURL, userID, res) === false) {
    return;
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Delete a shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  let userID = req.session.user_id;

  // Check our shortURL
  if (checkShortURL(req.params.shortURL, userID, res) === false) {
    return;
  }

  delete urlDatabase[req.params.shortURL];
  const templateVars = { urls: urlsForUser(userID), user: users[userID] };
  res.render("urls_index", templateVars);
});

// Update or create a url
app.post("/urls/:id", (req, res) => {
  let userID = req.session.user_id;
  let shortURL = req.params.id;
  let longURL = req.body.longURL;

  // Check our shortURL
  if (checkShortURL(req.params.id, userID, res) === false) {
    return;
  }

  // Store the long URL in our database
  urlDatabase[shortURL] = { "longURL": longURL, "userID": userID };
  res.redirect("/urls");
});

// Logout the user, delete cookie, redirect to urls
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Display login page
app.get("/login", (req, res) => {
  let userID = req.session.user_id;
  if (userID !== undefined) {
    res.redirect("/urls");
  }
  const templateVars = { user: users[userID] };
  res.render("login", templateVars);
});

// Login user
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  // Look for the user
  const userFound = getUserByEmail(email, users);

  if (userFound === undefined) {
    res.status(403).send(createHTMLmessage('Login error : email does not match any user.'));
    return;
  }

  // Check matched hashed password
  if (bcrypt.compareSync(password, userFound.password) === false) {
    res.status(403).send(createHTMLmessage('Login error : incorrect password.'));
    return;
  }

  // Correct username and password, set the cookie, redirect to url list
  req.session.user_id = userFound.id;
  res.redirect("/urls");
});

// Display registration page
app.get("/register", (req, res) => {
  let userID = req.session.user_id;

  if (userID !== undefined) {
    res.redirect("/urls");
    return;
  }

  const templateVars = { user: users[userID] };
  res.render("register", templateVars);
});

// Register a new user
app.post("/register", (req, res) => {
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.status(400).send(createHTMLmessage('Register : missing username or password.'));
    return;
  }

  const userFound = getUserByEmail(req.body.email, users);
  if (userFound !== undefined) {
    res.status(400).send(createHTMLmessage('Register : user account already exists.'));
    return;
  }

  let userId = generateRandomString(6);
  users[userId] = {};
  users[userId].id = userId;
  users[userId].email = req.body.email;

  // Store hashed password
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[userId].password = hashedPassword;

  req.session.user_id = userId;
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



