if(!$)var $={};
$.localStorage=function(){function f(a,b,c){var d,g;c=c||{};if(b!==null&&e.name=="cookie")b=b||j;if(b&&!e.noProxy){b=typeof b=="object"&&b.src||j;g=c.cb;c.cb=function(n){document.body.removeChild(d);g&&g(n)};d=document.createElement("iframe");d.style.display="none";d=document.body.appendChild(d);d.action=a;for(var k in c)d[k]=c[k];d.src=b}else return o[a](c)}function l(a,b,c){var d;if(a){if(d=a.match(/(.*)\[expires=(\d+)\]$/))if(d[2]<(new Date).getTime()){a=undefined;m(b,{proxy:c})}else a=d[1]}else a=
undefined;return a}function m(a,b){b=b||{};return f("remove",b.proxy,{key:a})}var j="http://www.webyom.org/static/inc/webyom-js/local_storage_proxy.html",e={name:"default",noProxy:true,db:{},set:function(a,b){this.db[a]=b},get:function(a){return this.db[a]},remove:function(a){delete this.db[a]},clear:function(){this.db={}}},h=[{name:"localStorage",isSupported:!!window.localStorage,set:function(a,b){localStorage.setItem(a,b)},get:function(a){return localStorage.getItem(a)},remove:function(a){localStorage.removeItem(a)},
clear:function(){localStorage.clear()},init:function(){}},{name:"globalStorage",isSupported:!!window.globalStorage,db:null,set:function(a,b){try{this.db.setItem(a,b);return 1}catch(c){return 0}},get:function(a){var b;try{b=(b=this.db.getItem(a))&&b.value||b}catch(c){}return b},remove:function(a){try{db.removeItem(a)}catch(b){}},clear:function(){try{for(var a in this.db)this.db.removeItem(a)}catch(b){}},init:function(){this.db=globalStorage[document.domain]}},{name:"userData",isSupported:!!window.ActiveXObject,
db:null,set:function(a,b){var c=this.db.expires.toString();if(c!==""&&c.indexOf("1983")!==-1)this.db.expires=(new Date(+new Date+31536E6)).toUTCString();try{this.db.setAttribute(a,b);this.db.save("WEBYOM_LOCAL_STORAGE");return 1}catch(d){return 0}},get:function(a){this.db.load("WEBYOM_LOCAL_STORAGE");return this.db.getAttribute(a)},remove:function(a){this.db.removeAttribute(a);this.db.save("WEBYOM_LOCAL_STORAGE")},clear:function(){this.db.expires=(new Date(4176288E5)).toUTCString();this.db.save("WEBYOM_LOCAL_STORAGE")},
init:function(){this.db=document.documentElement||document.body;this.db.addBehavior("#default#userdata");this.db.load("WEBYOM_LOCAL_STORAGE")}},{name:"cookie",isSupported:typeof document.cookie=="string",set:function(a,b,c){var d;c=c||720;d=new Date;d.setTime(d.getTime()+36E5*c);document.cookie=a+"="+b+"; "+("expires="+d.toGMTString()+"; ")+"path=/static/inc/webyom-js/; domain=webyom.org;"},get:function(a){return(a=document.cookie.match(RegExp("(?:^|;\\s*)"+a+"=([^;]*)")))&&a[1]},remove:function(a){this.set(a,
"",-24)},clear:function(){var a=document.cookie.match(/\w+=[^;]*/g);if(a)for(var b=0,c=a.length;b<c;b++)this.remove(a[b].split("=")[0])},init:function(){}}];for(i=0;i<h.length;i++)if(h[i].isSupported){e=h[i];e.init();break}var o={set:function(a){var b=e.set(a.key,a.val,a.life);return a.cb?a.cb(b):b},get:function(a){var b=e.get(a.key);return a.cb?a.cb(b):b},remove:function(a){e.remove(a.key);a.cb&&a.cb()},clear:function(a){e.clear();a.cb&&a.cb()}};return{_ID:121,_db:e,_do:f,set:function(a,b,c){c=c||
{};if(c.life&&e.name!="cookie")b+="[expires="+((new Date).getTime()+c.life*36E5)+"]";return f("set",c.proxy,{key:a,val:b,cb:c.callback,life:c.life})},get:function(a,b){var c;b=b||{};if(b.callback)return f("get",b.proxy,{key:a,cb:function(d){b.callback(l(d,a,b.proxy))}});else{c=f("get",b.proxy,{key:a});return l(c,a,b.proxy)}},remove:m,clear:function(a){a=a||{};return f("clear",a.proxy,{})}}}();
