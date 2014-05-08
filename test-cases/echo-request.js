/*jslint indent: 4, node: true, sloppy: true, vars: true, white: true */

// Run a HTTP server on port 8000
// Three cases
//   ECHO
//   <root>?echo=<id>&data=<data>
//       Echo back the entire request, including all data
//       Result is a HTML file, which, when loaded, sends a message
//       to the parent frame of JSON
//       The <data> can be recovered from the UERL of the result
//    CONVERT
//    <root>?convert=<encoding>&data=<data>
//        Convert <data> (URL-encoded UTF-8) to given encoding
//    FILENAME
//        Return contents of file, matching URL
//          /echo-request?filename.ext or
//          /filename
//        only a few externsions supported, filenames no punctuation,
//        lowercase only

var port = 8000;
var debug = 2;


var http = require('http');
var fs = require('fs');
var iconv = require('iconv-lite');

http.createServer(function (request, response) {
    var URLmatch, reqOp, reqID, reqEnc, reqData, qReq, reqType, index, prop;
    var props = ["httpVersion", "headers", "trailers",
		 "method", "url"];



    // ECHO
    // <root>?echo=<id>&data=<data>
    URLmatch = 	request.url.match(/.*\?echo=([-a-z.\/0-9 ]*)&data=(.*)$/);
    if (URLmatch)  {
	reqID = URLmatch[1]; reqData = URLmatch[2];
	qReq = {};
	for (index = 0; index < props.length; index++) {
	    prop = props[index];
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
	    // pass a message to the parent
	    // which is the actual data stream, in 'binary' (not unicode)
	    response.write('<script>window.parent.postMessage(JSON.stringify(' + 
			   JSON.stringify(qReq) + 
			   '), "*");\n</script>');
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
    }

    // CONVERT
    // <root>?convert=<encoding>&data=<data>
    URLmatch = request.url.match(/.*\?convert=([-a-z0-9]*)&data=(.*)$/);
    if(URLmatch) {
	reqEnc = URLmatch[1]; reqData = URLmatch[2];
	response.writeHead(200, "OK", 
			   {'Content-Type': 'text/html;charset=' + reqEnc,
			    'Access-Control-Allow-Origin':'*',
			    'X-XSS-Protection':'0'});
	response.write(iconv.encode(decodeURIComponent(reqData), reqEnc));
	response.end();
	return this;
    }

    // 
    // ok, asking for a file
    if (0 < debug) { 
	console.log("matching " + request.url);
    }
    // FILENAME
    //  (either /filename.ext or /echo-request.js?filename.ext

    URLmatch = request.url.match(/^\/(echo-request.js\?)?([-a-z0-9\/ ]*)\.([a-z0-9]*)$/);
    if(URLmatch) {
	reqID = URLmatch[2];
	reqType = URLmatch[3]; 
	var fileName =  reqID + "." + reqType;
	if (0 < debug) { console.log("sending " + fileName ); }
	fs.readFile("./" + fileName,
		    function(error, content) {
			if (error) {
			    response.writeHead(500);
			    response.end();
			}
			else {
			    reqEnc = {js: 'text/javascript',
				      html: 'text/html',
				      pdf: 'application/pdf',
				      jpg: 'image/jpeg', 
				      css: 'text/css'}[reqType];
			    response.writeHead(200, 
					       { 'Content-Type': reqEnc });
			    response.end(content, 'utf8');
			}
		    }
		   );
	return this;
    }

    console.log("Error, bad URL: " + request.url);
    response.writeHead(404, 'Error', {'Content-Type': 'text/html'});
    response.write('<!DOCTYPE html><html><head><meta charset=utf-8>');
    response.write('</head><body>');
    response.write('<h2>Invalid Request</h2>' +
		   '<p>Invalid request:</p>' +
		   '<pre>' + request.url + '</pre></body></html>');
    response.end();
    return this;
}).listen(port);
console.log('Server running on port ' + port);

