







def htmlescape(text):
    text = (text).decode('utf-8')

    from htmlentitydefs import codepoint2name
    d = dict((unichr(code), u'&%s;' % name) for code,name in codepoint2name.iteritems() if code!=38) # exclude "&"    
    if u"&" in text:
        text = text.replace(u"&", u"&amp;")
    for key, value in d.iteritems():
        if key in text:
            text = text.replace(key, value)
    return text


import html.parser as htmlparser
parser = htmlparser.HTMLParser()
text = parser.unescape('It&#39;s nice weather today, is not it?');
print(text);