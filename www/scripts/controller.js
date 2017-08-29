// controller.js

(function() {
    var app = angular.module('myApp', ['onsen']);
  
    // 共有
    app.factory('SharedScopes', function ($rootScope) {
        var sharedScopes = {};
    
        return {
            setScope: function (key, value) {
                sharedScopes[key] = value;
            },
            getScope: function (key) {
                return sharedScopes[key];
            }
        };
    });
  
    //Sliding menu controller, swiping management
    app.controller('SlidingMenuController', function($scope){
      
        $scope.checkSlidingMenuStatus = function(){
          
            $scope.slidingMenu.on('postclose', function(){
                $scope.slidingMenu.setSwipeable(false);
            });
            $scope.slidingMenu.on('postopen', function(){
                $scope.slidingMenu.setSwipeable(true);
            });
        };
      
        $scope.checkSlidingMenuStatus();
    });

    //Map controller
    app.controller('MapController', function($scope, $timeout, SharedScopes){
      
        $scope.map;
        $scope.markers = [];
        $scope.markerId = 1;

        //共有
        SharedScopes.setScope('MapController', $scope);
          
        //Map initialization  
        $timeout(function(){
      
            var latlng = new google.maps.LatLng(35.603351, 139.377580); //Lisa本社位置
            var myOptions = {
                zoom: 15,
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            $scope.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions); 
            $scope.overlay = new google.maps.OverlayView();
            $scope.overlay.draw = function() {}; // empty function required
            $scope.overlay.setMap($scope.map);
            $scope.element = document.getElementById('map_canvas');
            
            //現在位置へ
            $scope.moveCurrentPos();
            
            //イベント
            $scope.hammertime = Hammer($scope.element).on("hold", function(event) {
                $scope.addOnClick(event);
                
            
            });
            
        },100);
    
        //Delete all Markers
        $scope.deleteAllMarkers = function(){
            
            if($scope.markers.length == 0){
                ons.notification.alert({
                    message: 'There are no markers to delete!!!'
                });
                return;
            }
            
            for (var i = 0; i < $scope.markers.length; i++) {
                            
                //Remove the marker from Map                  
                $scope.markers[i].setMap(null);
            }
            
            //Remove the marker from array.
            $scope.markers.length = 0;
            $scope.markerId = 0;
            
            ons.notification.alert({
                message: 'All Markers deleted.'
            });   
        };
    
        $scope.rad = function(x) {
            return x * Math.PI / 180;
        };
        
        //Calculate the distance between the Markers
        $scope.calculateDistance = function(){
            
            if($scope.markers.length < 2){
                ons.notification.alert({
                    message: 'Insert at least 2 markers!!!'
                });
            }
            else{
                var totalDistance = 0;
                var partialDistance = [];
                partialDistance.length = $scope.markers.length - 1;
                
                for(var i = 0; i < partialDistance.length; i++){
                    var p1 = $scope.markers[i];
                    var p2 = $scope.markers[i+1];
                    
                    var R = 6378137; // Earth’s mean radius in meter
                    var dLat = $scope.rad(p2.position.lat() - p1.position.lat());
                    var dLong = $scope.rad(p2.position.lng() - p1.position.lng());
                    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos($scope.rad(p1.position.lat())) * Math.cos($scope.rad(p2.position.lat())) *
                    Math.sin(dLong / 2) * Math.sin(dLong / 2);
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    totalDistance += R * c / 1000; //distance in Km
                    partialDistance[i] = R * c / 1000;
                }
                
                
                ons.notification.confirm({
                    message: 'Do you want to see the partial distances?',
                    callback: function(idx) {
                        
                        ons.notification.alert({
                            message: "The total distance is " + totalDistance.toFixed(1) + " km"
                        });
                        
                        switch(idx) {
                            case 0:
                                
                                break;
                            case 1:
                                for (var i = (partialDistance.length - 1); i >= 0 ; i--) {
                                    
                                    ons.notification.alert({
                                        message: "The partial distance from point " + (i+1) + " to point " + (i+2) + " is " + partialDistance[i].toFixed(1) + " km"
                                    });
                                }
                                break;
                        }
                    }
                });
            }
        };
        
        //Add single Marker
        $scope.addOnClick = function(event) {
            var x = event.gesture.center.pageX;
            var y = event.gesture.center.pageY-44;
            var point = new google.maps.Point(x, y);            
            var coordinates = $scope.overlay.getProjection().fromContainerPixelToLatLng(point);       
         
            var marker = new google.maps.Marker({
                position: coordinates,
                map: $scope.map
            });
            
            marker.id = $scope.markerId;
            $scope.markerId++;
            $scope.markers.push(marker);            


            $timeout(function(){
            //Creation of the listener associated to the Markers click

            google.maps.event.addListener(marker, "click", function (e) {
                ons.notification.confirm({
                    message: 'Do you want to delete the marker?',
                    callback: function(idx) {
                        switch(idx) {
                            case 0:
                                ons.notification.alert({
                                    message: 'You pressed "Cancel".'
                                });
                                break;
                            case 1:
                                for (var i = 0; i < $scope.markers.length; i++) {
                                    if ($scope.markers[i].id == marker.id) {
                                        //Remove the marker from Map                  
                                        $scope.markers[i].setMap(null);
                         
                                        //Remove the marker from array.
                                        $scope.markers.splice(i, 1);
                                    }
                                }
                                ons.notification.alert({
                                    message: 'Marker deleted.'
                                });
                                break;
                        }
                    }
                });
            });
            },1000);

            
        };
        
        //Move Current
        $scope.moveCurrentPos = function()
        {
            var suc = function(p) {
                var latlng = new google.maps.LatLng(p.coords.latitude, p.coords.longitude);
                $scope.map.setCenter(latlng);
            };
            var locFail = function() {
                alert("Error");
            };
            navigator.geolocation.getCurrentPosition(suc, locFail);
        }

        $scope.getCurrentPos = function()
        {
            var suc = function(p) {
                var latlng = new google.maps.LatLng(p.coords.latitude, p.coords.longitude);
                var list = locationGet();
                locationAdd(latlng);
//                list = locationGet();
//                var lat = list[list.length-1].pos;
                alert(latlng.toString());
            };
            var locFail = function() {
                alert("Error");
            };
            navigator.geolocation.getCurrentPosition(suc, locFail);
        }

    });
    
    app.controller('timerController', function($scope, $interval, SharedScopes){
        
        //共有
        SharedScopes.setScope('timerController', $scope);
        
        $scope.count = 0;
        var timer;
        $scope.start = function() {
            timer = $interval(function() {
                $scope.count++;
//                alert($scope.count);
                SharedScopes.getScope("MapController").getCurrentPos();
            }, 3000);
        };
        $scope.stop = function() {
            alert("stop");
            $interval.cancel(timer);
        };
    });
    
    
    
})();

// all clear
function localStorageClear()
{
    localStorage.clear();
}

//location
function locationGet()
{
    var list = localStorage.getItem("location_list");
    if (list == null) {
        return new Array();
    } else {
        return JSON.parse(list);
    }
}
function locationSave(list)
{
    try {
        localStorage.setItem("location_list", JSON.stringify(list));
    } catch (e) {
        alert('Error saving to storage.');
        throw e;
    }
}
function locationAdd(pos)
{
  var list = locationGet();
  var time = new Date().getTime();
  list.push({ id: time, time: time, pos: pos });
  locationSave(list);
}
function locationDel(id)
{
    var list = locationGet();
    for (var i in list) {
        if (list[i].id == id) {
            list.splice(i, 1);
            break;
        }
    }
    locationSave(list);
}
function locationClear()
{
    localStorage.removeItem("location_list");
}