
//获取浏览器版本
(function () {
	window.sys={};              				//让外部可以访问，保存浏览器信息对象。
	var ua = navigator.userAgent.toLowerCase(); //获取浏览器信息字符串
	var s=[];									//浏览器信息组，浏览器名称+版本；	

	(s=ua.match(/mise ([\d.]+)/)) ? sys.ie=s[1]:
	(s=ua.match(/firefox\/([\d.]+)/)) ? sys.firefox=s[1]:
	(s=ua.match(/chrome\/([\d.]+)/)) ?  sys.chrome=s[1]:
	(s=ua.match(/opera\/.*version\/([\d.]+)/)) ? sys.opera=s[1]:
	(s=ua.match(/version\/([\d.]+).*safari/)) ? sys.safari=s[1]:0;

	if ((/webkit/.test(ua))) sys.webkit = ua.match(/webkit\/([\d.]+)/)[1];
		              
})();

//DOM加载
function addDomLoaded(fn) {
	var isReady = false;
	var timer = null;
	function doReady() {
		if (timer) clearInterval(timer);
		if (isReady) return;
		isReady = true;
		fn();
	}
	
	if ((sys.opera && sys.opera < 9) || (sys.firefox && sys.firefox < 3) || (sys.webkit && sys.webkit < 525)) {
		//无论采用哪种，基本上用不着了
		/*timer = setInterval(function () {
			if (/loaded|complete/.test(document.readyState)) { 	//loaded是部分加载，有可能只是DOM加载完毕，complete是完全加载，类似于onload
				doReady();
			}
		}, 1);*/

		timer = setInterval(function () {
			if (document && document.getElementById && document.getElementsByTagName && document.body) {
				doReady();
			}
		}, 1);
	} else if (document.addEventListener) {//W3C
		addEvent(document, 'DOMContentLoaded', function () {
			fn();
			removeEvent(document, 'DOMContentLoaded', arguments.callee);
		});
	} else if (sys.ie && sys.ie < 9){
		var timer = null;
		timer = setInterval(function () {
			try {
				document.documentElement.doScroll('left');
				doReady();
			} catch (e) {};
		}, 1);
	}
}
//跨浏览器获取视口大小
function getInner() {
	if (typeof window.innerWidth != 'undefined') {
		return {
			width : window.innerWidth,
			height : window.innerHeight
		}
	} else {
		return {
			width : document.documentElement.clientWidth,
			height : document.documentElement.clientHeight
		}
	}
}


//跨浏览器获取Style
function getStyle(element, attr) {
	if (typeof window.getComputedStyle != 'undefined') {//W3C
		// return window.getComputedStyle(element, null).getPropertyValue(attr);
		return window.getComputedStyle(element, null)[attr];
	} else if (typeof element.currentStyle != 'undeinfed') {//IE
		// return element.currentStyle.getAttribute(attr);
		return element.currentStyle[attr];
	}
}

//判断class是否存在
function hasClass(element, classname) {
	return element.className.match(new RegExp('(\\s|^)' +classname +'(\\s|$)'));
}

//跨浏览器添加link规则
function insertRule(sheet, selectorText, cssText, position) {
	if (typeof sheet.insertRule != 'undefined') {//W3C
		sheet.insertRule(selectorText + '{' + cssText + '}', position);
	} else if (typeof sheet.addRule != 'undefined') {//IE
		sheet.addRule(selectorText, cssText, position);
	}
}

//跨浏览器移出link规则
function deleteRule(sheet, index) {
	if (typeof sheet.deleteRule != 'undefined') {//W3C
		sheet.deleteRule(index);
	} else if (typeof sheet.removeRule != 'undefined') {//IE
		sheet.removeRule(index);
	}
}



//获取事件
function getEvent(event){
	return event || addEvent.fixEvent(window.event);
}

//阻止默认行为
function preDef(event){
	var e = getEvent(event);
	if (typeof e.preventDefault != 'undefined') {
		e.preventDefault();
	}else{
		e.returnValue = false;
	}
}


