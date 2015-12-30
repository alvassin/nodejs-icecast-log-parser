/**
 * Dependencies
 */
var Writable = require('stream').Writable;
var util = require('util');
var moment = require('moment');

/**
 * Exports
 */
module.exports = IcecastLogParser;

/**
 * Constructor
 *
 * @param {object} options
 */
function IcecastLogParser(options) {

    Writable.call(this, options);
    this.options = options;

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
    switch (options.name) {
        case 'access.log':
            this.regExp = /(\S+) - \S+ \[([^:\]]+):([^\]]+)\] "(.*?)" (\d+) (\d+) "(.*?)" "(.*?)" (\d+)/;
            break;
        case 'playlist.log':
            this.regExp = ""; // use split by "|"
            break;
        default:
            throw new Error("Please specify icecast log name");
    }

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
util.inherits(IcecastLogParser, Writable);

/**
 * Handle input data chunks.
 *
 * @param {Buffer|string} chunk
 * @param {string} encoding
 * @param {function} done
 */
IcecastLogParser.prototype._write = function(chunk, encoding, done) {
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
            this.emit('error', new Error('Unable to parse line(' + i + ') "' + lines[i]));
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
IcecastLogParser.prototype.parseLine = function(line) {
    switch (this.options.name) {
        case 'access.log':
            return parseAccessLog(this.regExp, line);
        case 'playlist.log':
            return parsePlaylistLog(line);
    }
};

function parsePlaylistLog(line) {
    var matches = line.split('|');
    var title = (matches[3]) ? matches[3].replace(' -', '').trim() : "";
    return {
        date     : moment(matches[0], "DD/MMM/YYYY:hh:mm:ss Z").valueOf(),
        mount    : (matches[1]) ? matches[1] : '',
        count    : (matches[2]) ? parseInt(matches[2]) : '',
        meta     : title
    };
}

function parseAccessLog(regExp, line) {
    var matches = regExp.exec(line);
    if (matches === null) {
        return null;
    }

    var mup = get_mup_from(matches[4]);
    return {
        ip       : matches[1],
        date     : Date.parse(matches[2] + ' ' + matches[3]),
        method   : mup[0],
        url      : mup[1],
        protocol : mup[2],
        status   : parseInt(matches[5]),
        size     : parseInt(matches[6]),
        referer  : matches[7] !== '-' ? matches[7] : null,
        agent    : matches[8] !== '-' ? matches[8] : null,
        duration : parseInt(matches[9])
    };
}

// get method, url, protocol (mup)
function get_mup_from(m) {
    var arr = m.split(" ");
    var result = [];
    if (arr.length > 2) {
        result[0] = arr[0];
        result[1] = arr[1];
        result[2] = arr[2];
    } else {
        if (arr.length > 1) {
            result[0] = arr[0];
            result[1] = arr[1];
            result[2] = '';
        } else {
            result[0] = '';
            result[1] = m;
            result[2] = '';
        }
    }
    return result;
}

/**
 * Continues data pulling from source stream.
 */
IcecastLogParser.prototype.resume = function() {
    this.source.pipe(this);
};
