//==================================================
//	创建监控属性或数组，自变量，由用户触发其改变
//	1 基本数据结构
//	2 数组结构
//	3 对象结构
//====================================================
Aaron.register('Binding', function(Directive) {

	// VMProto.setupObserver = function(name, val, valueType) {

	// 	var compiler = this,
	// 		bindings = compiler.bindings,
	// 		options = compiler.options,
	// 		observer = compiler.observer = new Emitter(compiler.vm)


	// 		var self = this;

	// 	var set = function() {
	// 		if (stopRepeatAssign) {
	// 			return //阻止重复赋值
	// 		}
	// 		//确定是新设置值
	// 		if (!isEqual(preValue, newValue)) {
	// 			self.originalModel[name] = newValue //更新$model中的值
	// 			//自身的依赖更新
	// 			self.notifySubscribers(accessor);
	// 		}
	// 	}

	// 	var get = function() {
	// 		self.collectSubscribers(accessor) //收集视图函数
	// 		return accessor.$vmodel || preValue //返回需要获取的值		
	// 	}

	// 		function accessor(newValue) {
	// 			var vmodel = self.watchProperties.vmodel
	// 			var preValue = self.originalModel[name];
	// 			if (arguments.length) {
	// 				set(vmodel, preValue)
	// 			} else {
	// 				get(vmodel, preValue);
	// 			}
	// 		};

	// 	accessor[Aaron.subscribers] = [] //订阅者数组,保存所有的view依赖映射

	// 	//生成监控属性要区分内部值的类型
	// 	if (rchecktype.test(valueType)) { //复杂数据,通过递归处理
	// 		//复杂结构
	// 	} else {
	// 		//普通的基本类型
	// 		self.originals[name] = val;
	// 	}

	// 	return accessor;
	// }


	function Binding(name, val, valueType){

		this.subscribers = [] //订阅者数组,保存所有的view依赖映射

	
		console.log(name, val, valueType)
	}


	BindPro = Binding.prototype;


	BindPro.set = function() {

	}


	BindPro.get = function() {

	}


	return Binding;

});