/*************************************************************************************/

/************
1.IE多次注册同一个函数不被忽略
2.IE中顺序是倒序的
3.IE中this传递过来的是window；
**************/
//跨浏览器事件绑定
// function addEvent(obj, type, fn) {
// 	if (typeof obj.addEventListener != 'undefined') {
// 		obj.addEventListener(type, fn, false);//默认在冒泡阶段执行
// 	} else if (typeof obj.attachEvent != 'undefined') {
// 		obj.attachEvent('on' + type, function () {
// 			fn.call(obj, window.event);
// 		});
// 	}

// }

//传统的方法解决IE绑定事件
/******
1.无法删除事件
2.无法顺序执行
3.IE的现代事件绑定存在内存泄漏问题
*****/
//跨浏览器事件绑定
addEvent.ID = 0;
function addEvent(obj, type, fn) {
	if (typeof obj.addEventListener !='undefined'){
		obj.addEventListener(type, fn,false);//默认在冒泡阶段执行
	} else {
		if (!obj.events)  obj.events={};
		if (!obj.events[type]) obj.events[type]=[];
		if (addEvent.noequal(obj.events[type],fn)) {
			obj.events[type][addEvent.ID++] = fn;
		}
		/******
		obj['on'+type]  等价于obj.on....什么事件，所以后直接等于函数名addEvent.exex而不是运行的函数addEvent.exex（）
		******************/
		obj['on'+type] = addEvent.exex;
	}
}

//执行时间处理函数
addEvent.exex = function (event) {
	var e = getEvent(event);
	var es = this.events[e.type];
	for (var i in es){
		es[i].call(this,e);
	}
}
//对同一个添加函数进行屏蔽
addEvent.noequal = function (es,fn) {
	for (var i in es){
		if (es[i] == fn) return false;
	}
	return true;
}
//把IE常用的Event对象配对到W3C中
addEvent.fixEvent = function (e) {
	e.preventDefault = addEvent.fixEvent.preventDefault();
	e.stopPropagation =addEvent.fixEvent.stopPropagation();
	e.target = addEvent.fixEvent.srcElement;
	return e;
}

//IE阻止默认行为
addEvent.fixEvent.preventDefault = function () {
	this.returnValue = false;
}
//IE取消冒泡
addEvent.fixEvent.stopPropagation = function () {
	this.cancelBubble = true;
}


//跨浏览器删除事件
// function removeEvent(obj, type, fn) {
// 	if (typeof obj.removeEventListener != 'undefined') {
// 		obj.removeEventListener(type, fn, false);
// 	} else if (typeof obj.detachEvent != 'undefined') {
// 		obj.detachEvent('on' + type, fn);
// 	}
// }

//传统的方法解决IE删除事件
function removeEvent(obj, type, fn) {
	if (typeof obj.removeEventListener != 'undefined') {
		obj.removeEventListener(type, fn, false);
	} else {
		if (obj.events[type]) {
			for(var i in obj.events[type]){
				if(obj.events[type][i] == fn){
					delete obj.events[type][i];
				}
			}
		}

	}
}


/*************************************************************************************/



//删除前后空格
function trim(str) {
	return str.replace(/(^\s*)|(\s*$)/g, '');
	// return str.replace(/(^\s*)|(\s*$)/g, '');
}

