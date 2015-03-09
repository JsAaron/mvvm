/*********************************************************************
 *          监控数组（与ms-each配合使用）                     *
 **********************************************************************/

function Collection(model) {
	this._id = generateID();
	this[subscribers] = []
	this._model = model
	this._events = {}
	this._ = modelFactory({
		'length': model.length
	})
	this._.subscribe('length', function(a, b) {

	})
	aaObserver.call(this);
}

Collection.prototype = {

	//转化成对应的数据模型
	_convert: function(val) {
		var type = $.type(val)
		if (rchecktype.test(type)) { //如果是多维结构
			alert(1)
			val = val.$id ? val : modelFactory(val, val)
		}
		return val
	},

	//数据,数据长度
	_add: function(array, pos) {
		//获取当前数组的长度
		var oldLength = this.length;
		var self = this;
		pos = typeof pos === "number" ? pos : oldLength;
		var added = [];
		//把数组中的每一个参数给再次分解
		$.each(array, function(i, arr) {
			added[i] = self._convert(arr) //多维结构继续分解
		});
		// [].slice.apply(this, [pos, 0].concat(added));
	},

	push: function(model) {
		this._model = model;
		this._add.apply(this, arguments)
		console.log(this)
	},
}