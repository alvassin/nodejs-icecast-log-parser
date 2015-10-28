/**
 * Dependencies
 */
var Writable = require('stream').Writable;
var util = require('util');

/**
 * Exports
 */
module.exports = IcecastAccessLogParser;

/**
 * Constructor
 *
 * @param {object} options
 */
function IcecastAccessLogParser(options) {

  Writable.call(this, options);

  /**
   * Input buffer
   * @var {string}
   */
  this.buffer = '';

  /**
   * Regular expression
   * for parsing access log lines
   * @var {RegExp}
   */
  this.regExp = /^(\S+) - \S+ \[([^:\]]+):([^\]]+)\] "(\S+) (\S+) \S+" (\d+) (\d+) "(\S+)" "([^"]+)" (\d+)/

  /**
   * Source stream
   * @var {stream.Readable}
   */
  this.source = null;

  var parser = this;
  this.on('pipe', function(source){
    parser.source = source;
  });
}
util.inherits(IcecastAccessLogParser, Writable);

/**
 * Handle input data chunks.
 *
 * @param {Buffer|string} chunk
 * @param {string} encoding
 * @param {function} done
 */
IcecastAccessLogParser.prototype._write = function(chunk, encoding, done) {
  this.buffer += chunk.toString();
  var lines = this.buffer.split(/\r\n|\n/);

  if (/\n$/.test(this.buffer) === false) {
    this.buffer = lines.pop();
  }

  for (var i in lines) {
    if ( ! lines[i].trim()) continue;

    this.emit('line', lines[i]);

    var entry = this.parseLine(lines[i]);
    if (entry) {
      this.emit('entry', entry);
    } else {
      this.emit('error', new Error('Unable to parse line "' + lines[i] + '"'));
    }    
  }

  done();
};

/**
 * Parse access log line.
 *
 * @param {string} line
 * @return {object}
 */
IcecastAccessLogParser.prototype.parseLine = function(line) {
  var matches = line.match(this.regExp);
  if (matches === null) {
    return null;
  }

  return {
    ip       : matches[1],
    date     : Date.parse(matches[2] + ' ' + matches[3]),
    method   : matches[4],
    url      : matches[5],
    status   : parseInt(matches[6]),
    size     : parseInt(matches[7]),
    referer  : matches[8] !== '-' ? matches[8] : null,
    agent    : matches[9] !== '-' ? matches[9] : null,
    duration : parseInt(matches[10])
  };
};

/**
 * Continues data pulling from source stream.
 */
IcecastAccessLogParser.prototype.resume = function() {
  this.source.pipe(this);
};