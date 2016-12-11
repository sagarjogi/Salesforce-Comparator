var nforce = require("nforce");
// var nsleep = require("sleep");

module.exports = function SFAuth() {
this.res = null;
var sourceorg = null;
var targetorg = null;
// multi user mode
// var oauth;
var strSOName;
var orgData = {
	arrCS1 : [],
	arrCS2 : []
};
var arrCSData = {};
var arrCSNames = [];
var arrCSLabels = [];
var arrCSCounter = 0;
var NL="\n";
var csOauth;
var sourcePermissionset =  null;
var destinationPermissionset = null;
var csMetaRes;
var csMetaWrap;
// Type of environment
var enumEnvironment = {
	production : "production",
	sandbox : "sandbox"
}


var SourceOrgAuth ;
var TargetOrgAuth ;
var ContentType_JSON = {
	key : "Content-type",
	val : "application/json"
};

this.authenticate = function(req,res) {

	console.log('in--aunthenticate----');
	if(sourceorg == null) {
		sourceorg = nforce.createConnection({
			clientId:"3MVG9uudbyLbNPZOMiosUBBq_4_PAax2Pc.FCpYU_AdkO7gPVsglpeKjrvkj5GkCRkpnHqp_F7.vbf7aYNxyA",
			clientSecret: "3678639888717772630",
			//redirectUri: "http://localhost:3000/oauth/_callback",
			apiVersion: 'v36.0',  		// optional, defaults to current salesforce API version
	 		environment: 'production',  	// optional, salesforce 'sandbox' or 'production', production default
	 		mode: 'single' 	
		});

		var isDataFetched = false;
		sourceorg.authenticate({ username: req.body.uname, password: req.body.pswd}, function(err, oauth) {
			if(err) {
				console.log(err);
				res.send(err);
			}else{
				SourceOrgAuth  =sourceorg.oauth;
				res.send(oauth);
			}

		})	
	}
	else {
		targetorg = nforce.createConnection({
			clientId: "3MVG9ZL0ppGP5UrAE8.Fw7hBn4r5b1QHOIeTU9jmkvOu32WDqDmUiFSlH_mfOs3JBy07B8KZAgCTh_7fvOBl2",
			clientSecret: "7326108786550669029",
			//redirectUri: "http://localhost:3000/oauth/_callback",
			apiVersion: 'v36.0',  		// optional, defaults to current salesforce API version
	 		environment: 'production',  	// optional, salesforce 'sandbox' or 'production', production default
	 		mode: 'single' 	
		});

		var isDataFetched = false;
		targetorg.authenticate({ username: req.body.uname, password: req.body.pswd}, function(err, oauth) {
			if(err) {
				console.log(err);
				res.send(err);
			}else{
				TargetOrgAuth = targetorg.oauth;
				res.send(oauth);
			}

		})	
	}

}

this.fetchPermissionSetMeta = function(req,res){
	var q = 'select name,id,label from PermissionSet where NOT(name LIKE \'X00%\')';
	console.log('>>>>>instance_url : '+req.body.oauth.data.instance_url);
	console.log('>>> org: ');
	
	if(targetorg.username == req.body.uname) {

		targetorg.query({ query: q , oauth: TargetOrgAuth}, function(err, resp){
			console.log('>>>>> resonse in fetch----');
			console.log(err);
			console.log(req.body);
			console.log(resp);
			if(!err && resp.records) {
				destinationPermissionset = resp.records;
				console.log('>>>>> resonse in fetch----');
				console.log(destinationPermissionset);
				res.send(destinationPermissionset);
			}
		});
			

	} else {
		
		console.log("OAUTH JSON",req.body.oauth);
		sourceorg.query({ query: q , oauth: SourceOrgAuth}, function(err, resp){
		console.log('>>>>> resonse in fetch----');
		console.log(err);
		console.log(req.body);
		console.log(resp);
			if(!err && resp.records) {
				destinationPermissionset = resp.records;
				console.log('>>>>> resonse in fetch----');
				console.log(destinationPermissionset);
				res.send(destinationPermissionset);
			}
		});

	}
			
}
//retieving custom setting 
this.fetchCustomSettingtMeta = function(req,res){
	// console.log('>>> org: ');
	csMetaRes = res;
	if(targetorg.username == req.body.uname) {
		org = targetorg;
		csOauth = TargetOrgAuth;
	}else{
		org = sourceorg;
		csOauth = SourceOrgAuth;
	}
	org.getSObjects({ oauth: csOauth }, function(err, resp) {
		if(err) {
			console.error("Error while getting SObjects: " + err);
		} else {
			
			resp.sobjects.forEach(function(so) {
				if(so.customSetting){
					// strSOName = "CS#";
					// console.log(so.name);

					arrCSNames.push(so.name);
					var tmp = {};
					tmp[so.name] = so.label;
					arrCSLabels.push(tmp);
					// arrCSNames.push({so.name : null});

				// } else {
					// strSOName = "SO#";
				}
				// strSOName += so.name;
				// console.log(strSOName);
			});

			// console.log("arrCSNames: " + arrCSNames);
			fetchFields();
			// res.set(ContentType_JSON.key, ContentType_JSON.val);
			// res.send(arrCSNames);
		}
		// isDataFetched = true;
	});

}
function fetchFields(){
	console.log("arrCSCounter: " + arrCSCounter + " / " + arrCSNames.length);
	if(arrCSCounter == arrCSNames.length){ // final call - finished collecting all fields of all CS
		// console.log(arrCSData + NL+ JSON.stringify(arrCSData));
		csMetaRes.set(ContentType_JSON.key, ContentType_JSON.val);
		// res.send(JSON.stringify(arrCSData));
		csMetaWrap = {labels:arrCSLabels,fields:arrCSData};
		// csMetaRes.send(arrCSData);
		csMetaRes.send(csMetaWrap);
		return;
	}
	//for(var arrCSCounter=0; i<arrCSData.length; ++i){ // loop over each CS
		org.getDescribe({ oauth: csOauth, type : arrCSNames[arrCSCounter] }, function(err, resp) {
			if(err) {
				console.error("Error while getting Fields: " + err);
			} else {
				var arrFields = resp.fields;
				var arrFieldsMin = [];
				for(var cntFields=0; cntFields < arrFields.length; ++cntFields){

					// arrCSData[arrCSNames[arrCSCounter]] = arrFields[cntFields];

					if(arrFields[cntFields].custom) { // add only custom fields
						arrFieldsMin.push({
							label : arrFields[cntFields].label,
							name : arrFields[cntFields].name,
							type : arrFields[cntFields].type,
						});
					}
				}

				// console.log("arrCSNames[arrCSCounter]: " + arrCSNames[arrCSCounter]);
				arrCSData[arrCSNames[arrCSCounter]] = arrFieldsMin;
				// console.log("arrCSData[arrCSNames[arrCSCounter]][0].label: " + arrCSData[arrCSNames[arrCSCounter]][0].label);
				// console.log("arrCSData[arrCSNames[arrCSCounter]]: " + arrCSData[arrCSNames[arrCSCounter]]);
				// console.log("arrFieldsMin (stringify): " + JSON.stringify(arrFieldsMin));
				// console.log("arrCSData (stringify): " + JSON.stringify(arrCSData));


				++arrCSCounter;
				setTimeout(fetchFields, 1);

				// res.set(ContentType_JSON.key, ContentType_JSON.val);
				// res.send(arrCSData);
			}
		});
		// collect all fields
	//}
}
	



//}
}
