var express = require("express");
var oSFAuth = require("./sf_auth.js");
var oSFCS = new oSFAuth();

var app = express();
var port = process.env.PORT || 3001; // use heroku's dynamic port or 3001 if localhost

app.use(express.static(__dirname + "/public"));

// app.get("/", function (req, res) {
   // res.sendFile( __dirname + "/" + "login.html" );
// });

app.get("/login.html", function (req, res) {
   res.sendFile( __dirname + "/" + "login.html" );
});

app.post("/", function (req, res) {
   // res.send(oSFCS.authenticate());
   // oSFCS.res = res;
   oSFCS.authenticate(res);
});

app.get("/process_get", function (req, res) {
   // Prepare output in JSON format
   response = {
      first_name:req.query.first_name,
      last_name:req.query.last_name
   };
   console.log(response);
   res.end(JSON.stringify(response));
});

app.listen(port, function(){
  //console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});


