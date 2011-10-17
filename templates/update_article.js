_get_article_info({
	ret: {{ ret }},
	msg: '{{ msg }}',
	data: {
		article: {{ article|safe }},
		is_admin: {{ is_admin }}
	}
});