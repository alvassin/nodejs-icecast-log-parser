# Quickstart
[![Build Status](https://travis-ci.org/alvassin/nodejs-icecast-log-parser.svg?branch=master)](https://travis-ci.org/alvassin/nodejs-icecast-log-parser) [![Code Climate](https://codeclimate.com/github/alvassin/nodejs-icecast-log-parser/badges/gpa.svg)](https://codeclimate.com/github/alvassin/nodejs-icecast-log-parser) [![Test Coverage](https://codeclimate.com/github/alvassin/nodejs-icecast-log-parser/badges/coverage.svg)](https://codeclimate.com/github/alvassin/nodejs-icecast-log-parser/coverage)

Provides handy interface to icecast access.log data. Can be useful for collecting statistics or data analysis.

Use `npm install icecast-log-parser` to install latest stable version.
* [Usage](#usage)
* [Events](#events)
  * [line](#parserline) 
  * [entry](#parserentry)
  * [error](#parsererror)
  * [finish](#parserfinish)
* [Methods](#methods)
  * [parseLine](#parserparseline)
  * [resume](#parserresume)

# Usage
```js
var IcecastAccessLogParser = require('icecast-log-parser');

var parser = new IcecastAccessLogParser();
parser.on('entry', function(entry) {
  console.log(entry); // process entry
});

parser.on('error', function(error) {
  console.log('error', error);
  parser.resume(); // continue data processing after error is handled
});

parser.on('finish', function(){
  console.log('file parsing finished!');
});

var source = require('fs').createReadStream('/var/log/icecast/access.log');
source.pipe(parser);
```

# Events
#### parser.line
Is emitted for every line in access.log.
```js
parser.on('line', function(line) {
  console.log(line);
});
```
#### parser.entry
Is emitted for every successfully parsed line in access.log. See [`parser.parseLine`](#parserparseline) method for event data.
```js
parser.on('entry', function(entry) {
  console.log(entry);
});
```
#### parser.error
Parsing errors will cause `error` event & data processing stop. Use [parser.resume](#resume) method to continue data processing.
```js
parser.on('error', function(error) {
  console.log(error);
});
```
#### parser.finish
Is emitted when source stream data ends.
```js
parser.on('finish', function() {
    console.log('parsing finished');
});
```
# Methods
#### parser.parseLine
Parses single line from icecast access.log
```js
parser.parseLine('127.0.0.1 - - [19/Jun/2015:18:58:25 +0300] "GET /test.mp3 HTTP/1.0" 302 170 "-" "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 YaBrowser/15.6.2311.3927 Safari/537.36" 0');
```
Parameter  | Type    | Description
-----------|---------|------------
`ip`       | String  | Client IP address
`date`     | Integer | Request timestamp
`method`   | String  | HTTP method
`url`      | String  | Request url path
`status`   | Integer | HTTP status
`size`     | Integer | The size of the object returned to the client in bytes
`referer`  | String  | Referrer url
`agent`    | String  | User-agent
`duration` | Integer | Connection duration

#### parser.resume
If error event happens, data processing is being stopped. You can call this method to continue data processing.
```js
parser.on('error', function(error) {
  console.log('error', error);
  parser.resume();
});
```
