import os, sys
sys.path.insert(0,'C:\\Users\\HK\\Project\\webyom')
sys.path.insert(0,'C:\\Users\\HK\\Project')
os.environ['DJANGO_SETTINGS_MODULE'] = 'webyom.settings'
import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()