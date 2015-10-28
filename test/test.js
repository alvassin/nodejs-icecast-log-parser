var assert = require('assert');
var fs = require('fs');
var IcecastAccessLogParser = require(__dirname + '/../index');

describe('IcecastAccessLogParser', function() {

  /**
   * @var {IcecastAccessLogParser}
   */
  var parser;

  beforeEach(function() {
    parser = new IcecastAccessLogParser();
  });

  afterEach(function() {
    parser = null;
  });

  describe('parser.parseLine', function () {
    it('should parse valid string with referrer', function() {
      var line = '127.0.0.1 - - [19/Jun/2015:18:58:45 +0300] "GET /test.mp3 HTTP/1.0" 200 3380454 "http://example.com/" "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 YaBrowser/15.4.2272.3716 Safari/537.36" 105';
      var data = parser.parseLine(line);
      assert.deepEqual(data, { 
        ip: '127.0.0.1',
        date: 1434729525000,
        method: 'GET',
        url: '/test.mp3',
        status: 200,
        size: 3380454,
        referer: 'http://example.com/',
        agent: 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 YaBrowser/15.4.2272.3716 Safari/537.36',
        duration: 105 
      }, 'Parser returned unexpected results');
    });

    it('should parse valid string without referrer', function() {
      var line = '127.0.0.1 - - [19/Jun/2015:18:58:31 +0300] "GET /test.mp3 HTTP/1.0" 302 170 "-" "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 YaBrowser/15.6.2311.3927 Safari/537.36" 0';
      var data = parser.parseLine(line);
      assert.deepEqual(data, { 
        ip: '127.0.0.1',
        date: 1434729511000,
        method: 'GET',
        url: '/test.mp3',
        status: 302,
        size: 170,
        referer: null,
        agent: 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 YaBrowser/15.6.2311.3927 Safari/537.36',
        duration: 0 
      }, 'Parser returned unexpected results');
    });

    it('should parse valid string with frank', function() {
      var line = '127.0.0.1 - admin [19/Jun/2015:18:58:31 +0300] "GET /test.mp3 HTTP/1.0" 302 170 "-" "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 YaBrowser/15.6.2311.3927 Safari/537.36" 0';
      var data = parser.parseLine(line);
      assert.deepEqual(data, { 
        ip: '127.0.0.1',
        date: 1434729511000,
        method: 'GET',
        url: '/test.mp3',
        status: 302,
        size: 170,
        referer: null,
        agent: 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 YaBrowser/15.6.2311.3927 Safari/537.36',
        duration: 0 
      }, 'Parser returned unexpected results');
    });

    it('should return null for invalid string', function() {
      var line = '127.0.0.1 - - [19/Jun/2015:18:58:45 +0300] "GE';
      var data = parser.parseLine(line);
      assert.strictEqual(data, null, 'Parser returned unexpected results');
    });
  });

  describe('pipe interface', function () {
    it('should emit error event & stop processing data on parsing error', function(done) {
      parser.on('error', function(err) { 
        done();
      });

      fs.createReadStream(__dirname + '/access.log').pipe(parser);
    });

     it('should continue processing data on resume', function(done) {
       var error;

       parser.on('error', function(err) { 
         error = err;
         parser.resume(); 
       });
      
      parser.on('finish', function() { 
        if ( ! error) assert(false, 'Error was not detected');
        done(); 
      });

      fs.createReadStream(__dirname + '/access.log').pipe(parser);
    });
  });
});
