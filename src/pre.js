(function () {
    // Work with relative paths

    Module.locateFile = function(file) {
      var dir;

      if (!dir) try {
        if (document.currentScript) dir = document.currentScript.src;
      } catch (e) { }

      if (!dir && scriptDirectory) dir = scriptDirectory;
      if (!dir) dir = location.href;

      return dir.substr(0, dir.lastIndexOf('/') + 1) + file;
    };

    Module.mainScriptUrlOrBlob = Module.locateFile('stockfish.js');

    // Message listeners

    var listeners = [];

    Module.print = function(line) {
      if (listeners.length === 0) console.log(line);
      for (var i = 0; i < listeners.length; i++) listeners[i](line);
    };

    Module.addMessageListener = function(listener) {
      listeners.push(listener);
    };

    // Command queue

    var queue = [], backoff = 1;

    function poll() {
      var command = queue.shift();
      if (!command) return;

      var tryLater = Module.ccall('uci_command', 'number', ['string'], [command]);
      if (tryLater) queue.unshift(command);
      backoff = tryLater ? (backoff * 2) : 1;
      setTimeout(poll, backoff);
    }

    Module.postMessage = function(command) {
      queue.push(command);
    };

    Module.postRun = function() {
      Module.postMessage = function(command) {
        queue.push(command);
        if (queue.length == 1) poll();
      };

      poll();
    };
})();
