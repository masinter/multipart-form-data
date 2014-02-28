Test harness for multipart/form-data
=================

This is still under development. This directory contains the beginning
of a form test harness, plus some previous files originally devloped
by Hixie to test multipart/form-data.

Still in progress is to
1. complete the test harness to actually check the syntax 
2. convert Hixie's tests to this framework
3. develop additional test cases for proposed changes from published RFC.

The current architecture for the test suite is from
Jacob Goldstein <jacobg@adobe.com>, thanks!

To run this, you need [nodejs](http://nodejs.org/)

# Running the test example
1. CD to the test-cases directory
2. Start the server with the following command: 
    ```node node-server.js &``
3. Launch the form-test.html file in a browser

# How it works

* The form-test.html file is the test file    
* node-server.js sets up a simple web server on port 8888
* form-test.html loads the form from sub-form-test.html into an iframe
* The form auto-submits and sends its data, via POST, to node-server.js
* node-server.js sends back a message containing a JSON object representing the request, including raw POST data it received
* The async_test method from testharness.js is used to validate the data in the message
* testharness.js outputs the results of the comparison to the div with id="log"

