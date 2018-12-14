var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var fs = require('fs');
var os = require('os');
var pty = require('node-pty');
var serveStatic = require('serve-static');

// Override with your favorite shell (or other command).
var entrypoint = process.platform === 'win32' ? 'cmd.exe' : 'bash'; //You can change to your favorite shell here
var args = [];

var terminals = {},
    logs = {};

// Serve all content from the root.
app.use(serveStatic(__dirname, {'cacheControl': false}));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.post('/terminals', function (req, res) {
  var cols = parseInt(req.query.cols),
      rows = parseInt(req.query.rows),
      reqCwd = req.query.cwd;
  var cmd = req.query.cmd;
  var cwd = __dirname + '/terms';
  // Create parent directory, if it doesn't exist.
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd);
  }
  if (reqCwd) {
    if (reqCwd.startsWith('/')) {
      // Absolute path.
      cwd = reqCwd;
    } else {
      // Relative path.
      cwd = cwd + '/' + reqCwd;
    }
  }

  if (!fs.existsSync(cwd)) {
    console.log('creating directory ' + cwd);
    fs.mkdirSync(cwd);
  }
  console.log('starting terminal in ' + cwd);
  var term = pty.spawn(entrypoint, args, {
        name: 'xterm-256color',
        cols: cols || 80,
        rows: rows || 24,
        cwd: cwd,
        env: process.env
  });

  console.log('Created terminal with PID: ' + term.pid);
  terminals[term.pid] = term;
  logs[term.pid] = '';
  term.on('data', function(data) {
    logs[term.pid] += data;
  });
  if (cmd) {
    cmd = cmd.replace(/\\r/g, "\r")
    term.write(cmd + '\r');
  }
  res.send(term.pid.toString());
  res.end();
});

app.post('/terminals/:pid/size', function (req, res) {
  var pid = parseInt(req.params.pid),
      cols = parseInt(req.query.cols),
      rows = parseInt(req.query.rows),
      term = terminals[pid];

  term.resize(cols, rows);
  console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
  res.end();
});

app.ws('/terminals/:pid', function (ws, req) {
  var term = terminals[parseInt(req.params.pid)];
  console.log('Connected to terminal ' + term.pid);
  ws.send(logs[term.pid]);

  term.on('data', function(data) {
    try {
      ws.send(data);
    } catch (ex) {
      // The WebSocket is not open, ignore
    }
  });
  ws.on('message', function(msg) {
    term.write(msg);
  });
  ws.on('close', function () {
    term.kill();
    console.log('Closed terminal ' + term.pid);
    // Clean things up
    delete terminals[term.pid];
    delete logs[term.pid];
  });
});

var port = process.env.PORT || 8000,
    // DO NOT CHANGE TO 0.0.0.0. DOING SO WILL LET PEOPLE RUN CODE ON YOUR MACHINE.
    host = '127.0.0.1';

console.log('App listening to http://' + host + ':' + port);
app.listen(port, host);
