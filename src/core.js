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
		var scope = {
			// 'subscribe': noop
		}
		factory(scope);
		//生成带get set控制器与自定义事件能力的vm对象
		var model = modelFactory(scope);
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

					alert(newValue)
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


	function collectSubscribers(accessor) { //收集依赖于这个访问器的订阅者
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
	}


	//执行绑定
	function executeBindings(bindings, vModel){
		$.each(bindings,function(i,data){
			parseExprProxy(data,vModel)
		})
	}


	function parseExprProxy(data,vModel){
		data.args = vModel;
		parseExpr(data, vModel)
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

    /*********************************************************************
     *                         依赖收集与触发                             *
     **********************************************************************/

    function registerSubscriber(data) {
        Registry[expose] = data //暴光此函数,方便collectSubscribers收集
        MVVM.openComputedCollect = true //针对函数类型的求值处理,不进行get
		if (data.evaluator) { //如果是求值函数
			data.handler(data.evaluator(data.args), data.element, data)
		}
        MVVM.openComputedCollect = false
        delete Registry[expose]
    }


	//生成求值函数与
	//视图刷新函数
	function parseExpr(data,vModel){
		var dataType = data.type
		var name = "vm" + expose;
		var prefix = "var " + data.value + " = " + name + "." + data.value;

		//绑定类型
		if (dataType === 'click') {
			code = 'click'
			code = code.replace("(", ".call(this,");
            code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
            var lastIndex = code.lastIndexOf("\nreturn")
            var header = code.slice(0, lastIndex)
            var footer = code.slice(lastIndex)
			code = header + "\nif(MVVM.openComputedCollect) return ;" + footer;
			var fn = Function.apply(Function, [name].concat("'use strict';\n" + prefix + ";" + code))
		} else {
			var code = "\nreturn " + data.value + ";";
			var fn = Function.apply(Function, [name].concat("'use strict';\n" + prefix + ";" + code))
			fn.call(fn, vModel)
		}

		//生成求值函数
		data.evaluator = fn;
	}

	//处理句柄
	var bindingExecutors = {
		//修改css
		css: function(val, elem, data) {
			var method = data.type,
				attrName = data.param;
			$(elem).css(attrName, val)
		},
        click: function(val, elem, data) {
            var fn = data.evaluator
            var args = data.args
            var vmodels = data.vmodels
			var callback = function(e) {
				return fn(args).call(this, e)
			}
			elem.addEventListener('click', callback, false)

            data.evaluator = data.handler = noop
        },
	}

})();




//==============================参考========================================

//扫描属性节点
function scanAttr(element, vModel){
	var attributes = element.attributes
	var bindings = [];

	for (var i = 0, attr; attr = attributes[i++];) {
		//http://www.zeali.net/entry/388
		if (attr.specified) { //提高筛选的性能,判断是否设了值
			// console.log(attr)
		}
	}
	executeBindings(bindings, vModel); //执行绑定
	scanNodes(element, vModel) //扫描子孙元素
}

//扫描子节点
function scanNodes(parent, vModel) {
	var node = parent.firstChild;
    while (node) {
        var nextNode = node.nextSibling
		if (node.nodeType === 1) {
			scanTag(node, vModel) //扫描元素节点
		} else if (node.nodeType === 3) {
			scanText(node, vModel) //扫描文本节点
		}
        node = nextNode
    }
}

//扫描文本节点
function scanText(){

}


//等价Object.defineProperties方法的实现
//	https://developer.mozilla.org/zh-CN/docs/JavaScript/Reference/Global_Objects/Object/defineProperty
//	http://ejohn.org/blog/ecmascript-5-objects-and-properties/
function defineProperties(obj, properties) {
	function convertToDescriptor(desc) {
		function hasProperty(obj, prop) {
			return Object.prototype.hasOwnProperty.call(obj, prop);
		}

		function isCallable(v) {
			// 如果除函数以外,还有其他类型的值也可以被调用,则可以修改下面的语句
			return typeof v === "function";
		}
		if (typeof desc !== "object" || desc === null)
			throw new TypeError("不是正规的对象");
		var d = {};
		if (hasProperty(desc, "enumerable"))
			d.enumerable = !! obj.enumerable;
		if (hasProperty(desc, "configurable"))
			d.configurable = !! obj.configurable;
		if (hasProperty(desc, "value"))
			d.value = obj.value;
		if (hasProperty(desc, "writable"))
			d.writable = !! desc.writable;
		if (hasProperty(desc, "get")) {
			var g = desc.get;
			if (!isCallable(g) && g !== "undefined")
				throw new TypeError("bad get");
			d.get = g;
		}
		if (hasProperty(desc, "set")) {
			var s = desc.set;
			if (!isCallable(s) && s !== "undefined")
				throw new TypeError("bad set");
			d.set = s;
		}

		if (("get" in d || "set" in d) && ("value" in d || "writable" in d))
			throw new TypeError("identity-confused descriptor");
		return d;
	}

	if (typeof obj !== "object" || obj === null)
		throw new TypeError("不是正规的对象");

	properties = Object(properties);
	var keys = Object.keys(properties);
	var descs = [];
	for (var i = 0; i < keys.length; i++)
		descs.push([keys[i], convertToDescriptor(properties[keys[i]])]);
	for (var i = 0; i < descs.length; i++)
		Object.defineProperty(obj, descs[i][0], descs[i][1]);

	return obj;
}