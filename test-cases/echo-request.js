/*jslint indent: 4, node: true, sloppy: true, vars: true */

var http = require('http');
var port = 8000;

http.createServer(function (request, response) {
    // subset properties to ones that might be useful
    var qReq = {};
    var props = ["httpVersion", "headers", "trailers",
		         "method", "url"];
    for (var index = 0; index < props.length; index++) {
	var prop = props[index];1
	qReq[prop] = request[prop];
    }
    
    response.writeHead(200, "OK", {'Content-Type': 'text/html', 'Access-Control-Allow-Origin':'*'});

    var encodingData = "";
    
    request.on('data', function(chunk) {
	encodingData += chunk.toString();
    });

    request.on('end', function() {
	response.write('<!DOCTYPE html><html><head><meta charset=utf-8>');
	response.write('</head><body>');
	
	//write out post request
	qReq.body = encodingData;
	response.write('<script>window.parent.postMessage(');
	response.write('JSON.stringify(');
	response.write(JSON.stringify(qReq)); 
	response.write('), "*");\n</script>');
	
	
	// --- DEBUG ECHO IN HTML TOO --- 
	var debug = 0;
	if (0 < debug ) {
	    response.write('<h2>Request data</h2><pre>');
	    var ed = encodingData.split("\r\n");
	    delete qReq.body;
	    if (debug === 2) { console.log(JSON.stringify(qReq, null, 2));}
	    response.write(JSON.stringify(qReq, null, 2));
	    response.write("\n\nBody:\n");
	    for (var i=0; i<ed.length; i++) {
		if (debug === 2) { console.log("\n  "+JSON.stringify(ed[i]).slice(1,-1)); }
		response.write("\n  "+JSON.stringify(ed[i]).slice(1,-1));
	    }
	    response.write('\n</pre>');
	}
	// --- DEBUG END --

	response.write('</body></html>');
	response.end();
    });
}).listen(port);
console.log('Server running on port ' + port);

