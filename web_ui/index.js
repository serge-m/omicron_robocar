const express = require('express');
const expressWS = require('express-ws');
const WebSocket = require('ws');
const path = require('path');
const app = express();
const appWS = expressWS(app);
const port = 3000;
const { spawn } = require('child_process');

const logCommandsOutput = false;
const numCharsToSave = 100;

app.get('/', (request, response) => {
  console.log("root endpoint");
  response.send('Hello from Express!');;
})

app.use('/static', express.static(path.join(__dirname, 'static')))

tracked_processes = {
  "dummy_script": {
    "process": null,
    "output": "",
    "update_function": null,
    "command": 'python',
    "args": ['dummy_script.py'],
    "return_code": null
  },
  "dummy_script_failing": {
    "process": null,
    "output": "",
    "update_function": null,
    "command": 'python',
    "args": ['dummy_script_failing.py'],
    "return_code": null
  }
};

var socket_clients = [];

function prepare_status_update() {
  all_updates = [];
  for (var name in tracked_processes) {
    var process_info = tracked_processes[name];
    var data_to_send = {
      "command": "update_status",
      "name": name,
      "status": "off",
      "data": process_info.output,
      "return_code": process_info.return_code
    };
    if (process_info.process) {
      data_to_send.status = "running";
    }
    all_updates.push(JSON.stringify(data_to_send));
  }
  return all_updates;
}

function update_clients() {
  all_updates = prepare_status_update();
  socket_clients.forEach((ws) => {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }
    all_updates.forEach(
      (data_to_send) => { ws.send(data_to_send); }
    );   
  });
}

setInterval(update_clients, 1000);

function process_start(name) {
  var process_info = tracked_processes[name];
    if (process_info.process) {
      console.error("process " + name + " is already running");
      return;
    }
    console.error("starting process " + name);
    var p = spawn(process_info.command, process_info.args, { stdio: ['pipe'] });

    p.stdout.on('data', function (data) {
      if (logCommandsOutput) {
        console.debug(name + ": " + data.toString().replace("\n", "\\n"));
      }
      process_info.output = (process_info.output + data.toString()).slice(-numCharsToSave);
    });
    p.on('close', (code) => {
      console.log(`process ${process_info.command} ${process_info.args} exited with code ${code}`);
      process_info.return_code = code;
      process_info.process = null;
    });

    process_info.process = p;
    process_info.return_code = null;
}

function process_stop(name) {
  var process_info = tracked_processes[name];
    if (!process_info.process) {
      console.error("process " + name + " is not running");
      return;
    }
    console.error("stopping process " + name);
    process_info.process.kill();
    process_info.process = null;
}

function process_command(msg_json) {
  console.log("Processing ", msg_json);
  if (msg_json.command == "start") {
    return process_start(msg_json.name);
  }
  if (msg_json.command == "stop") {
    return process_stop(msg_json.name);
  }
}

app.ws('/', (ws, req) => {
  ws.on('message', function (msg) {
    msg_json = JSON.parse(msg);
    process_command(msg_json);
  });

  ws.on('error', function (err) {
    console.log('Found error: ' + err);
  });

  ws.on('close', function () {
    console.log('connection closed.');
  });

  socket_clients.push(ws);
  console.info("Client connected. num clients: ", socket_clients.length);
});


app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})


process.on('SIGINT', function () {
  console.log("terminating...")
  for (var name in tracked_processes) {
    process_stop(name);
  }
  update_clients();
  process.exit();
});