//滚动条清零
function scrollTop() {
	document.documentElement.scrollTop=0;
	document.body.scrollTop=0;
}














 
//封装库 
//此函数防止所有行为共享一个对象。
var $ = function(args){
	return new Base(args);
}
function Base(args) {
	//创建一个数组，来保存获取的节点和节点数组
	this.elements = [];

	if (typeof args == 'string') {
		//css模拟
		if (args.indexOf(' ') != -1) {
			var elements = args.split(' ');			//把节点拆开分别保存到数组里
			var childElements = [];					//存放临时节点对象的数组，解决被覆盖的问题
			var node = [];							//用来存放父节点用的
			for (var i = 0; i < elements.length; i++) {
				if (node.length == 0) node.push(document);		//如果默认没有父节点，就把document放入
				switch (elements[i].charAt(0)) {
					case '#' :
						childElements = [];				//清理掉临时节点，以便父节点失效，子节点有效
						childElements.push(this.getId(elements[i].substring(1)));
						node = childElements;		//保存父节点，因为childElements要清理，所以需要创建node数组
						break;
					case '.' : 
						childElements = [];
						for (var j = 0; j < node.length; j ++) {
							var temps = this.getClass(elements[i].substring(1), node[j]);
							for (var k = 0; k < temps.length; k ++) {
								childElements.push(temps[k]);
							}
						}
						node = childElements;
						break;
					default : 
						childElements = [];
						for (var j = 0; j < node.length; j ++) {
							var temps = this.getTag(elements[i], node[j]);
							for (var k = 0; k < temps.length; k ++) {
								childElements.push(temps[k]);
							}
						}
						node = childElements;
						break;
				}	
			}
			this.elements = childElements;
		}else{
			switch(args.charAt(0)){
				case'#':
					this.elements.push(this.getId(args.substring(1))); 
					break;
				case'.':
					this.elements=this.getClass(args.substring(1));
					break;
				default:
					this.elements=this.getTag(args);
					break;		
			}
		}
	}else if (typeof args == 'object') {
		if (args != undefined) {
		this.elements[0] = args;
		}
	}else if(typeof args == 'function'){
		this.ready(args);
	}
};


Base.prototype.ready = function (fn) {
	addDomLoaded(fn);
}
/******************************************************************************/
//id
Base.prototype.getId = function (id) {
	return document.getElementById(id);
};
/******************************************************************************/
//name
Base.prototype.getName = function (name) {
		var names = document.getElementsByName(name);
		for(var i = 0; i < names.length;i++){
			this.elements.push(names[i]);
		}
		return	this;
};
/******************************************************************************/
//tag
Base.prototype.getTag = function (tag,parentNode) {
		if (parentNode != undefined) {
			var node =parentNode;
		}else{
			var node = document;
		}
		var tags = node.getElementsByTagName(tag);
		var temp = [];
		for(var i = 0; i < tags.length;i++){
			temp.push(tags[i]);
		}
		return	temp;	
};

/******************************************************************************/
//classname兼容性有问题所以我们自己建造一个获取class节点的方法
Base.prototype.getClass = function (classname,parentNode) {
   	var node = null;
   	var temp = [];
    if (parentNode  != undefined) {
    	 node = parentNode;
    }else{
    	 node = document;
    }
    var all = node.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) {
    	if (all[i].className == classname) {
    		temp.push(all[i]);
    	}
    }
    return temp;
};

