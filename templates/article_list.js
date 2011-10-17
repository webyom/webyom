_get_article_list({
	ret: {{ ret }},
	msg: '{{ msg }}',
	data: {
		articles: [
			{% for article in articles %}
			{
				key_name: '{{ article.key_name }}',
				title: '{{ article.title }}',
				author: '{{ article.author }}',
				creation_datetime: '{{ article.creation_datetime }}',
				comments: {{ article.comments }},
				content: '{{ article.content|safe }}',
				last_update_datetime: '{{ article.last_update_datetime }}',
				last_updater: '{{ article.last_updater }}'
			}
			,
			{% endfor %}
		],
		page: {{ page }},
		is_last_page: {{ is_last_page }},
		is_admin: {{ is_admin }}
	}
});