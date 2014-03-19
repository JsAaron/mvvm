/****************************************************************
 * 		 前端MVVM框架的实现
 * 		 	实现第一步：双向绑定
 * 		 @by Aaron
 * 		     分析的源码:https://github.com/RubyLouvre/avalon
 *          	 github:https://github.com/JsAaron/aaMVVM
 *          	 blog:http://www.cnblogs.com/aaronjs/
 *****************************************************************/

var prefix = 'ao-'; //命名私有前缀
var expose = Date.now();
var subscribers = 'aaron-' + expose;


var MVVM = function() {};

var VMODELS = MVVM.vmodels = {};
MVVM.define = function(name, factory) {
	var scope = {};
	factory(scope);
	//生成带get set控制器与自定义事件能力的vm对象
	var model = modelFactory(scope);
	model.$id = name;
	return VMODELS[name] = model;
};

function modelFactory(scope) {
	var access,
		vModel = {}, //真正的视图模型对象
		originalModel = {}; //原始模型数据

	access = conversionAccess(scope, originalModel); //转成监控属性
	vModel = Object.defineProperties(vModel, withValue(access)); //转成访问控制器
	aaObserver.call(vModel); //赋予自定义事件能力
	vModel.$model = originalModel;
	return vModel
}

//转成访问控制器
//set or get
function conversionAccess(scope, originalModel) {
	var objAccess = {};

	for (var k in scope) {

		//缓存原始数据
		originalModel[k] = scope[k]

		accessor = objAccess[k] = function(setValue) { //set,get访问控制器

			//上一个值
			var preValue = originalModel[k];

			//set
			if (arguments.length) {

			} else { //get
				return accessor.$vmodel || preValue
			}
		}
	    accessor[subscribers] = [] //订阅者数组
	}
	return objAccess;
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
		parseExpr(data,vModel)
	})
}

//生成求值函数与视图刷新函数
function parseExpr(data,vModel){
	console.log(data,vModel)
	var name = "vm" + expose;
	var prefix = "var " + data.value + " = " + name + "." + data.value;
	var code = "\nreturn " + data.value + ";";
	var fn = Function.apply(Function, [name].concat("'use strict';\n" + prefix + ";" + code))
	if (data.type !== "on") {
		fn.call(fn, vModel)
	}
}






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