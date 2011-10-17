from django.db import models

class Article(models.Model):
    original_writer = models.CharField(max_length=100, blank=True)
    original_url = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=100)
    title = models.CharField(max_length=100)
    content = models.TextField()
    author = models.CharField(max_length=100)
    creation_datetime = models.DateTimeField()
    last_updater = models.CharField(max_length=100, blank=True)
    last_update_datetime = models.DateTimeField(blank=True)
    hidden = models.BooleanField(default=False)
    comment_closed = models.BooleanField(default=False)

class Comment(models.Model):
    article_reference = models.ForeignKey(Article)
    content = models.TextField()
    author = models.CharField(max_length=100)
    website = models.CharField(max_length=100, blank=True)
    email = models.CharField(max_length=100, blank=True)
    creation_datetime = models.DateTimeField()
    deleted = models.BooleanField(default=False)
