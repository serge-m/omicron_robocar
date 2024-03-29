angular.module('myApp', []).controller('launcherCtrl', function ($scope) {
    $scope.connectionStatus = "";

    $scope.nodeNames = ["dummy_script", "dummy_script_failing", "rosbag record"]
    $scope.nodeStatuses = $scope.nodeNames.map((x) => "unknown");

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
        $scope.connectionStatus = "error";
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
        $scope.nodeStatuses[nodeName] += ", starting...";
        websocket.send(JSON.stringify({
            "command": "start",
            "name": nodeName
        }));
    };

    $scope.stopScript = function (nodeName) {
        $scope.nodeStatuses[nodeName] += ", stopping...";
        websocket.send(JSON.stringify({
            "command": "stop",
            "name": nodeName
        }));
    };
});