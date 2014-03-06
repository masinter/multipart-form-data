/*jslint indent: 4, node: true, sloppy: true, vars: true */

var http = require('http');
var port = 8888;

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

    request.on('end', function() {
	qReq.body = encodingData;
	response.write('<html><head><meta charset=utf-8></head><body><p>Done\n<script>window.parent.postMessage(');
	response.write('JSON.stringify(');
	// double quote gets unwound in client
	response.write(JSON.stringify(qReq, null, 2)); 
	response.write('), "*"); </script></body>');
	response.end();
    });
}).listen(port);
console.log('Server running on port ' + port);
