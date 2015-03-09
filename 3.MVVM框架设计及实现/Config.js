//===============================================
//
//	全局配置文件
//
//================================================
Aaron.register('Config',function(Directive) {
	Aaron.root = document.documentElement;
	Aaron.Registry = {} //将函数曝光到此对象上，方便访问器收集依赖
	Aaron.expose = Date.now();
	Aaron.subscribers = 'aaron-' + Aaron.expose;
	Aaron.stopRepeatAssign = false;
	Aaron.documentFragment = document.createDocumentFragment();


	return {
		'prefix': 'ao-' //命名私有前缀
	}
});