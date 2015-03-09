/****************************************************************
 * 		 前端MVVM框架的实现
 * 		 	第一弹：基本双向绑定
 * 		 	第二弹：DOM模块化模板引擎
 * 		 	第三弹：引入AMD代码组织风格,分析文件结构
 * 		 @by Aaron
 *          	源码分析博客:http://www.cnblogs.com/aaronjs/
 *          	源码分析Github:https://github.com/JsAaron/aaMVVM
 *          	Avalon源码:https://github.com/RubyLouvre/avalon
 *       DOM的处理前期全采用jQuery代替
 *****************************************************************/

Aaron.register('ViewModel', [
	'Utils',
	'Config',
	'Directive',
	'Compiler'
],function(Utils, Config, Directive, Compiler) {

	var vmCache     = {}; //缓存所有vm对象
	var interpolate = /\{\{(.*?)\}\}/; //匹配{{任何}}
	var slice       = Utils.slice;
	var matchAttr   = /ao-(\w+)-?(.*)/;//匹配属性 ao-css-width

	//模型对象
	var ViewModel = function(name, options) {

		//编译转化后的set get模型对象
		this.compiler = new Compiler(this, name, options);

		this.name = name;

		//查找到根节点
		this.el = this.rootElement(name);

		//建立绑定关系
		this.compile(this.el)

		vmCache[name] = this;
	};

	//定义模型接口
	ViewModel.define = function(name, options) {
		if (!vmCache[name]) {
			return new ViewModel(name, options);
		}
	};

	//实现数据视图绑定
	ViewModel.binding = function(name, node) {
		var vm;
		if (vm = vmCache[name]) {
			vm.compile(node);
		}
	}


	var ViewModelProto = ViewModel.prototype;

	/**
	 * 找到根节点
	 * @param  {[type]} name [description]
	 * @return {[type]}      [description]
	 */
	ViewModelProto.rootElement = function(name){
		return document.getElementById(name)
	}

	/**
	 * 开始建立绑定关系
	 * @param  {[type]} node [description]
	 * @return {[type]}      [description]
	 */
	ViewModelProto.compile = function(node) {
		var nodeType = node.nodeType
		if (nodeType === 1) {
			this.compileElement(node)
		} else if (nodeType === 3 && interpolate.test(node.data)) {
			this.compileTextNode(node)
		}
		//如果当前元素还有子节点,递归
		if (node.hasChildNodes()) {
			slice.call(node.childNodes).forEach(function(node) {
				this.compile(node)
			}, this)
		}
	}

	/**
	 * 解析元素节点
	 * @return {[type]} [description]
	 */
	ViewModelProto.compileElement = function(node) {
		//保证这个节点上有属性
		if (node.hasAttributes()) {
			var prefix = Config.prefix,
				attrs = slice.call(node.attributes),
				i = attrs.length,
				attr, match, type, directive;

			while (i--) { //多个属性
				attr = attrs[i];
				if (match = attr.name.match(matchAttr)) { //匹配ao-开头指令
					type = match[1];
					//如果能找到对应的指令处理
					if (directive = Directive.createHandlers(type, attr.value, node, this)) {
						this.bindDirective(directive)
					}
				}
			}
		}
	}

	/**
	 * 解析文本节点
	 * @return {[type]} [description]
	 */
	ViewModelProto.compileTextNode = function(node) {
		// console.log(node)
	}


	/**
	 * 绑定指令
	 * @return {[type]} [description]
	 */
	ViewModelProto.bindDirective = function(directive){

		if (!directive) return;

		// console.log(directive)
	}




	// function parseExprProxy(code, scopes, data) {
	// 	parseExpr(code, scopes, data)
	// 	//如果存在求值函数
	// 	if (data.evaluator) {
	// 		//找到对应的处理句柄
	// 		data.handler = bindingExecutors[data.type];
	// 		data.evaluator.toString = function() {
	// 			return data.type + " binding to eval(" + code + ")"
	// 		}
	// 		//方便调试
	// 		//这里非常重要,我们通过判定视图刷新函数的element是否在DOM树决定
	// 		//将它移出订阅者列表
	// 		registerSubscriber(data)
	// 	}
	// }

	// //生成求值函数与
	// //视图刷新函数
	// function parseExpr(code, scopes, data) {
	// 	var dataType = data.type
	// 	var name = "vm" + expose;
	// 	var prefix = "var " + data.value + " = " + name + "." + data.value;
	// 	data.args = [scopes];
	// 	//绑定类型
	// 	if (dataType === 'click') {
	// 		code = 'click'
	// 		code = code.replace("(", ".call(this,");
	// 		code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
	// 		var lastIndex = code.lastIndexOf("\nreturn")
	// 		var header = code.slice(0, lastIndex)
	// 		var footer = code.slice(lastIndex)
	// 		code = header + "\nif(MVVM.openComputedCollect) return ;" + footer;
	// 		var fn = Function.apply(noop, [name].concat("'use strict';\n" + prefix + ";" + code))
	// 	} else {
	// 		var code = "\nreturn " + data.value + ";";
	// 		var fn = Function.apply(noop, [name].concat("'use strict';\n" + prefix + ";" + code))
	// 	}
	// 	//生成求值函数
	// 	data.evaluator = fn;
	// }

	// /*********************************************************************
	//  *                         依赖收集与触发                             *
	//  **********************************************************************/
	// function registerSubscriber(data) {
	// 	Registry[expose] = data //暴光此函数,方便collectSubscribers收集
	// 	MVVM.openComputedCollect = true //排除事件处理函数
	// 	var fn = data.evaluator
	// 	if (fn) { //如果是求值函数
	// 		data.handler(fn.apply(0, data.args), data.element, data)
	// 	}
	// 	MVVM.openComputedCollect = false
	// 	delete Registry[expose]
	// }

	// var bindingHandlers = {
	// 	css: function(data, vmodel) {
	// 		var text = data.value.trim();
	// 		data.handlerName = "attr" //handleName用于处理多种绑定共用同一种bindingExecutor的情况
	// 		parseExprProxy(text, vmodel, data)
	// 	},
	// 	click: function(data, vmodel) {
	// 		var value = data.value
	// 		data.type = "on"
	// 		data.hasArgs = void 0
	// 		data.handlerName = "on"
	// 		parseExprProxy(value, vmodel, data)
	// 	},
	// 	text: function(data, vmodel) {
	// 		parseExprProxy(data.value, vmodel, data)
	// 	}
	// }

	// //执行最终的处理代码
	// var bindingExecutors = {
	// 	//修改css
	// 	css: function(val, elem, data) {
	// 		var method = data.type,
	// 			attrName = data.param;
	// 		$(elem).css(attrName, val)
	// 	},
	// 	on: function(val, elem, data) {
	// 		var fn = data.evaluator
	// 		var args = data.args
	// 		var vmodels = data.vmodels
	// 		var callback = function(e) {
	// 			return fn.apply(0, args).call(this, e)
	// 		}
	// 		elem.addEventListener('click', callback, false)
	// 		data.evaluator = data.handler = noop
	// 	},
	// 	text: function(val, elem, data) {
	// 		if (data.nodeType === 3) {
	// 			data.node.data = val
	// 		} else {
	// 			$(elem).text(val)
	// 		}
	// 	}
	// }

	// var isEqual = Object.is || function(v1, v2) {
	// 		if (v1 === 0 && v2 === 0) {
	// 			return 1 / v1 === 1 / v2
	// 		} else if (v1 !== v1) {
	// 			return v2 !== v2
	// 		} else {
	// 			return v1 === v2;
	// 		}
	// 	}


	return {
		'define'  : ViewModel.define,
		'binding' : ViewModel.binding
	}
}, function(expose) {
	//初始化模块
	Aaron.define = expose.define;
	Aaron.binding = expose.binding;
})