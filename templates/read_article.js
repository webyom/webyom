_get_article_info({
	ret: {{ ret }},
	msg: '{{ msg }}',
	data: {
		article: {{ article|safe }},
		comments: [
                        {% for comment in comments %}
			{
				key_name: '{{ comment.id }}',
				author: '{{ comment.author }}',
				creation_datetime: '{{ comment.creation_datetime }}',
				content: '{{ comment.content }}',
				website: '{{ comment.website }}',
				email: '{{ comment.email }}'
			}
			,
			{% endfor %}
                ],
		is_admin: {{ is_admin }}
	}
});