//===============================================
//	数据源转化工厂,元数据转转成视图模型对象
//	对应多出
//	1 set/get方法
//	2 自定义事件能力
//================================================
Aaron.register('Compiler', [
		'Utils',
		'Emitter',
		'Binding'
	], function(Utils,Emitter,Binding) {

	var typeOf       = Utils.typeOf;
	var isEqual      = Utils.isEqual;
	var rchecktype   = /^(?:array|object)$/i; //判断当前的类型只能是数组或者对象
	var withValue    = Utils.withValue;
	var defProtectes = Utils.defProtectes;

	function Compiler(vm, name, options) {

		var compiler = this;

		compiler.options = options;

		//模型对象
		compiler.vm = vm;
		//原始模型数据
		compiler.originals = {};
		//普通属性
		compiler.commons = {};
		//监控属性,需要转化成set get访问控制器
		compiler.accessors  = {}, 
		//编译绑定
		compiler.bindings = Utils.hash()

		//=====================================================
		//	
		//		vm 设置
		//	
		//======================================================
		vm.$ = {}
		vm.$options = options
		vm.$event = null

		//解析对应的定义
		_.each(options, function(val, name) {
			compiler.resolveModel(name, val);
		})

		//转成访问控制器
		defProtectes(compiler, withValue(compiler.accessingProperties));

		//没有转化的函数,混入到新的vm对象中
		_.each(compiler.normalProperties, function(val, name) {
			compiler[name] = val
		})


		compiler.id = Utils.UUID();

		compiler[Aaron.subscribers] = []

		console.log(compiler)

		return compiler;
	}


	var VMProto = Compiler.prototype;


	//=================================================
	//
	//	解析模型,转化成对应的set/get处理方法
	//	
	//	1 监控属性
	//	2 计算属性  针对监控属性的加强
	//
	//==================================================
	VMProto.resolveModel = function(name, val) {

		var compiler = this;

		//缓存原始值
		compiler.originals[name] = val

		//得到值类型
		var valueType = typeOf(val);

		//如果是函数，不用监控，意味着这是事件回调句柄
		if (valueType === 'function') {
			return compiler.commons[name] = val
		}

		//如果值类型是对象,并且有get方法,为计算属性
		if (valueType === "object" && typeof val.get === "function" && Object.keys(val).length <= 2) {

		} else {
			//转化监控属性
			var accessor = compiler.setupObserver(name, val, valueType);
		}

		//保存监控处理
		compiler.accessors[name] = accessor;
	}

	//==================================================
	//	创建监控属性或数组，自变量，由用户触发其改变
	//	1 基本数据结构
	//	2 数组结构
	//	3 对象结构
	//====================================================
	VMProto.setupObserver = function(name, val, valueType) {

		var compiler = this,
			bindings = compiler.bindings,
			options = compiler.options,
			observer = compiler.observer = new Emitter(compiler.vm)


		var self = this;

		var set = function() {
			if (stopRepeatAssign) {
				return //阻止重复赋值
			}
			//确定是新设置值
			if (!isEqual(preValue, newValue)) {
				self.originalModel[name] = newValue //更新$model中的值
				//自身的依赖更新
				self.notifySubscribers(accessor);
			}
		}

		var get = function() {
			self.collectSubscribers(accessor) //收集视图函数
			return accessor.$vmodel || preValue //返回需要获取的值		
		}

		function accessor(newValue) {
			var vmodel   = self.watchProperties.vmodel
			var preValue = self.originalModel[name];
			if (arguments.length) {
				set(vmodel,preValue)
			} else { 
				get(vmodel,preValue);
			}
		};

		accessor[Aaron.subscribers] = [] //订阅者数组,保存所有的view依赖映射

		//生成监控属性要区分内部值的类型
		if (rchecktype.test(valueType)) { //复杂数据,通过递归处理
			//复杂结构
		} else {
			//普通的基本类型
			self.originals[name] = val;
		}
		
		return accessor;
	}


	//通知依赖于这个访问器的订阅者更新自身
	VMProto.notifySubscribers = function(accessor) {
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
	VMProto.collectSubscribers = function(accessor) {
		if (Registry[expose]) { //只有当注册了才收集
			var list = accessor[subscribers]
			list && ensure(list, Registry[expose]) //只有数组不存在此元素才push进去
		}
	}

	return Compiler;
});