/******************************************************************************/
//获取子节点
Base.prototype.find = function (args) {
	var childElements = [];
	for (var i = 0; i < this.elements.length; i++) {
		var ele = this.elements[i];
		var nodes = [];
		switch(args.charAt(0)){
			case'#':
				childElements.push(this.getId(args.substring(1)));
				break;
			case'.':
				nodes= this.getClass(args.substring(1),ele);
				for (var j = 0; j < nodes.length; j++) {
					if(nodes[j].className == args.substring(1)){
						childElements.push(nodes[j]);
					};
				}
				break;
			default:
				nodes = this.getTag(args,ele);
				for (var j = 0; j < nodes.length; j++) {
						childElements.push(nodes[j]);
					}
				break;	
		}
	}
	this.elements = childElements;
	return this;
}
/******************************************************************************/
//获取某一个节点,返回这个节点对象
Base.prototype.getElement = function (num){
	return this.elements[num];
}
//获取第一个节点
Base.prototype.first = function (){
	return this.elements[0];
}
//获取最后一个节点
Base.prototype.last = function (){
	return this.elements[this.elements.length-1];
}
/******************************************************************************/
//获取某一个节点,返回Base。
Base.prototype.getBase = function (num) {
	var element = this.elements[num];
	this.elements = [];
	this.elements[0] = element;
	return this;
}
/******************************************************************************/
//css方法
Base.prototype.css = function(attr,value) {
	for (var i = 0; i < this.elements.length; i++) {
		if (arguments.length == 1) {
			return getStyle(this.elements[i],attr);
		}
		this.elements[i].style[attr] = value;
	}
	return this;
};
/******************************************************************************/
//html方法
Base.prototype.html = function(value) {
	for (var i = 0; i < this.elements.length; i++) {
		if (arguments.length == 0) {
			return this.elements[i].innerHTML;
		}
		this.elements[i].innerHTML = value;
	}
	return this;
};
/******************************************************************************/
//click事件
Base.prototype.click = function(fn) {
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].onclick = fn;
	}
	return this;
};
/******************************************************************************/
//addClass
Base.prototype.addClass = function(classname) {
	for (var i = 0; i < this.elements.length; i++) {
		if (!hasClass(this.elements[i],classname)) {
			this.elements[i].className += ' '+ classname;
		}
	}	
	return this;
};
/******************************************************************************/
// //removeClass
Base.prototype.removeClass = function(classname) {
	for (var i = 0; i < this.elements.length; i++) {
		if (hasClass(this.elements[i],classname)) {
			this.elements[i].className = this.elements[i].className.replace(new RegExp('(\\s|^)'+classname+'(\\s|$)')," ");
		}
	}	
	return this;
}
/******************************************************************************/
//添加link或style的CSS规则
Base.prototype.addRule = function (num, selectorText, cssText, position) {
	var sheet = document.styleSheets[num];
	insertRule(sheet, selectorText, cssText, position);
	return this;
}
/******************************************************************************/
//移除link或style的CSS规则
Base.prototype.removeRule = function (num, index) {
	var sheet = document.styleSheets[num];
	deleteRule(sheet, index);
	return this;
}

/******************************************************************************/
//下拉菜单的的应用。
//鼠标移到对象上以及移开触发的事件
Base.prototype.hover = function (over,out) {
   for (var i = 0; i < this.elements.length; i++) {
	   	addEvent(this.elements[i],'mouseover',over);
	   	addEvent(this.elements[i],'mouseout',out);
   }
   return this;
}	
/******************************************************************************/
//显示
Base.prototype.show = function () {
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].style.display = 'block';
	}
	return this;
}
/******************************************************************************/
//隐藏
Base.prototype.hide = function () {
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].style.display = 'none';
	}
	return this;
}
/******************************************************************************/
//让对象在屏幕居中
Base.prototype.center = function(width,height) {
	var left = (document.documentElement.clientWidth - width)/2;
	var top = (document.documentElement.clientHeight - height)/2;
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].style.left= left+'px';
		this.elements[i].style.top = top+'px'; 
	};
	return this;
};
/******************************************************************************/
//触发浏览器窗口事件
Base.prototype.resize = function (fn) {
	for (var i = 0; i < this.elements.length; i++){
		var element = this.elements[i];
		addEvent(window,'resize',function(){
			fn();
			if (element.offsetLeft > getInner().width-element.offsetWidth) {
				element.style.left=getInner().width-element.offsetWidth+'px';
			};
			if (element.offsetTop > getInner().height-element.offsetHeight) {
				element.style.top = getInner().height-element.offsetHeight+'px';
			};
		});
	}
	return this;
}
/******************************************************************************/



//锁屏
Base.prototype.lock = function () {
	for (var i = 0; i < this.elements.length; i++) {
		this.elements[i].style.width= getInner().width+'px'
		this.elements[i].style.height = getInner().height+'px'; 
		this.elements[i].style.display= 'block';
		document.documentElement.style.overflow = 'hidden';
		addEvent(window,'scroll',scrollTop);
	};
	return this;
}
/******************************************************************************/
//解锁
Base.prototype.unlock = function () {
	for (var i = 0; i < this.elements.length; i++) { 
		this.elements[i].style.display= 'none';
		document.documentElement.style.overflow = 'auto';
		removeEvent(window,'scroll',scrollTop);
	};
	return this;
}
/******************************************************************************/

