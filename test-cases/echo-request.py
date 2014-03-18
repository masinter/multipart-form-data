import json

def main(request, response):
	"""Simple handler that causes HTTP POST to be echoed back as HTML and do a postMessage on the parent.window"""

	response.status = 200
	response.headers.set("Content-Type", "text/html");
	response.headers.set("Access-Control-Allow-Origin", "*");

	qReq = dict()


	if (request.protocol_version.startswith('HTTP/')):
		qReq["httpVersion"] = request.protocol_version[5:]
	else:
		qReq["protocolVersion"] = request.protocol_version

	qReq["method"] = request.method

	qReq["url"] = request.url

	qReq["headers"] = dict()
	for name,value in request.headers.iteritems():
		qReq["headers"][name] = value;

	qReq["body"] = request.body

	respBody = "<!doctype html><html><head><meta charset=utf-8><title>postecho.py</title></head><p>Done<body><script>window.jsonObject = ";
	respBody += json.dumps(qReq);
	respBody += "\nwindow.parent.postMessage(JSON.stringify(jsonObject), \"*\"); </script></body></html>"

	return respBody
