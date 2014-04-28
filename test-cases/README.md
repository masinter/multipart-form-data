Test harness for multipart/form-data
=================

This directory contains the beginning of a form test harness.


Still in progress is to:
1. convert Hixie's tests (in 'old') to this framework
2. develop additional test cases for proposed changes from published RFC.

The current architecture for the test suite is from
Jacob Goldstein <jacobg@adobe.com> with additional help
from Philippe Le Hegaret <plh@w3.org>   thanks!

To run this, you need [nodejs](http://nodejs.org/), and iconv-lite as a module

# Running the test example

1. CD to the test-cases directory
2. Start the server with the following command: 
	node echo-request.js &
3. Launch the form-test.html file in a browser

# How it works

* The form-test.html file is the test file
* form-test.js contains a form-test specific shared library
* the 'resources' files (testharness.js and testharnessreport.js) come from the W3C web platform test framework
	https://github.com/w3c/testharness.js
* echo-request.js sets up a web server on port 8000, it's needed to generate forms
   (echo-request.py python server was started, but needs an update)
* form-test.html loads the form into an iframe
* The form then auto-submits and sends its data, via POST, to echo-request.js
* echo-request sends back a result page which, when loaded, sends a message
   containing a JSON object representing the request, including raw POST data it received
* The async_test method from testharness.js is used to validate the data in the message
* testharness.js outputs the results of the comparison to the div with id="log"
* The test framework appends iframes with forms, results, and additional
  information into another div.

Test cases needed:
------------------
* boundary quoted: Media type paramters are supposed to be quoted, 
  but most implementations don't seem to quote 'boundary'. (This is
  not in multipart/from-data itself, though)
* Guessing the charset of the form?
  
* name and filename quoted?

* non-ascii: try UTF-8, chinese, japanese
  non-ascii field names
  non-ascii field values
  non-ascii file name
  non-text file content
  multiple files


