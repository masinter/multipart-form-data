/*jslint indent: 4, browser: true, sloppy: true, vars: true, regexp: true, white: true, browser: true */
/*global assert_true, assert_equals, assert_greater_than, assert_object_equals, console, async_test */

function doFormTests(testValues) {

    var formAdd = document.getElementById("form-add");

    function warnTest(msg) {
	var warnPara = document.createElement("p");
	warnPara.textContent = msg;
	formAdd.appendChild(warnPara);
    }

    // match content-type parameters, e.g., after ; in boundary=
    // orig = original header 
    function matchMIMEParams(orig, expectValue, expectParams, source) {
        var valueMatch = orig.match(new RegExp('^' + expectValue +
					       '(;.*)$', 'i'));
        assert_greater_than(valueMatch.length, 1, 
			    source + " should have " + expectValue);
        if ((typeof expectParams) === 'array') {
            expectParams = expectParams.join("|");
        }
        var params = {}, paramValue = "", paramName = "", pattern = "";
	
	// ok, now work on parameters
        orig = valueMatch[1];

        while (orig) {
	    pattern = '^ *; *(' + expectParams + ')=("[^"]*"|[^;]*)' ;
            valueMatch =  orig.match(new RegExp(pattern, 'i'));
	    assert_true(!!valueMatch, "Parameter not found " + expectParams);
            assert_greater_than(valueMatch.length, 2,
				"properly formatted parameters");
            paramName = valueMatch[1];
            paramValue = valueMatch[2];
            if (paramValue.charAt(0) === '"') {
                assert_equals(paramValue.charAt(0),
                              paramValue.charAt(paramValue.length - 1),
                              "properly delimited " + paramName);
                paramValue = paramValue.slice(1, -1);
            }
            params[paramName] = paramValue;
            orig = orig.slice(valueMatch[0].length);
        }
        return params;
    }

    // parse one of the parts of a multipart value
    function parseMultiPart(part) {
        var header = {};
        var hv = {};
        var headerRegExp = /^([-a-z]+): (.*)\r\n/i;
        var headerParse = part.match(headerRegExp);

        while (headerParse) {
            part = part.slice(headerParse[0].length);
            switch (headerParse[1].toLowerCase()) {

            case 'content-disposition':
                hv = matchMIMEParams(headerParse[2],
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

            // case 'content-transfer-encoding':
            //     // TODO: validate CTE
            //     header['content-transfer-encoding'] = headerParse[2];
            //     break;
		// do not allow CTE??


            default:
                assert_true(false, "disallowed header: " + headerParse[1]);
                break;
            }

            headerParse = part.match(headerRegExp);
        }

        header.body = part.slice(2);  // remove CRLF from what's left over
        return header;
    }

    function processResponse(eventObj, testObj) {
        // assert_equals(eventObj.httpVersion, "1.1", "using HTTP/1.1");
        assert_equals(eventObj.method, "POST", "Method is POST");

        var contentType = eventObj.headers["content-type"];

        var boundary = matchMIMEParams(eventObj.headers["content-type"],
                                       "multipart/form-data", "boundary",
                                       "content-type header").boundary;

	var ctl = eventObj.headers["content-length"];
        var eol = eventObj.body.length;
	if (ctl && (parseInt(ctl,10) !== eol)) {
	    warnTest((testObj.testName || "") + 
		     " WARNING: content length '" + ctl + "', actual: " + eol);
	    // assert_equals(parseInt(ctl,10), eventObj.body.length,
	    //             "content-length matches");
	}
        var raw = "(phoney preface)\r\n" + eventObj.body;
        var bodyParts = raw.split("\r\n--" + boundary + "\r\n");
        var bpl = bodyParts.length;

        assert_greater_than(bpl, 1, "must have at least one body part");

        var lastPart = bodyParts[bpl-1];
        assert_greater_than(lastPart.length, 6 + boundary.length,
                            "last part is big enough");
        // should check for trailers?

        var lastLine = lastPart.slice(lastPart.length-(boundary.length+8));

        assert_equals(lastLine,
                      "\r\n--" + boundary + "--\r\n",
                      "multipart ends with boundary line");

        bodyParts[bpl - 1] = lastPart.slice(0, -(boundary.length + 8));
        var index, parsedParts = [];
        //start at 1, not 0
        for (index = 1; index < bpl; index+=1) {
            parsedParts.push(parseMultiPart(bodyParts[index]));
        }
        return parsedParts;
    }


    function encode_utf8(s) {
	return unescape(encodeURIComponent(s));
    }

    function testMatch(actual, testObj) {
	var expected = testObj.testFields;
	var aind = 0, eind = 0;
	var eFieldName, eBody;

	while(eind < expected.length) {
	    eFieldName = encode_utf8(expected[eind].fieldName);
	    
	    if(expected[eind].multiple) {
		while(aind < actual.length &&
		      actual[aind].fieldName === eFieldName) {
		    warnTest(testObj.testName + ": check Field " + eFieldName + 
			     " part " + aind + " file " + 
			     (actual[aind].fileName || "<no file name>"));
		    aind += 1;
		}
	    } else {
		assert_greater_than(actual.length, aind, 
				    "missing field: " +
				    expected[eind].fieldName);
		assert_equals(actual[aind].fieldName, eFieldName,
			      "field names match");
		assert_equals(actual[aind].body, encode_utf8(expected[eind].body),
			      "field values match");
		aind += 1; 
	    }
	    eind += 1;
	}
	assert_equals(aind, actual.length, "extra value");
    }

    function gotMessage (e) {
        var response = JSON.parse(e.data);
        var match = response.url.match(/[?]op=echo&id=(.*)&enc=(.*)&data=(.*)$/);
	assert_true(!! match, "test harness error");
        var foundTest = testValues[decodeURIComponent(match[1])];
        foundTest.asyncTest.step(function () {
            testMatch(processResponse(response, foundTest),
                      foundTest);
        });
        foundTest.asyncTest.done();
    }

    //54.187.112.177
    var echoServer = 'http://localhost:8000/echo-request.js';

    function generateFrameContent(td, responseID, enc) {
        var cnt = '<!DOCTYPE html><html>\n<head>\n<title>Form Test ' +
            td.testName +
            '</title>\n<meta charset=' + enc + '>\n' +
            '</head>' +
            '<body><h1>subframe ' + td.testName + ' (in ' + enc + ')</h1>\n' +
            '<form id="form" action="' +
            echoServer + '?op=echo&id=' + td.testName + 
	    '&enc=' + (td.encoding || 'utf8' ) + 
	    '&data=' + 
	    encodeURIComponent(JSON.stringify(td)) +
            '"' +
	    (responseID? ' target="' + responseID + '"' : '') +
	    ' method="POST" enctype="multipart/form-data">\n';


        td.testFields.forEach(function (obj) {
            cnt += '<input type=' + 
		(obj.type || 'text')  + 
		(obj.multiple ? ' multiple="multiple"' : '') +
		' name="' + obj.fieldName +
                '" value="' + obj.body + '">\n';
        });
	if (td.manual) {
	    return cnt + 'Press Submit\n<input type="submit">' +
		'</form></body></html>';
        }
        return cnt +
	    '</form><script>\n' +
            'document.getElementById("form").submit();' +
            '<' + '/script>\n</body></html>';
    }

    var testObj, testName, formFrame  = null, responseName, responseFrame;
    var test, testSub, frameName;

    // set up event listener; events won't fire until form is populated
    if(window.addEventListener) {
        window.addEventListener("message", gotMessage, false);
    } else {
        console.warn("no addEventListener");
        window.onmessage(gotMessage);
    }

    for (testName in testValues) {
        if (testValues.hasOwnProperty(testName)) {
            testObj = testValues[testName];
            testObj.testName = testName;
            frameName = 'form-' + testName;
            formFrame = document.getElementById(frameName);
            if (! formFrame) {
                formFrame = document.createElement("iframe");
                formFrame.setAttribute("id", frameName);

		// formFrame.setAttribute("sandbox", "allow-same-origin allow-top-navigation allow-forms allow-scripts");

                formAdd.appendChild(formFrame);
		formAdd.appendChild(document.createElement("br"));
            }
	    responseName = "";
	    // some browsers don't do targeting another frame
	    if (false) {
		responseFrame = document.createElement("iframe");
		responseName = "response-" + testName;
		responseFrame.setAttribute("id", responseName);
		formAdd.appendChild(responseFrame);
	    }

            test = async_test("Multipart/form-data test " + testName, 
			      (testObj.manual? {timeout: 600000} : null)
			     );
	    // test.step(function() {assert_true(true)});

	    var opEnc = testObj.encoding || 'utf8';

            testSub = generateFrameContent(testObj, responseName, opEnc);
            testObj.asyncTest = test;

	    // formFrame.srcdoc = testSub;
	    // formFrame.src = "data:text/html;charset=utf8;base64," + Base64.encode(testSub);
            formFrame.src = echoServer + '?op=get&id=' + testName + 
		'&enc=' + opEnc +
		'&data=' + encodeURIComponent(testSub);
        }
    }
}


