var form_test = {
    processResponse: function(eventObj) {
    	assert_equals(eventObj.httpVersion, "1.1", "using HTTP/1.1");
    	assert_equals(eventObj.method, "POST", "Method is POST");
	
    	var contentType = eventObj.headers["content-type"]; 
    	var ctPattern = /^multipart\/form-data; boundary=(.*)$/
	    
    	assert_regexp_match(
            contentType,
            ctPattern,
            "content-type is multipart/form-data with boundary");
	
    	var mpMatch = contentType.match(ctPattern);
    	assert_equals(mpMatch.length, 2, "match once");

    	var boundary = mpMatch[1];
	
    	if (boundary.charAt(0) === '"') {
    	    assert_equals(boundary.charAt(0),
    			  boundary.charAt(boundary.length-1));
    	    boundary = boundary.slice(1, -1);
    	}

	var raw = "(phoney preface)\r\n" + eventObj.body;
	var bodyParts = raw.split("\r\n--" + boundary + "\r\n");
	var bpl = bodyParts.length;

	assert_greater_than(bpl, 1, "at least one body part");
	
	var lastPart = bodyParts[bpl-1]; 
	assert_greater_than(lastPart.length, 6+boundary.length, 
                            "last part is big enough");
	// should check for trailers!
	
	var lastLine = lastPart.slice(lastPart.length-(boundary.length+8));

	assert_equals(lastLine, 
                      "\r\n--" + boundary + "--\r\n",
		      "multipart ends with boundary line");
	
	bodyParts[bpl-1] = lastPart.slice(0, -(boundary.length + 8));
      
	var parsedBody = {};
	var parseMPFD = function (part) {
	}

	var parsedParts = [];
	var headers = {};
	var headerName = "";
	var header = [];
	var part = "";

	var headerRegExp = /^(content-disposition|content-type|content-transfer-encoding): (.*)\r\n/i ;

	for (var index = 1; index < bpl; index++) {
	    headers = {};
	    part = bodyParts[index];
	    header = part.match(headerRegExp);
	    headerName = "";
	    while (header) {
		part = part.slice(header[0].length);
		headerName = header[1].toLowerCase();
		headers[headerName] = header[2];
		header = part.match(headerRegExp);
	    }
	    
	    assert_regexp_match(part, /^\r\n/, "unrecognized headers");
	    headers.body = part.slice(2);  // remove CRLF
	    parsedParts.push(headers);
	}
	
	return parsedParts;
    }
}
    
