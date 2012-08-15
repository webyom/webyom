#!/usr/local/bin/python
import sys, os
sys.path.insert(0, "/usr/local/bin/python")
sys.path.insert(0, "/www/251830327.host/webyom_org/htdocs")
sys.path.insert(0, "/www/251830327.host/webyom_org/htdocs/webyom")
#sys.path.insert(0, "/www/251830327.host/module.upload.dir")
os.chdir("/www/251830327.host/webyom_org/htdocs/webyom")
os.environ['DJANGO_SETTINGS_MODULE'] = "webyom.settings"
from django.core.servers.fastcgi import runfastcgi
runfastcgi(method="threaded", daemonize="false")