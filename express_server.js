const express = require("express");
const app = express();
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

//=============================================================

// Show the page for creating a new short URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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

// Display the page which show our new short URL with the original long URL
app.get("/urls/:shortURL", (req, res) => {
  console.log(req.params.shortURL);
  
  // The variables that our template expects
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] 
  };

  res.render("urls_show", templateVars);
});

// Display the page which shows all our short URL's
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Redirect from a short URL to the actual long URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
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



