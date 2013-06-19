
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(3545);

function handler (req, res) {
  var urls = {
    '/': '/index.html',
    '/build.css': '/../build/build.css',
    '/build.js': '/../build/build.js',
    '/index.html': '/index.html'
  };
  console.log(req.url);
  if (!(req.url in urls)) {
    res.writeHead(404);
    return res.end('Nothing there');
  }
  fs.readFile(__dirname + urls[req.url],
  function (err, data) {
    if (err) {
      console.log(err);
      res.writeHead(500);
      return res.end('Error loading page');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(disable.bind(null, socket), 3000);
});

function enable(){
  console.log('opening');
  app.listen(3545);
}

var timer = null;
function disable(socket){
  console.log('closing');
  try {
    app.close();
    socket.disconnect();
  } catch (e) {
    console.log('fail', e);
    if (timer) clearTimeout(timer);
    timer = setTimeout(disable.bind(null, socket), 1000);
  }
  setTimeout(enable, 5000);
}

module.exports = app;
app.io = io;
