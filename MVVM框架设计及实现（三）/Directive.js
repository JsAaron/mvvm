//========================================
//
//      鎸囦护澶勭悊
//
//========================================
Aaron.register('Directive', [
    'directives-on'
], function(on) {
    

	var dirId = 1;

	var registerHandlers = {
		'on': on
	}
    

    //指令分配器类
	function Directive(type, value, handlers, node, vm) {
		this.id       = dirId++
		this.type     = type
		this.vm       = vm
		this.compiler = vm.compiler
		this.el       = node
		this.value    = value;

		var isEmpty = '';

		//混入每一种策略方法到指令对象
		if (typeof handlers === 'function') {
			this[isEmpty ? 'bind' : '_update'] = handlers
		} else {
			for (var prop in handlers) {
				if (prop === 'unbind' || prop === 'update') {
					this['_' + prop] = handlers[prop]
				} else {
					this[prop] = handlers[prop]
				}
			}
		}

	};


	var DirProto = Directive.prototype;

	/**
	 * 检测是否有对应的处理句柄
	 * @return {[dirname]} [description]
	 */
	Directive.checkHandlers = function(dirname){
		return registerHandlers[dirname];
	}


	/**
	 * 创建指定的绑定处理句柄
	 */
	Directive.createHandlers = function(type, value, node, vm) {
		var handlers = this.checkHandlers(type)
		if (!handlers) {
			return;
		}
		return new Directive(type, value, handlers, node, vm);
	}


	return Directive;
});



