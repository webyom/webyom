import datetime, time
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.template import Context as TemplateContext
from django.template.loader import get_template
from django.shortcuts import render_to_response
from django.core.paginator import Paginator
from django.contrib.auth import logout
from django.middleware.csrf import get_token
from webyom.blog.models import *
from webyom.blog import *

SITE_TIMEZONE = 8 * 3600
ARTICLE_LIST_PAGER_SIZE = 2

def main_page(request):
    get_token(request)
    return render_to_response('main_page.html', {
        'user': request.user,
        'is_admin': is_user_admin(request.user)
    })

def logout_page(request):
    logout(request)
    return HttpResponseRedirect('/')

def read_article(request, aid):
    article = Article.objects.get(id=aid)
    article.title = format_article_content(article.title)
    article.content = format_article_content(article.content)
    article.key_name = article.id
    comments = article.comment_set.all()
    for comment in comments:
        comment.creation_datetime = comment.creation_datetime.strftime("%Y-%m-%d %H:%M")
    template = get_template('read_article.js')
    vars = TemplateContext({
        'ret': 0,
        'msg': '',
        'article': json_encode({
            'title': article.title,
            'author': article.author,
            'creation_datetime': article.creation_datetime.strftime("%Y-%m-%d %H:%M"),
            'comments': article.comment_set.count(),
            'key_name': article.key_name,
            'content': format_article_content(article.content),
            'last_updater': article.last_updater,
            'last_update_datetime': article.last_update_datetime.strftime("%Y-%m-%d %H:%M")
        }), 
        'comments': comments, 
        'is_admin': is_user_admin(request.user)
    })
    response = HttpResponse()
    response['Cache-Control'] = 'no-cache'
    response.write(template.render(vars))
    return response

def write_article(request):
    category = request.POST['category']
    title = request.POST['title']
    originalWriter = request.POST['originalWriter']
    originalUrl = request.POST['originalUrl']
    content = request.POST['msgpost']
    article = Article(
        category=category, 
        title=title, 
        original_writer=originalWriter, 
        original_url=originalUrl, 
        content=content, 
        author=request.user.username, 
        creation_datetime=datetime.datetime.fromtimestamp(int(time.time() + SITE_TIMEZONE)),
        last_updater=request.user.username,
        last_update_datetime=datetime.datetime.fromtimestamp(int(time.time() + SITE_TIMEZONE)))
    article.save()
    return render_to_response('post_tmpl.js', {
        'ret': 0, 
        'msg': 'success'
    })
    
def update_article(request, aid):
    if request.method == 'POST':
        article = Article.objects.get(id=aid)
        article.category = request.POST['category']
        article.title = request.POST['title']
        article.original_writer = request.POST['originalWriter']
        article.original_url = request.POST['originalUrl']
        article.content = request.POST['msgpost']
        article.last_updater = request.user.username
        article.last_update_datetime = datetime.datetime.fromtimestamp(int(time.time() + SITE_TIMEZONE))
        article.save()
        return render_to_response('post_tmpl.js', {
            'ret': 0, 
            'msg': 'success'
        })
    else:
        article = Article.objects.get(id=aid)
        article.title = format_article_content(article.title)
        article.content = format_article_content(article.content)
        article.key_name = article.id
        return render_to_response('update_article.js', {
            'ret': 0,
            'msg': '',
            'article': json_encode({
                'title': article.title,
                'author': article.author,
                'creation_datetime': article.creation_datetime,
                'comments': 0,
                'key_name': article.key_name,
                'content': article.content,
                'last_updater': article.last_updater,
                'last_update_datetime': article.last_update_datetime
            }),
            'is_admin': is_user_admin(request.user)
        })

def comment_article(request, aid):
    author = request.POST['username']
    website = request.POST['website']
    email = request.POST['email']
    content = request.POST['msgpost']
    comment = Comment(
        article_reference=Article.objects.get(id=aid),
        author=author, 
        website=website, 
        email=email, 
        content=content,
        creation_datetime=datetime.datetime.fromtimestamp(int(time.time() + SITE_TIMEZONE)));
    comment.save()
    return render_to_response('post_tmpl.js', {
        'ret': 0, 
        'msg': 'success'
    })

def del_comment(request):
    comment = Comment.objects.get(id=request.POST['cid'])
    comment.delete()
    return render_to_response('post_tmpl.js', {
        'ret': 0, 
        'msg': 'success'
    })

def article_list(request, page):
    page = int(page)
    if page <= 0:
        page = 1
    all = Article.objects.order_by('-creation_datetime')
    pagi = Paginator(all, ARTICLE_LIST_PAGER_SIZE)
    if (page - 1) * ARTICLE_LIST_PAGER_SIZE < pagi.count:
        articles = pagi.page(page).object_list
        for article in articles:
            article.comments = article.comment_set.count()
            article.title = format_article_title(article.title)
            article.content = format_article_content(article.content)
            article.key_name = article.id
            article.creation_datetime = article.creation_datetime.strftime("%Y-%m-%d %H:%M")
            article.last_update_datetime = article.last_update_datetime.strftime("%Y-%m-%d %H:%M")
    else:
        articles = None
    if page * ARTICLE_LIST_PAGER_SIZE >= pagi.count:
        is_last_page = 1
    else:
        is_last_page = 0
    return render_to_response('article_list.js', {
        'ret': 0,
        'msg': '',
        'articles': articles, 
        'is_last_page': is_last_page, 
        'page': page, 
        'is_admin': is_user_admin(request.user)
    })