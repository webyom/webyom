import os, sys
sys.path.insert(0,'/www/dwebyomo/webyom.org/')
sys.path.insert(0,'/www/dwebyomo/webyom.org/libs/')
os.environ['DJANGO_SETTINGS_MODULE'] = 'webyom.settings'
import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()