//插件代码
Base.prototype.extend = function (name,fn) {
	Base.prototype[name] = fn;
}

//设置动画
Base.prototype.animate = function (obj) {
	for (var i = 0; i < this.elements.length; i ++) {
		var element = this.elements[i];
		var attr = obj['attr'] == 'x' ? 'left' : obj['attr'] == 'y' ? 'top' : 
					   obj['attr'] == 'w' ? 'width' : obj['attr'] == 'h' ? 'height' : 
					   obj['attr'] == 'o' ? 'opacity' : 'left';

		
		var start = obj['start'] != undefined ? obj['start'] : 
						attr == 'opacity' ? parseFloat(getStyle(element, attr)) * 100 : 
												   parseInt(getStyle(element, attr));
		
		var t = obj['t'] != undefined ? obj['t'] : 10;												//可选，默认10毫秒执行一次
		var step = obj['step'] != undefined ? obj['step'] : 20;								//可选，每次运行10像素
		
		var alter = obj['alter'];
		var target = obj['target'];
		
		
		var speed = obj['speed'] != undefined ? obj['speed'] : 6;							//可选，默认缓冲速度为6
		var type = obj['type'] == 0 ? 'constant' : obj['type'] == 1 ? 'buffer' : 'buffer';		//可选，0表示匀速，1表示缓冲，默认缓冲
		
		
		if (alter != undefined && target == undefined) {
			target = alter + start;
		} else if (alter == undefined && target == undefined) {
			throw new Error('alter增量或target目标量必须传一个！');
		}
		
		
		
		if (start > target) step = -step;
		
		if (attr == 'opacity') {
			element.style.opacity = parseInt(start) / 100;
			element.style.filter = 'alpha(opacity=' + parseInt(start) +')';
		} else {
			element.style[attr] = start + 'px';
		}
		
		
		clearInterval(window.timer);
		timer = setInterval(function () {
		
			if (type == 'buffer') {
				step = attr == 'opacity' ? (target - parseFloat(getStyle(element, attr)) * 100) / speed :
													 (target - parseInt(getStyle(element, attr))) / speed;
				step = step > 0 ? Math.ceil(step) : Math.floor(step);
			}
			
			
			
			if (attr == 'opacity') {
				if (step == 0) {
					setOpacity();
				} else if (step > 0 && Math.abs(parseFloat(getStyle(element, attr)) * 100 - target) <= step) {
					setOpacity();
				} else if (step < 0 && (parseFloat(getStyle(element, attr)) * 100 - target) <= Math.abs(step)) {
					setOpacity();
				} else {
					var temp = parseFloat(getStyle(element, attr)) * 100;
					element.style.opacity = parseInt(temp + step) / 100;
					element.style.filter = 'alpha(opacity=' + parseInt(temp + step) + ')'
				}

			} else {
				if (step == 0) {
					setTarget();
				} else if (step > 0 && Math.abs(parseInt(getStyle(element, attr)) - target) <= step) {
					setTarget();
				} else if (step < 0 && (parseInt(getStyle(element, attr)) - target) <= Math.abs(step)) {
					setTarget();
				} else {
					element.style[attr] = parseInt(getStyle(element, attr)) + step + 'px';
				}
			}

			//document.getElementById('aaa').innerHTML += step + '<br />';
		}, t);
		
		function setTarget() {
			element.style[attr] = target + 'px';
			clearInterval(timer);
		}
		
		function setOpacity() {
			element.style.opacity = parseInt(target) / 100;
			element.style.filter = 'alpha(opacity=' + parseInt(target) + ')';
			clearInterval(timer);
		}
	}
	return this;
};








