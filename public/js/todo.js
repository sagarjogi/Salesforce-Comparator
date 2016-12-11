angular.module('sfcompapp', ['ngMaterial','ngMdIcons'])
.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('purple')
        .warnPalette('red');
})
.controller('sfcontroller',function ($scope,$http,$mdDialog,$mdToast,$mdSidenav) {
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
  $scope.sourceUPA = null; //UPA- User Permission Assignment
  $scope.destinationUPA = null; //UPA- User Permission Assignment
  $scope.currentSourceUPA = null;
  $scope.currentDestUPA = null;
  $scope.currentPS = null;
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

  $scope.getCSData = function(org,csname){
      if(org=='source'){
           var temp = $scope.orgDetail['sourceorg'];
           var csData = $scope.sourceCSMetaFields[csname];
           var obj = {};
           obj[csname] = csData;
          $http.post('/getCSData',{"param":obj,"oauth":temp.oauth,"env":temp.env,"uname":temp.uname,"pswd":temp.pswd})
          .then(
                 function(response){
                    console.log('>>> get data : ');
                    console.log(response);
                 },
                 function(response){

                 }
            );
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
              $scope.sourceCSMetaLabels = response.data.labels;
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
                         $scope.showCSSpinner = false;
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

  //check if field meta is available in other org
  $scope.isCSAvailable = function(currOrg,csName,fldname){

    // console.log('---in checking---');
    if(currOrg=='source'){
        if($scope.destinationCSMetaFields[csName]){
           
            // console.log('---in checking- in if--');
            // console.log($scope.destinationCSMetaFields[csName]);
            var arr = $scope.destinationCSMetaFields[csName];
            for(var i=0;i<arr.length;i++){
                if(arr[i].name == fldname){
                  return true;
                }

            }
            return false;
        }else{
          return false;
        }
    }else{
        if($scope.sourceCSMetaFields[csName]){
           var arr = $scope.sourceCSMetaFields[csName];
            for(var i=0;i<arr.length;i++){
                if(arr[i].name == fldname){
                  return true;
                }

            }
           return false;
        }else{
          return false;
        }
    }
  }
  //fet User Permission Assignment
  $scope.fetchUserPermissionAssignment = function(){
    console.log('>>> in UPA : ');
    var temp = $scope.orgDetail['sourceorg'];
    $http.post('/userpermissionsetassign',{"oauth":temp.oauth,"env":temp.env,"uname":temp.uname,"pswd":temp.pswd})
    .then(
        function(response){
             // success callback
             console.log('UPA source org callback: ');
             console.log(response);
              $scope.sourceUPA = response.data;

               //fetch destination permission sets
               temp = $scope.orgDetail['destorg'];
              $http.post('/userpermissionsetassign',{"oauth":temp.oauth,"env":temp.env,"uname":temp.uname,"pswd":temp.pswd})
              .then(
                  function(response){
                    console.log('UPA destination ----');
                    console.log(response);
                    $scope.destinationUPA = response.data;
                    // $scope.fetchObjectPermissions();
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
                      $scope.fetchUserPermissionAssignment(); 
                      


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

  //fetch Object Permission 
  $scope.sourceObjectPermission;
  $scope.destinationObjectPermission;
  $scope.fetchObjectPermissions = function(){
      var temp = $scope.orgDetail['sourceorg'];
      $http.post('/objectpermission',{"oauth":temp.oauth,"env":temp.env,"uname":temp.uname,"pswd":temp.pswd})
      .then(
          function(response){
               // success callback
               console.log('source org objectpermission: ');
               console.log(response);
                $scope.sourceObjectPermission = response.data;

                 //fetch destination permission sets
                 temp = $scope.orgDetail['destorg'];
                $http.post('/objectpermission',{"oauth":temp.oauth,"env":temp.env,"uname":temp.uname,"pswd":temp.pswd})
                .then(
                    function(response){
                      console.log('destination Object permission ----');
                      console.log(response);
                      $scope.destinationObjectPermission = response.data;
                      //$scope.processObjectPermissionMetada();
                      // $scope.fetchUserPermissionAssignment(); 
                      

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

  
  
  //fetch User Permission Assignment for single permission set
  $scope.getUPA = function(ps,org){
      console.log('>>>>>>>>>>> current PS;;;;');
      console.log(ps);
      console.log(org);
      $scope.currentSourceUPA = null;
      $scope.currentDestUPA = null;
      $scope.currentPS = ps;

      if(org=='source'){
        $scope.currentSourceUPA = $scope.sourceUPA[ps.id];

        var temp = $scope.destinationPermissionsetMapSorted[ps.name]; //get dest record id
        if(temp) {
            $scope.currentDestUPA = $scope.destinationUPA[temp.id];
        }
          
      }else{
        $scope.currentDestUPA = $scope.destinationUPA[ps.id];
        var temp = $scope.sourcePermissionsetMapSorted[ps.name]; //get source record id
        if(temp){
            $scope.currentSourceUPA = $scope.sourceUPA[temp.id];
        }
            
      }
      
      $scope.openLeft();
  }

  //toggle sidebar
  $scope.openLeft = buildOpener('left');
  function buildOpener(componentId) {
      return function() {
        $mdSidenav(componentId).open();
      }
  }
  $scope.closeLeft = buildCloser('left');
  function buildCloser(componentId) {
      return function() {
        $mdSidenav(componentId).close();
      }
  }
  $scope.openMenu = function($mdOpenMenu, ev) {
     // originatorEv = ev;
      $mdOpenMenu(ev);
  };
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

