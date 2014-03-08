multipart-form-data
===================

Update to RFC 2388, to allow HTML5 to normatively reference it. 

'HTML5-excerpt.html' started as an excerpt from the then-current HTML5
reference; it should be edited to match this new draft instead.


Use xml2rfc to convert .xml file into .html and .txt
	xml2rfc -f multpart-form-data.xml --text --html 

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

	-----Original Message-----
	From: Ian Hickson [mailto:ian@hixie.ch] 
	Sent: Wednesday, February 13, 2013 7:18 AM
	To: Larry Masinter
	Subject: RFC 2388 (multipart/form-data)
	
	Hey Larry,
	
	Do you know if there is anyone working on fixing RFC2388? People keep 
	asking me to update the HTML spec to just define it all inline rather than 
	deferring to the RFC since the RFC leaves a lot of stuff underdefined, but 
	I don't have the bandwidth to spec all that myself at this point.

	e.g.:
	   https://www.w3.org/Bugs/Public/show_bug.cgi?id=16909
	   https://www.w3.org/Bugs/Public/show_bug.cgi?id=19879

	Other feedback:
	   http://lists.w3.org/Archives/Public/public-whatwg-archive/2012Oct/0204.html
	   http://lists.w3.org/Archives/Public/public-whatwg-archive/2012Jul/0037.html
	   http://lists.w3.org/Archives/Public/public-whatwg-archive/2012May/0003.html

	Cheers,
	-- 
	Ian Hickson               U+1047E                )\._.,--....,'``.    fL
	http://ln.hixie.ch/       U+263A                /,   _.. \   _\  ;`._ ,.
	Things that are impossible just take longer.   `._.-(,_..'--(,_..'`-.;.'
