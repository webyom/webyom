import types
import string
from decimal import *
from django.db import models as md
from django.utils import simplejson as json
from django.core.serializers.json import DateTimeAwareJSONEncoder

def json_encode(data):
    """
    The main issues with django's default json serializer is that properties that
    had been added to a object dynamically are being ignored (and it also has 
    problems with some models).
    """
    def _any(data):
        ret = None
        if type(data) is types.ListType:
            ret = _list(data)
        elif type(data) is types.DictType:
            ret = _dict(data)
        elif isinstance(data, Decimal):
            # json.dumps() cant handle Decimal
            ret = str(data)
        elif isinstance(data, md.query.QuerySet):
            # Actually its the same as a list ...
            ret = _list(data)
        elif isinstance(data, md.Model):
            ret = _model(data)
        else:
            ret = data
        return ret

    def _model(data):
        ret = {}
        # If we only have a model, we only want to encode the fields.
        for f in data._meta.fields:
            ret[f.attname] = _any(getattr(data, f.attname))
            # And additionally encode arbitrary properties that had been added.
            fields = dir(data.__class__) + ret.keys()
            add_ons = [k for k in dir(data) if k not in fields]
        for k in add_ons:
            ret[k] = _any(getattr(data, k))
        return ret

    def _list(data):
        ret = []
        for v in data:
            ret.append(_any(v))
        return ret

    def _dict(data):
        ret = {}
        for k,v in data.items():
            ret[k] = _any(v)
        return ret

    ret = _any(data)
    return json.dumps(ret, cls=DateTimeAwareJSONEncoder)

def format_article_title(title):
    title = string.replace(title, '\'', '&#39;')
    return title

def format_article_content(content):
    content = string.replace(content, '[html:code]', '<pre class="prettyprint"><code>')
    content = string.replace(content, '[html:/code]', '</code></pre>')
    content = string.replace(content, '[icon:outgoing]', '<img src="/static/img/blank.gif" class="iconOutGoing" alt="Link to outside." />')
    content = string.replace(content, '\'', '&#39;')
    content = string.replace(content, '\r\n', '')
    content = string.replace(content, '\n', '')
    return content

def is_user_admin(user):
    if user.username == 'webyom':
        return 1
    else:
        return 0