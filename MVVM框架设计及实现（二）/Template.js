//========================================
//
//    解析所有通过ao自定义的语法指令
//    通过声明式是结构来控制样式与行为
//
//========================================

MVVM.scan = function(element, vmodel) {
  element = element || root
  var vmodels = vmodel ? [].concat(vmodel) : []
  scanTag(element, vmodels)
}

function scanTag(element, vmodels) {
  //找到这个作用域
  var controllerValue = element.getAttribute(prefix + "controller");
  if (controllerValue) {
    vmodels = MVVM.vmodels[controllerValue]
    //移除标记
    element.removeAttribute(prefix + "controller")
  }
  scanAttrNodes(element, vmodels)
}

//扫描属性节点

function scanAttrNodes(elem, vmodels) {
  var bindings = [],
    msData = {}, match,
    attributes = elem.attributes;

  for (var i = 0, attr; attr = attributes[i++];) {
    if (attr.specified) {
      if (match = attr.name.match(rmsAttr)) {

      }
    }
  }
}



//执行绑定

function executeBindings(bindings, vmodel) {
  console.log(bindings)
  $.each(bindings, function(i, data) {
    bindingHandlers[data.type](data, vmodel)
    if (data.evaluator && data.name) { //移除数据绑定，防止被二次解析
      //chrome使用removeAttributeNode移除不存在的特性节点时会报错 https://github.com/RubyLouvre/avalon/issues/99
      data.element.removeAttribute(data.name)
    }
  })
}