var easyHistory=function(){function o(a){if(a!=e){p=e;e=a;if(h.ie&&h.version<8)if(i){if(a!=i.contentWindow.location.search.replace(/^\?/,""))i.src=q+"?"+a}else{var b=document.createElement("iframe");b=document.body.appendChild(b);b.id="easyHistoryIeFrame";b.style.display="none";b.src=q+"?"+a;i=b}}}function c(){var a=r();h.safari&&!f&&typeof window.onhashchange=="undefined"&&setTimeout(arguments.callee,k);if(a!=e){$.console.log("easyHistory found mark changed, "+a);o(a);l&&l.call(s,a,t(a))}}function t(a){return g[j[a]]}
function r(){return f?location.pathname.replace(/^\//,""):location.hash?location.hash.replace(/^#!\/?/,""):""}var q="/static/inc/easy_history/history_blank.html",k=100,d=navigator.userAgent.toLowerCase(),h={version:+(d.match(/(?:version|firefox|chrome|safari|opera|msie)[\/: ]([\d]+)/)||[0,0])[1],ie:/msie/.test(d)&&!/opera/.test(d),safari:/safari/.test(d)&&!/chrome/.test(d)&&!/android/.test(d)},i=null,j={},g=[],m=true,n=100,p,e,l=null,s=null,f=!!history.pushState;return{init:function(a){a=a||{};m=
typeof a.cacheEnabled!="undefined"?a.cacheEnabled:m;n=a.cacheSize||n;if(f){a=window;a.addEventListener?a.addEventListener("popstate",c,false):a.attachEvent("onpopstate",c)}else if(typeof window.onhashchange!="undefined"){a=window;a.addEventListener?a.addEventListener("hashchange",c,false):a.attachEvent("onhashchange",c)}else h.safari?setTimeout(c,k):setInterval(c,k);c()},setListener:function(a,b){l=typeof a=="function"?a:null;s=b||null},setCache:function(a,b){if(typeof a=="string")if(m){g.push(b);
j[a]=g.length-1;delete g[j[a]-n]}},getCache:t,clearCache:function(){j={};g=[]},setMark:function(a,b,u){if(b)document.title=b;if(!(typeof a!="string"||a==e)){if(f)history.pushState(u,b||document.title,"/"+a);else location.hash="!"+a;o(a)}},getMark:r,getPrevMark:function(){return p},isSupportHistoryState:function(){return f}}}();
