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
function scanAttrNodes(element, vmodels) {
    var match, bindings = [], //存放绑定数据a
        attributes = element.attributes;

    for (var i = 0, attr; attr = attributes[i++];) {
        if (attr.specified) {
            if (match = attr.name.match(/ao-(\w+)-?(.*)/)) {
                //如果是以指定前缀命名的
                var type = match[1];
                var param = match[2] || "";
                var binding = {
                    'type'    : type,
                    'param'   : param,
                    'element' : element,
                    'name'    : match[0],
                    'value'   : attr.value
                }
                bindings.push(binding)
            }
        }
    }

    //如果有绑定
    if (bindings.length) {
        executeBindings(bindings, element);
    }

    scanNodes(element, vmodels) //扫描子孙元素
}


//检索所有子节点
function scanNodes(parent, vmodels) {
    //取出第一个子节点
    var node = parent.firstChild;
    while (node) {
        switch (node.nodeType) {
            case 1:
                scanTag(node, vmodels) //扫描元素节点
                break;
            case 3:
                if (/\{\{(.*?)\}\}/.test(node.data)) { //是{{}}表达式格式
                    scanText(node, vmodels) //扫描文本节点
                }
                break;
        }
        //找到下一个兄弟节点
        node = node.nextSibling;
    }
}

//扫描文本节点
function scanText(textNode, vmodels) {
    var bindings = [],
        tokens = tokenize(textNode.data);


}

//=====================================================
//              解析{{}}数据
//         {{ w }} x {{ h }} z {{p}}
//      一个文本节点可能有多个插值表达式，这样的格式需要转化成
//      词法分析器
//          tkoens 
//      代码经过词法分析后就得到了一个Token序列，紧接着拿Token序列去其他事情
//======================================================
function tokenize(data) {

    console.log(data)

}



//执行绑定
function executeBindings(bindings, vmodels) {
    _.each(bindings, function(data, i) {
        bindingHandlers[data.type](data, vmodels)
        if (data.evaluator && data.name) { //移除数据绑定，防止被二次解析
            //chrome使用removeAttributeNode移除不存在的特性节点时会报错 https://github.com/RubyLouvre/avalon/issues/99
            data.element.removeAttribute(data.name)
        }
    })
}