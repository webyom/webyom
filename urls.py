from django.conf.urls.defaults import patterns, include, url
from blog.views import *

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'webyom.views.home', name='home'),
    # url(r'^webyom/', include('webyom.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    (r'^login/$', 'django.contrib.auth.views.login'),
    (r'^logout/$', logout_page),
    (r'^data/read/(\d+)', read_article),
    (r'^data/write', write_article),
    (r'^data/update/(\d+)', update_article),
    (r'^data/comment/(\d+)', comment_article),
    (r'^data/del_comment', del_comment),
    (r'^data/p(\d+)', article_list),
    (r'.*', main_page),
)
