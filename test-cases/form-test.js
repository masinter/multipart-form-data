/*jslint indent: 4, browser: true, sloppy: true, vars: true, regexp: true, white: true, browser: true */
/*global assert_true, assert_equals, assert_greater_than, assert_object_equals, console, async_test */

function doFormTests(testValues) {

    function matchParams(orig, expectValue, expectParams, source) {
        var valueMatch = orig.match(new RegExp("^" + expectValue + "(;.*)$", "i"));
        assert_greater_than(valueMatch.length, 1, source + " should have " + expectValue);
        if ((typeof expectParams) === 'array') {
            expectParams = expectParams.join("|");
        }
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
                              paramValue.charAt(paramValue.length - 1),
                              "properly delimited " + paramName);
                paramValue = paramValue.slice(1, -1);
            }
            params[paramName] = paramValue;
            orig = orig.slice(valueMatch[0].length);
        }
        return params;
    }

    function parsePart(part) {
        var header = {};
        var hv = {};
        var headerRegExp = /^([-a-z]+): (.*)\r\n/i;
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
    }

    function processResponse(eventObj) {
        // assert_equals(eventObj.httpVersion, "1.1", "using HTTP/1.1");
        assert_equals(eventObj.method, "POST", "Method is POST");
        
        var contentType = eventObj.headers["content-type"];
        
        var boundary = matchParams(eventObj.headers["content-type"],
                                   "multipart/form-data", "boundary",
                                   "content-type header").boundary;
        
        var raw = "(phoney preface)\r\n" + eventObj.body;
        var bodyParts = raw.split("\r\n--" + boundary + "\r\n");
        var bpl = bodyParts.length;
        
        assert_greater_than(bpl, 1, "must have at least one body part");
        
        var lastPart = bodyParts[bpl-1];
        assert_greater_than(lastPart.length, 6 + boundary.length,
                            "last part is big enough");
        // should check for trailers!
        
        var lastLine = lastPart.slice(lastPart.length-(boundary.length+8));
        
        assert_equals(lastLine, 
                      "\r\n--" + boundary + "--\r\n",
                      "multipart ends with boundary line");
        
        bodyParts[bpl - 1] = lastPart.slice(0, -(boundary.length + 8));
        var index, parsedParts = [];
        //start at 1, not 0
        for (index = 1; index < bpl; index+=1) {
            parsedParts.push(parsePart(bodyParts[index]));
        }
        return parsedParts;
    }
    

    function setFrameContent(iframeDoc, content) {
	iframeDoc.open('text/html', 'replace');
	iframeDoc.write(content);
	iframeDoc.close();
    }

    function testMatch(actual, testObj) {
        assert_object_equals(actual, testObj.testFields, "form data matches expected");
    }
    function gotMessage (e) {
        var response = JSON.parse(e.data);
        var match = response.url.match(/[?]test=(.*)$/);
        var foundTest = testValues[decodeURI(match[1])];
        foundTest.asyncTest.step(function () {
            testMatch(processResponse(response),
                      foundTest);
        });
        foundTest.asyncTest.done();
    }
    

    var echoServer = 'http://localhost:8000/common/echo-request.py';

    function generateFrameContent(td) {
        var cnt = '<!DOCTYPE html><html>\n<head>\n<title>Form Test ' +
            td.testName +
            '</title>\n<meta charset=utf8>\n' + 
            '<script>console.warn("in subform for test ' + td.testName + '");</' + 'script>' +
            '</head>' +
            '<body><h1>subframe ' + td.testName + '</h1>\n' +
            '<form id="form" action="' +
            echoServer + '?test=' +     td.testName +
            '" method="POST" enctype="multipart/form-data">\n';
        
        td.testFields.forEach(function (obj) {
            cnt += '<input type=text name="' + obj.fieldName + 
                '" value="' + obj.body + '">\n';
        });
        
        return cnt +
            '</form>\n<script>\n' +
            'console.warn("submitting form for ' + td.testName + '");\n' +
            'document.getElementById("form").submit();' +
            'console.warn("submitted");' + 
            '<' + '/script>\n</body></html>';
    }

    var testObj;
    var testName;
    var formFrame  = null;
    var test;
    var testSub;
    var frameName;
    
    var formAdd = document.getElementById("form-add");

    // set up event listener; events won't fire until form is populated
    if(window.addEventListener) {
        console.warn("Event listener");
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
	        console.warn("making frame " + frameName);
                formFrame = document.createElement("iframe");
                formFrame.setAttribute("id", frameName);
		// formFrame.setAttribute("sandbox", "allow-same-origin allow-top-navigation allow-forms allow-scripts");
                formAdd.appendChild(formFrame);
            }
            test = async_test("Multipart/form-data test " + testName);
	    test.step(function() {assert_true(true)});
            testSub = generateFrameContent(testObj);
            testObj.asyncTest = test;
            console.warn("generated " + testSub);
            formFrame.srcdoc = testSub;
	    formFrame.src = 'subform-tests/' + testName  + ".html";
        }
    }
}


