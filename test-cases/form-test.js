/*jslint indent: 4, browser: true, sloppy: true, vars: true */

var form_test = {
    processResponse: function (eventObj) {
        
        // assert_equals(eventObj.httpVersion, "1.1", "using HTTP/1.1");
        assert_equals(eventObj.method, "POST", "Method is POST");
	
        var contentType = eventObj.headers["content-type"];
        var matchParams = (function (orig, expectValue, expectParams, source) {
        var valueMatch = orig.match(new RegExp("^" + expectValue + "(;.*)$", "i"));
        assert_greater_than(valueMatch.length, 1, source + " should have " + expectValue);
        if ((typeof expectParams) === 'array') { expectParams = expectParams.join("|");
        };
        var params = {};
        var paramValue = "";
        var paramName = "";

	    orig = valueMatch[1];
	    while (orig) {
		valueMatch = orig.match(new RegExp("^ *; *(" + expectParams + ") *= *([^ ;]*)", "i"));
		assert_greater_than(valueMatch.length, 2, "properly formatted parameters");
		paramName = valueMatch[1];
		paramValue = valueMatch[2];
    		if (paramValue.charAt(0) === '"') {
    		    assert_equals(paramValue.charAt(0),
    				  paramValue.charAt(paramValue.length-1),
				  "properly delimited " + paramName );
    		    paramValue = paramValue.slice(1, -1);
    		}
		params[paramName] = paramValue;
		orig = orig.slice(valueMatch[0].length);
	    }
	    return params;
	});

	var boundary = matchParams(eventObj.headers["content-type"],
				  "multipart/form-data", "boundary",
				  "content-type header").boundary;

	var raw = "(phoney preface)\r\n" + eventObj.body;
	var bodyParts = raw.split("\r\n--" + boundary + "\r\n");
	var bpl = bodyParts.length;

	assert_greater_than(bpl, 1, "must have at least one body part");
	
	var lastPart = bodyParts[bpl-1]; 
	assert_greater_than(lastPart.length, 6+boundary.length, 
                            "last part is big enough");
	// should check for trailers!
	
	var lastLine = lastPart.slice(lastPart.length-(boundary.length+8));

	assert_equals(lastLine, 
                      "\r\n--" + boundary + "--\r\n",
		      "multipart ends with boundary line");
	
	bodyParts[bpl-1] = lastPart.slice(0, -(boundary.length + 8));
	var parsedParts = [];

	var parsePart = (function(part) {
	    var header = {};
	    var hv = {};
	    var headerRegExp = /^([-a-z]+): (.*)\r\n/i ;
	    var headerParse = part.match(headerRegExp);
	    
	    while (headerParse) {
		part = part.slice(headerParse[0].length);
		switch (headerParse[1].toLowerCase()) {

		case 'content-disposition':
		    hv = matchParams(headerParse[2],
				     "form-data",
				     "name|filename",
				     "part's content-disposition header");
		    header.fieldName = hv.name;
		    if (hv.hasOwnProperty("filename")) {
			header.fileName  = hv.filename;
		    }
		    break;
		    
		case 'content-type':
		    header['content-type'] = headerParse[2];
		    break;
		    
		case 'content-transfer-encoding':
		    // TODO: validate
		    header['content-transfer-encoding'] = headerParse[2];
		    break;
		    
		default:
		    assert_true(false, "disallowed header: " + headerParse[1]);
		    break;
		}
		
		headerParse = part.match(headerRegExp);
	    }
	    
	    header.body = part.slice(2);  // remove CRLF from what's left over
	    return header;
	});


	for (var index = 1; index < bpl; index++) {
	    parsedParts.push(parsePart(bodyParts[index]));
	}
	return parsedParts;
    }
}
