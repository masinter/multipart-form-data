/*jslint indent: 4, node: true, sloppy: true, vars: true */

var http = require('http');
var port = 8000;

http.createServer(function (request, response) {

    // subset properties to ones that might be useful
    var qReq = {};
    var props = ["httpVersion", "headers", "trailers",
		         "method", "url"];
    for (var index = 0; index < props.length; index++) {
	var prop = props[index];
	qReq[prop] = request[prop];
    }
    
    response.writeHead(200, "OK", {'Content-Type': 'text/html', 'Access-Control-Allow-Origin':'*'});

    var encodingData = "";
    
    request.on('data', function(chunk) {
	encodingData += chunk.toString();
    });

    var debugging = true; 

    request.on('end', function() {
	response.write('<html><head><meta charset=utf-8></head><body>');

	if (debugging) {
	    // echo results in response to POST for visual confirmation
	    // unnecessary for automated testing
	    response.write('<h2>POSTed request</h2><pre>');

	    var ed = encodingData.split("\r\n");
	    response.write(JSON.stringify(qReq, null, 2));
	    response.write("\n\nBody:\n");
	    for (var i=0; i<ed.length; i++) {
		response.write("\n  "+JSON.stringify(ed[i]).slice(1,-1));
	    }
	    response.write('\n\n</pre>');
	}
	qReq.body = encodingData;
	response.write('<script>window.parent.postMessage(');
	response.write('JSON.stringify(');
	// double quote gets unwound in client
	response.write(JSON.stringify(qReq)); 
	response.write('), "*"); </script></body></html>');
	response.end();
    });
}).listen(port);
console.log('Server running on port ' + port);

