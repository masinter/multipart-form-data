var http = require('http');

http.createServer(function (request, response) {

    // subset properties to ones that might be useful

    var qReq = {};
    var props = ["httpVersion", "headers", "trailers",
		 "method", "url"];
    for(var index = 0; index < props.length; index++) {
	var prop = props[index];
	qReq[prop] = request[prop];
    }
    
    // console.log("Request: " + JSON.stringify(qReq));

    response.writeHead(200, "OK", {'Content-Type': 'text/html', 'Access-Control-Allow-Origin':'*'});

    var encodingData = "";
    
    request.on('data', function(chunk) {
	encodingData += chunk.toString();
    });

    request.on('end', function() {
	qReq.body = encodingData;
	response.write('Done\n<script>window.parent.postMessage(');
	response.write('JSON.stringify(');
	response.write(JSON.stringify(qReq));  // double quote gets unwound in client
	response.write('), "*"); </script>');
	response.end();
    });
}).listen(8888);
console.log('Server running on port 8888');
