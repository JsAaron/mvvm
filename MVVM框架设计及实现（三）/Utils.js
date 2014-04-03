//===============================================
//	数据源转化工厂,元数据转转成视图模型对象
//	对应多出
//	1 set/get方法
//	2 自定义事件能力
//================================================
Aaron.register('Utils', [
	'Config'
], function(Config) {

    var global = this,
        objectPrototype = Object.prototype,
        arrayPrototype = Array.prototype,
        toString = objectPrototype.toString


	var utils = {

		slice: arrayPrototype.slice,

		//类型判断
        typeOf: function(value) {
            if (value === null) {
                return 'null';
            }

            var type = typeof value;

            if (type === 'undefined' || type === 'string' || type === 'number' || type === 'boolean') {
                return type;
            }

            var typeToString = toString.call(value);

            switch(typeToString) {
                case '[object Array]':
                    return 'array';
                case '[object Date]':
                    return 'date';
                case '[object Boolean]':
                    return 'boolean';
                case '[object Number]':
                    return 'number';
                case '[object RegExp]':
                    return 'regexp';
            }

            if (type === 'function') {
                return 'function';
            }

            if (type === 'object') {
                if (value.nodeType !== undefined) {
                    if (value.nodeType === 3) {
                        return (/\S/).test(value.nodeValue) ? 'textnode' : 'whitespace';
                    }
                    else {
                        return 'element';
                    }
                }

                return 'object';
            }
        },

		UUID: function() {
			return "aaron-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		},

		/**
		 * 创建一个没有原形的对象
		 * 模式hash排列
		 * @return {[type]} [description]
		 */
	    hash: function () {
	        return Object.create(null)
	    },

		ensure: function(target, item) {
			//只有当前数组不存在此元素时只添加它
			if (target.indexOf(item) === -1) {
				target.push(item)
			}
			return target;
		},

		//转化一组
		defProtectes: function(object, values) {
			Object.defineProperties(object, values);
		},

		withValue: function(access) {
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
		},

		isEqual: function(v1, v2) {
			if (v1 === 0 && v2 === 0) {
				return 1 / v1 === 1 / v2
			} else if (v1 !== v1) {
				return v2 !== v2
			} else {
				return v1 === v2;
			}
		},

		//得到属性节点，并且移除
		attr: function(el, type) {
			var attr = Config.prefix + type;
			var val = el.getAttribute(attr)
			//移除指令
			if (val !== null) {
				el.removeAttribute(attr)
			}
			return val
		},

	}

	return utils;
});