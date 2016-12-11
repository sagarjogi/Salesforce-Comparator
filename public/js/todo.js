angular.module('sfcompapp', ['ngMaterial','ngMdIcons'])
.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('purple')
        .warnPalette('red');
})
.controller('sfcontroller',function ($scope,$http,$mdDialog,$mdToast) {
  $scope.orgDetail = [];
  $scope.orgType1 = 'production';
  $scope.orgType2 = 'production';
  $scope.showError=false;
  $scope.showProgress = false;
  $scope.showMain=false;
  $scope.currentLogin;
  $scope.uName1;
  $scope.pass1;
  $scope.csType={value:'metadata'};
  $scope.sourcePermissionset = null;
  $scope.destinationPermissionset = null;
  $scope.destinationPermissionsetMapSorted = new Object();
  $scope.sourcePermissionsetMapSorted = new Object ();
  $scope.showPSSpinner = false;
  $scope.showCSSpinner = false;
  $scope.sourceCSMetaFields = null;
  $scope.destinationCSMetaFields = null;
  $scope.sourceCSMetaLabels = null;
  $scope.destinationCSMetaLabels = null;

  
  $scope.loginSource = function(){

    console.log('>>> $scope.currentLogin ; '+$scope.currentLogin);
    $scope.showProgress = true;
    $scope.loginSF($scope.uName1,$scope.pass1,$scope.orgType1,$scope.currentLogin);

  }

  $scope.loginSF = function(uname,pswd,env,orgName){
    $http.post('/CS',{"uname":uname,"pswd":pswd,"env":env})
       .then(
       function(response){
         // success callback
         console.log(response);
         if(response.data.statusCode && response.data.statusCode==400){// authentication failed
            $scope.showError = true;
            $scope.showProgress = false;

         }else{
            $scope.closeDialog();
            $scope.orgDetail[orgName] = {"uname":uname,"pswd":pswd,"env":env,"data":response.data,"oauth":response};
            $scope.resetForm();
            console.log('>>> orgDetail : ');
            console.log($scope.orgDetail);
            
            if($scope.orgDetail['sourceorg'] && $scope.orgDetail['destorg']){
               $scope.showMain=true;
               //$scope.$apply();
            }
            
         }
         
       }, 
       function(response){
         // failure callback
         
       }  
    );
  
  }

  $scope.fetchCS = function(){
    console.log($scope.csType.value);
    if($scope.csType.value=='metadata'){
        $scope.fetchCSMetadata();
    }else{
        $scope.fetchCSData();
    }
  }

  $scope.fetchCSMetadata = function(){
      $scope.showCSSpinner = true;
      var temp = $scope.orgDetail['sourceorg'];
      $http.post('/customsettingmeta',{"oauth":temp.oauth,"env":temp.env,"uname":temp.uname,"pswd":temp.pswd})
      .then(
            function(response){
               // success callback
               console.log('---Source CS Meta---');
               console.log(response);
              $scope.sourceCSMetaFields = response.data.fields;
              var dataMap = new Object ();
              angular.forEach($scope.sourceCSMetaFields, function(value, key) {
                 var innerMap = new Object ();
                 innerMap.isCustomsetting = true;
                 innerMap.inSource = true;
                 innerMap.indDestination = false;
                 dataMap[key] = innerMap;

                 angular.forEach(value, function(valueinner, keyinner) {
                    
                    var innerMap = new Object ();
                    innerMap.isCustomsetting = false;
                    innerMap.inSource = true;
                    innerMap.indDestination = false;
                    innerMap.fieldData = valueinner;
                    dataMap[key+'.'+valueinner.name] = innerMap;
                 });
                 console.log(innerMap);
              });
              console.log(dataMap);

              $scope.sourceCSMetaLabels = response.data.labels;
              angular.forEach($scope.sourceCSMetaLabels, function(value, key) {
                 // console.log(key);
                 // console.log(value);
              }); 
                //fetch destination custom setting
               temp = $scope.orgDetail['destorg'];
               $http.post('/customsettingmeta',{"oauth":temp.oauth,"env":temp.env,"uname":temp.uname,"pswd":temp.pswd})
                .then(
                      function(response){
                         // success callback
                         console.log('---destination CS Meta---');
                         console.log(response);
                         $scope.destinationCSMetaFields = response.data.fields;
                         $scope.destinationCSMetaLabels = response.data.labels;

                         angular.forEach($scope.destinationCSMetaFields, function(value, key) {
                         var innerMap = new Object ();
                         if(dataMap[key] == null) {
                            
                            innerMap.inSource = false;
                            
                         } else {
                            innerMap = dataMap[key];
                         }
                         innerMap.indDestination = true;
                         innerMap.isCustomsetting = true;
                         dataMap[key] = innerMap;
                         console.log(dataMap[key] ); 
                         angular.forEach(value, function(valueinner, keyinner) {
                            var innerMap = new Object ();
                            if(dataMap[key+'.'+valueinner.name] == null) {
                                innerMap.inSource = false;
                            } else {
                              innerMap = dataMap[key+'.'+valueinner.name];
                            }
                            console.log(dataMap[key+'.'+valueinner.name]);
                            innerMap.indDestination = true;
                            dataMap[key+'.'+valueinner.name] = innerMap;
                         });
                      });
                  console.log(dataMap);
                       },
                       function(response){
                         // failure callback
                       }
                    
                       
               
                  );

             },
             function(response){
               // failure callback
             }
        );
  }
  //fetch Permission set metadata
  //first fetch source org permission set then destination
  $scope.fetchPermissionSet = function(){
      $scope.showPSSpinner = true;
      var temp = $scope.orgDetail['sourceorg'];
      $http.post('/fetchPermissionSetMeta',{"oauth":temp.oauth,"env":temp.env,"uname":temp.uname,"pswd":temp.pswd})
      .then(
          function(response){
               // success callback
               console.log('source org callback: ');
               console.log(response);
                $scope.sourcePermissionset = response.data;

                 //fetch destination permission sets
                 temp = $scope.orgDetail['destorg'];
                $http.post('/fetchPermissionSetMeta',{"oauth":temp.oauth,"env":temp.env,"uname":temp.uname,"pswd":temp.pswd})
                .then(
                    function(response){
                      console.log('destinationPermissionset ----');
                      console.log(response);
                      $scope.destinationPermissionset = response.data;
                      $scope.processPermissionSetMetada();
                      $scope.showPSSpinner = false;
                    },
                    function(response){

                    }
                  );

          },
          function(response){
            // failure callback
          }
        );
  }
  $scope.processPermissionSetMetada = function(){
      var sourcePermissionsetMap = new Object();
      var destinationPermissionsetMap = new Object ();

      var sourcePermissionsetArray = [];
      var destinationPermissionsetArray = [];
      for(var i=0; i<$scope.sourcePermissionset.length; i++) {
          sourcePermissionsetMap[$scope.sourcePermissionset[i].name] = $scope.sourcePermissionset[i];
          sourcePermissionsetArray.push($scope.sourcePermissionset[i].name);
          //console.log(sourcePermissionsetMap);
      }
           
      for(var i=0; i<$scope.destinationPermissionset.length; i++) {
        destinationPermissionsetMap[$scope.destinationPermissionset[i].name] = $scope.destinationPermissionset[i];
        destinationPermissionsetArray.push($scope.destinationPermissionset[i].name);
        //console.log(destinationPermissionsetMap);
        if(sourcePermissionsetArray.indexOf($scope.destinationPermissionset[i].name) == -1) {
        sourcePermissionsetMap[$scope.destinationPermissionset[i].name] = null;
        sourcePermissionsetArray.push($scope.destinationPermissionset[i].name);
        }
      }
           
      for(var i=0; i<$scope.sourcePermissionset.length; i++) {
        if(destinationPermissionsetArray.indexOf($scope.sourcePermissionset[i].name) == -1) {
        destinationPermissionsetMap[$scope.sourcePermissionset[i].name] = null;
        destinationPermissionsetArray.push($scope.sourcePermissionset[i].name);
        }
      }
           
         
      Object.keys(destinationPermissionsetMap).sort().forEach(function(key) {
       $scope.destinationPermissionsetMapSorted[key] = destinationPermissionsetMap[key];
      });
      Object.keys(sourcePermissionsetMap).sort().forEach(function(key) {
        $scope.sourcePermissionsetMapSorted[key] = sourcePermissionsetMap[key];
      });
        console.log($scope.destinationPermissionsetMapSorted);
        console.log('###');
        console.log($scope.sourcePermissionsetMapSorted);
  }
  $scope.closeDialog = function() {
          $scope.resetForm();
          $mdDialog.hide();
  }
  
  $scope.resetForm = function(){
        //clear all the data
          $scope.currentLogin='';
          $scope.showError=false;
          $scope.uName1='';
          $scope.pass1='';
          $scope.showProgress = false;
  }
   $scope.showLoginFirst = function(ev){
    console.log('>>>> called>>>>');
      $mdDialog.show({
      controller: function () {
                return self;
            },
      //templateUrl: '{!envPath}/partials/NewAgreementDialog.html',
      contentElement: '#myStaticDialog',
      parent: angular.element(document.body),
      targetEvent: ev,
      bindToController:true,
      clickOutsideToClose:false,
      locals: { orgType:$scope.orgType,uName1:$scope.uName1,pass1:$scope.pass1}
     
    }).then(function(answer) {
        
        
        }, function() {
         // alert( 'You cancelled the dialog.');
        }); 
    
  }

  function DialogController($scope, $mdDialog, orgType,uName1,pass1) {
        // $scope.orgType = items;
        $scope.orgType = orgType;
        $scope.uName1 = uName1;
        $scope.pass1  = pass1;
        $scope.orgType1 = 'production';
        $scope.loginForm.$setPristine();
        $scope.loginForm.$setUntouched();
        //$scope.pass1 = pass1;
          
        $scope.closeDialog = function() {
          $mdDialog.hide();
        }
        $scope.submitLogin = function(){
          console.log('>>> Items : ');
          //console.log(orgType);
        }
      }
})

