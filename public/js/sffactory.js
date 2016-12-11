var sfcompapp = angular.module('sfcompapp');
var nforce = require("nforce");
sfcompapp.service('sfservice',function($http){
	// var factory = {};

	this.loginSF = function(uname,pswd,env){
		$http.get('/login',{"uname":uname,"pswd":pswd,"env":env}).success(function(data){
		 console.log(data);
		});
		// var org;
		// org = nforce.createConnection({
		// 	clientId: "3MVG9ZL0ppGP5UrAE8.Fw7hBn4r5b1QHOIeTU9jmkvOu32WDqDmUiFSlH_mfOs3JBy07B8KZAgCTh_7fvOBl2",
		// 	clientSecret: "7326108786550669029",
		// 	redirectUri: "http://localhost:3000/oauth/_callback",
		// 	apiVersion: "v34.0",  // optional, defaults to current salesforce API version
		// 	environment: env,  // optional, salesforce "sandbox" or "production", production default
		// 	mode: "multi" // optional, "single" or "multi" user mode, multi default
		// });
		// org.authenticate({ username: uname, password: pswd}, function(err, oauth) {

		// 	console.log(err);
		// 	console.log(oauth);
		// })
	}
	// return factory;
});