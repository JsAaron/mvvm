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
        executeBindings(bindings, vmodels);
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

//==================================================
//              扫描文本节点
//         将分解的序列放入文档碎片          
//==================================================        
function scanText(textNode, vmodels) {
    var bindings = [],
        tokens = tokenize(textNode.data);

    if (tokens.length) {
        for (var i = 0, token; token = tokens[i++];) {
            var node = document.createTextNode(token.value) //将文本转换为文本节点，并替换原来的文本节点
            if (token.expr) {
                var binding = {
                    type     : "text",
                    node     : node,
                    nodeType : 3,
                    value    : token.value
                }
                bindings.push(binding) //收集带有插值表达式的文本
            }
            documentFragment.appendChild(node)
        }
        textNode.parentNode.replaceChild(documentFragment, textNode)
        executeBindings(bindings, vmodels)
    }
}

//====================================================================
//              解析{{}}数据，V2版本排除管道过滤符的处理
//      data =  "哈哈 {{ w }} x {{ h }} y {{z}} 呵呵"
//      一个文本节点可能有多个插值表达式，这样的格式需要转化成
//      词法分析器
//          tkoens 
//      代码经过词法分析后就得到了一个Token序列，紧接着拿Token序列去其他事情   
//      
//      tokens [
//          {
//              expr : true/false 是否为表达式
//              value: 值  
//          },
//          ...............
//      ]     
//===========================================================================
var openTag = '{{',
    closeTag = '}}';

function tokenize(str) {
    var tokens = [],
        value,
        start = 0,
        stop;

    do {
        //扫描是不是开始{{,那么意味着前前面还有数据
        stop = str.indexOf(openTag, start)
        if (stop === -1) {
            //意味着搜索到了末尾
            break
        }
        //获取到{{左边的文本,保存
        value = str.slice(start, stop)
        if (value) {
            tokens.push({
                value: value,
                expr: false
            })
        }

        //插值表达式的处理
        start = stop + openTag.length
        stop = str.indexOf(closeTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { //处理{{ }}插值表达式
            tokens.push({
                value: value,
                expr: true
            })
        }
        //开始下一次检测
        start = stop + closeTag.length;
    } while (1)


    value = str.slice(start)
    if (value) { //}} 右边的文本
        tokens.push({
            value: value,
            expr: false
        })
    }

    return tokens;
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