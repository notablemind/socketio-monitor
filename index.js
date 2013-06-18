
var template = require('./template')
  , classes = require('classes')
  , query = require('query');

var renderTpl = function (tpl) {
  var d = document.createElement('div');
  d.innerHTML = tpl;
  return d.firstElementChild;
};

var hovers = {
  'disconnected': 'reconnect',
  'connecting': 'abort'
};

var Monitor = function Monitor(el, options) {
  if (typeof el === 'string') {
    el = query(el);
    if (!el) throw new Error('Node not found');
  }
  this.options = options || {};
  this.options.wait = this.options.wait || { errored: 500, connecting: 1000 };
  this.el = el || document.createElement('div');
  this.el.innerHTML = template;
  this.cls = classes(this.el).add('socket-monitor').add('status-disconnected');
  this.el.addEventListener('click', this.click.bind(this));
  this.status = query('.status', this.el);
  this.hoverStatus = query('.hoverStatus', this.el);
  this.currentStatus = 'disconnected';
  this.timer = null;
};

Monitor.prototype = {
  click: function () {
    var cb = hovers[this.currentStatus]
    if (cb) {
      this.options[cb] && this.options[cb]();
    }
  },
  setStatus: function (status) {
    this.currentStatus = status;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.cls.remove(/^status-/).add('status-' + status);
    this.status.innerText = this.getMessage(status);
    if (status === 'errored' || status === 'connecting') {
      this.timer = setTimeout(this.setStatus.bind(this, 'disconnected'), this.options.wait[status]);
    }
    if (hovers[status]) {
      this.hoverStatus.innerText = hovers[status];
    }
  },
  getMessage: function (status) {
    return (this.options.messages && status in this.options.messages) ? this.options.messages[status] : status;
  },
  attach: function (socketManager) {
    // TODO maybe switch this around status -> listof/events
    var self = this;
    var hash = {
      'connect': 'connected',
      'connecting': 'connecting',
      'connect_error': 'errored',
      'connect_failed': 'errored',
      'connect_timeout': 'errored',
      'reconnect': 'connected',
      'reconnecting': 'connecting',
      'reconnect_error': 'errored',
      'reconnect_failed': 'errored'
    };
    socketManager.on('anything', function (data, callback) {
      console.log('SOCK: ', data);
    });
    Object.keys(hash).forEach(function(event) {
      socketManager.on(event, self.setStatus.bind(self, hash[event]));
    });
    socketManager.on('disconnect', function () {
      if (!socketManager.socket.reconnecting) {
        setTimeout(function () {
          if (!socketManager.socket.connected && !socketManager.socket.reconnecting) {
            socketManager.socket.reconnect();
          }
        }, 1000);
      }
      self.setStatus('errored');
    });
    this.options.reconnect = socketManager.socket.reconnect.bind(socketManager.socket);
    this.options.abort = function () {
      socketManager.socket.reconnecting = false;
      socketManager.socket.disconnect();
      self.setStatus('disconnected');
    };
  }
};

module.exports = Monitor;
