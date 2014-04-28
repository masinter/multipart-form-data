/*jslint indent: 4, node: true, sloppy: true, vars: true, white: true */

var http = require('http');
var port = 8000;
var iconv = require('iconv-lite');


// Simple handler for form testing.
//      query parammter op=<op>&id=<id>&data=<data>,
//      op:   
//         get:      given a test name, and some headers, returns the form
//         echo:      echoed back the request to the parent.window


http.createServer(function (request, response) {
    // subset properties to ones that might be useful

    var URLmatch =
	request.url.match(/.*?op=(get|echo)&id=([-a-z0-9 ]*)&enc=([-a-z0-9]*)&data=(.*)$/);

    if (!URLmatch) {
	console.log("Error, bad URL: " + request.url);
	response.writeHead(404, 'Error', {'Content-Type': 'text/html'});
	response.write('<!DOCTYPE html><html><head><meta charset=utf-8>');
	response.write('</head><body>');
	response.write('<h2>Invalid Request</h2>' +
		       '<p>Invalid request:</p>' +
		       '<pre>' + request.url + '</pre></body></html>');
	response.end();
	return this;
    }
    var reqOp = URLmatch[1], reqID = URLmatch[2], reqEnc = URLmatch[3], reqData = URLmatch[4];

    switch (reqOp) {

	// get: return URL contents as HTML, encoded in given charset
    case 'get':
	response.writeHead(200, "OK", 
			   {'Content-Type': 'text/html;charset=' + reqEnc,
			    'Access-Control-Allow-Origin':'*',
			    'X-XSS-Protection':'0'});
	response.write(iconv.encode(decodeURIComponent(reqData), reqEnc));
	response.end();
	return this;

	// echo: return request, as binary. reqEnc not used

   case 'echo':
	var qReq = {};
        var index;
	var props = ["httpVersion", "headers", "trailers",
		     "method", "url"];
	for (index = 0; index < props.length; index++) {
	    var prop = props[index];
	    qReq[prop] = request[prop];
	}
	
	response.writeHead(200, "OK", {'Content-Type': 'text/html;charset=utf8',
				       'Access-Control-Allow-Origin' : '*'});
	
	var encData = '';  // accumulate binary-encoded data
	request.on('data', function(chunk) {
	    encData += iconv.decode(chunk, 'binary');
	});

	request.on('end', function() {
	    response.write('<!DOCTYPE html><html><head><meta charset=utf8></head><body>');
	    qReq.body = encData;
	    // this has the return from the submit then
	    // pass a message to the parent
	    // which is the actual form values, in 'binary' (not unicode)
	    response.write('<script>window.parent.postMessage(JSON.stringify(' + 
			   JSON.stringify(qReq) + 
			   '), "*");\n</script>');
	    
	    var debug = 2;
	    if (0 < debug ) {
		response.write('<h2>' + reqID + ' data</h2><pre>');
		var ed = encData.split("\r\n");
		delete qReq.body;
		if (debug === 2) { console.log(JSON.stringify(qReq, null, 2));}
		response.write(JSON.stringify(qReq, null, 2));
		response.write("\n\nBody:\n");
		for (var i=0; i<ed.length; i++) {
		    if (debug === 2) {
			console.log(JSON.stringify(ed[i]).slice(1,-1));
		    }
		    response.write(JSON.stringify(ed[i]).slice(1,-1) + '\n');
		}
		response.write('\n</pre>');
	    }
	    
	    response.write('</body></html>');
	    response.end();
	});
	return this;
    default:
	return this;
    }
}).listen(port);
console.log('Server running on port ' + port);

