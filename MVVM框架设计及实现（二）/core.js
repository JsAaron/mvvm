/****************************************************************
 * 		 前端MVVM框架的实现
 * 		 	实现第一步：双向绑定
 * 		 @by Aaron
 * 		     分析的源码:https://github.com/RubyLouvre/avalon
 *          	 github:https://github.com/JsAaron/aaMVVM
 *          	 blog:http://www.cnblogs.com/aaronjs/
 *****************************************************************/


(function(){
	var Registry = {} //将函数曝光到此对象上，方便访问器收集依赖
	var prefix = 'ao-'; //命名私有前缀
	var expose = Date.now();
	var subscribers = 'aaron-' + expose;
	var stopRepeatAssign = false
	function noop() {}

	MVVM = function() {};

	var VMODELS = MVVM.vmodels = {};
	MVVM.define = function(name, factory) {
		var scope = {};
		//收集所有定义
		factory(scope);

		//生成带get set控制器与自定义事件能力的vm对象
		var model = modelFactory(scope);

		//改变函数引用变成转化后vm对象,而不是scope对象
		stopRepeatAssign = true
		factory(model)
		stopRepeatAssign = false;

		model.$id = name;
		return VMODELS[name] = model;
	};


	function modelFactory(scope) {
		var vModel = {}, //真正的视图模型对象
			originalModel = {}; //原始模型数据

		var accessingProperties = {}; //监控属性,转化成set get访问控制器
		var watchProperties = arguments[2] || {} //强制要监听的属性
	 	var normalProperties = {} //普通属性

		//分解创建句柄
		for (var k in scope) {
			resolveAccess(k, scope[k], originalModel, normalProperties, accessingProperties, watchProperties);
		}

		//转成访问控制器
		vModel = Object.defineProperties(vModel, withValue(accessingProperties));

		//没有转化的函数,混入到新的vm对象中
	    for (var name in normalProperties) {
	        vModel[name] = normalProperties[name]
	    }

		watchProperties.vModel = vModel
		aaObserver.call(vModel); //赋予自定义事件能力
	 	vModel.$id = generateID()
	 	vModel.$accessors = accessingProperties
		vModel.$originalModel = originalModel; //原始值
		vModel[subscribers] = []
		return vModel
	}

	//转成访问控制器
	//set or get
	function resolveAccess(name, val, originalModel, normalProperties, accessingProperties, watchProperties) {

		//缓存原始值
		originalModel[name] = val

		var valueType = $.type(val);

		//如果是函数，不用监控
		if (valueType === 'function') {
			return normalProperties[name] = val
		}

		var accessor, oldArgs

		if (valueType === 'number') {
			//创建监控属性或数组，自变量，由用户触发其改变
			accessor = function(newValue){
				var vmodel = watchProperties.vModel
				var preValue = originalModel[name];
				if (arguments.length) { //set
					if (stopRepeatAssign) {
						return //阻止重复赋值
					}
					//确定是新设置值
					if (!isEqual(preValue, newValue)) {
						originalModel[name] = newValue //更新$model中的值
						//自身的依赖更新
						notifySubscribers(accessor);
					}
				} else { //get
					collectSubscribers(accessor) //收集视图函数
					return accessor.$vmodel || preValue //返回需要获取的值
				}
			};
			accessor[subscribers] = [] //订阅者数组
			originalModel[name] = val
		}

		//保存监控处理
		accessingProperties[name] = accessor
	}

	 //通知依赖于这个访问器的订阅者更新自身
	function notifySubscribers(accessor) {
		var list = accessor[subscribers]
		if (list && list.length) {
			var args = [].slice.call(arguments, 1)
			for (var i = list.length, fn; fn = list[--i];) {
				var el = fn.element
				fn.handler(fn.evaluator.apply(0, fn.args || []), el, fn)
			}
		}
	}


	//收集依赖于这个访问器的订阅者
	function collectSubscribers(accessor) {
		if (Registry[expose]) { //只有当注册了才收集
			var list = accessor[subscribers]
			list && ensure(list, Registry[expose]) //只有数组不存在此元素才push进去
		}
	}

	function ensure(target, item) {
		//只有当前数组不存在此元素时只添加它
		if (target.indexOf(item) === -1) {
			target.push(item)
		}
		return target;
	}


	//创建对象访问规则
	function withValue(access) {
	    var descriptors = {}
	    for (var i in access) {
	        descriptors[i] = {
				get          : access[i],
				set          : access[i],
				enumerable   : true,
				configurable : true
	        }
	    }
	    return descriptors
	}


	function generateID() {
	    return "aaron" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
	}


	//======================节点绑定============================

	var scanTag = MVVM.scanTag = function(element, vModel) {
		var div = document.getElementById('aa-attr');
		var p = document.getElementById('aa-text');
		var attrs = div.attributes;
		var bindings = [];//存储绑定数据
		$.each(attrs, function(index, ele) {
			var match;
			if (match = ele.name.match(/ao-(\w+)-?(.*)/)) {
				//如果是以指定前缀命名的
				var type = match[1]
	            var param = match[2] || ""
	            var binding = {
					type    : type,
					param   : param,
					element : div,
					name    : match[0],
					value   : ele.value
	            }
	            bindings.push(binding)
			}
		})
		executeBindings(bindings,VMODELS['box'])

		//解析文本类型
		executeBindings([{
			filters: undefined,
			element: document.getElementById('aa-text'),
			nodeType: 3,
			type: "text",
			value: " w "
		}], VMODELS['box'])
	}


	//执行绑定
	function executeBindings(bindings, vModel){
		$.each(bindings,function(i,data){
			bindingHandlers[data.type](data, vModel)
			if (data.evaluator && data.name) { //移除数据绑定，防止被二次解析
				//chrome使用removeAttributeNode移除不存在的特性节点时会报错 https://github.com/RubyLouvre/avalon/issues/99
				data.element.removeAttribute(data.name)
			}
		})
	}


	function parseExprProxy(code, scopes, data){
		parseExpr(code, scopes, data)
		//如果存在求值函数
		if (data.evaluator) {
			//找到对应的处理句柄
			data.handler = bindingExecutors[data.type];
			data.evaluator.toString = function() {
				return data.type + " binding to eval(" + code + ")"
			}
			//方便调试
			//这里非常重要,我们通过判定视图刷新函数的element是否在DOM树决定
			//将它移出订阅者列表
			registerSubscriber(data)
		}
	}

	//生成求值函数与
	//视图刷新函数
	function parseExpr(code, scopes, data){
		var dataType = data.type
		var name = "vm" + expose;
		var prefix = "var " + data.value + " = " + name + "." + data.value;
		data.args = [scopes];
		//绑定类型
		if (dataType === 'click') {
			code = 'click'
			code = code.replace("(", ".call(this,");
			code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
			var lastIndex = code.lastIndexOf("\nreturn")
			var header = code.slice(0, lastIndex)
			var footer = code.slice(lastIndex)
			code = header + "\nif(MVVM.openComputedCollect) return ;" + footer;
			var fn = Function.apply(noop, [name].concat("'use strict';\n" + prefix + ";" + code))
		} else {
			var code = "\nreturn " + data.value + ";";
			var fn = Function.apply(noop, [name].concat("'use strict';\n" + prefix + ";" + code))
		}
		//生成求值函数
		data.evaluator = fn;
	}


    /*********************************************************************
     *                         依赖收集与触发                             *
     **********************************************************************/
    function registerSubscriber(data) {
        Registry[expose] = data //暴光此函数,方便collectSubscribers收集
        MVVM.openComputedCollect = true //排除事件处理函数
        var fn = data.evaluator
		if (fn) { //如果是求值函数
			data.handler(fn.apply(0, data.args), data.element, data)
		}
        MVVM.openComputedCollect = false
        delete Registry[expose]
    }

	var bindingHandlers = {
		css: function(data, vModel) {
			var text = data.value.trim();
				data.handlerName = "attr" //handleName用于处理多种绑定共用同一种bindingExecutor的情况
			parseExprProxy(text, vModel, data)
		},
		click: function(data, vModel) {
			var value = data.value
			data.type = "on"
			data.hasArgs = void 0
			data.handlerName = "on"
			parseExprProxy(value, vModel, data)
		},
		text: function(data, vModel) {
			parseExprProxy(data.value, vModel, data)
		}
	}

	//执行最终的处理代码
	var bindingExecutors = {
		//修改css
		css: function(val, elem, data) {
			var method = data.type,
				attrName = data.param;
			$(elem).css(attrName, val)
		},
        on: function(val, elem, data) {
            var fn = data.evaluator
            var args = data.args
            var vmodels = data.vmodels
			var callback = function(e) {
				return fn.apply(0,args).call(this, e)
			}
			elem.addEventListener('click', callback, false)
            data.evaluator = data.handler = noop
        },
		text: function(val, elem, data) {
			$(elem).text(val)
		}
	}


    var isEqual = Object.is || function(v1, v2) {
        if (v1 === 0 && v2 === 0) {
            return 1 / v1 === 1 / v2
        } else if (v1 !== v1) {
            return v2 !== v2
        } else {
            return v1 === v2;
        }
    }

})();
