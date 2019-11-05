angular.module('myApp', []).controller('launcherCtrl', function ($scope) {
    $scope.firstName = "John";
    $scope.lastName = "Doe";
    $scope.fullName = function () {
        return $scope.firstName + " " + $scope.lastName;
    };

    $scope.scriptStatus = "unknown"
    $scope.nodeNames = ["dummy_script", "dummy_script_failing"]
    $scope.nodeStatuses = $scope.nodeNames.map((x)=> "");

    $scope.connectionStatus = "";

    $scope.getSocketUrl = function () {
        return 'ws://' + window.location.host + '/';
    };

    var wsUri = $scope.getSocketUrl()
    var websocket = new WebSocket(wsUri);

    websocket.onopen = function (evt) {
        console.log("connection established to ", wsUri);

        $scope.$apply(function () {
            $scope.connectionStatus = $scope.connectionStatus + "connected to " + wsUri;
        });
    };

    websocket.onerror = function (evt) {
        console.error('websocket error: ' + evt);
        
    };

    websocket.onclose = function () {
        $scope.connectionStatus = "closed";
    };

    websocket.onmessage = function (evt) {
        var msg_json = JSON.parse(evt.data);

        $scope.$apply(function () {
            if (msg_json.command == "update_status") {
                $scope.nodeStatuses[msg_json.name] = 
                    "status: " + msg_json.status + 
                    ", return_code: " + msg_json.return_code + 
                    ", output: " + msg_json.data;
            }
        });
    };

    $scope.startScript = function (nodeName) {
        $scope.scriptStatus = $scope.scriptStatus + ", starting...";
        websocket.send(JSON.stringify({
            "command": "start",
            "name": nodeName
        }));
    };

    $scope.stopScript = function (nodeName) {
        $scope.scriptStatus = $scope.scriptStatus + ", stopping...";
        websocket.send(JSON.stringify({
            "command": "stop",
            "name": nodeName
        }));
    };
});