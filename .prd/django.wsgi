import os, sys
sys.path.insert(0,'/www/251830327.host/webyom_org/')
sys.path.insert(0,'/www/251830327.host/webyom_org/libs/')
os.environ['DJANGO_SETTINGS_MODULE'] = 'webyom.settings'
import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()