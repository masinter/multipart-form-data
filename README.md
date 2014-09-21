# multipart-form-data


Update to RFC 2388, (Hopefully) to allow HTML5 to normatively reference it. 

Use xml2rfc to convert .xml file into .html and .txt
    xml2rfc multipart-form-data.xml --text --html 

Periodically submit an Internet Draft
	<https://datatracker.ietf.org/submit/>

to make a new version of
	<http://tools.ietf.org/html/draft-ietf-appsawg-multipart-form-data>

Be sure to update the file version number in the xml file.

The <http://tools.ietf.org/rfcdiff> service can be used to see 
what's new since RFC 2388.

For example, 
	<http://tools.ietf.org/rfcdiff?url1=rfc2388&url2=draft-ietf-appsawg-multipart-form-data>
will show you what's new in the latest internet draft.

The following links will convert the 'head' XML to HTML and plain text, by running the xml2rfc conversion on the raw github output:

* [To HTML](http://xml2rfc.tools.ietf.org/cgi-bin/xml2rfc.cgi?url=https://raw.githubusercontent.com/masinter/multipart-form-data/master/multipart-form-data.xml&modeAsFormat=html/ascii&type=ascii)

* [To TEXT](http://xml2rfc.tools.ietf.org/cgi-bin/xml2rfc.cgi?url=https://raw.githubusercontent.com/masinter/multipart-form-data/master/multipart-form-data.xml&modeAsFormat=txt/ascii&type=ascii)
