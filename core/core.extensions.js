/****************************************************************************
[PV. Components for Web]
Core.Extensions
Pavel Voltage, 02.08.2017
v.1.3
/***************************************************************************/

(function () {

	/************************/
	/**
	 * Gets specified GET-parameter
	 */
	function GetParam(sParamName) {
		sParamName = sParamName.toLowerCase();
		var Params = window.location.search.substring(1).split("&");
		var variable = "";
		for (var i = 0; i < Params.length; i++) {
			if (Params[i].split("=")[0] == sParamName) {
				if (Params[i].split("=").length > 1)
					variable = Params[i].split("=")[1];
				return variable.replace(/%20/g, ' ');
			}
		}

		return "";
	}

	/************************/
	/**
	 * AJAX-query wrapper
	 */
	function AjaxRequest(config) {
		config = ApplyIf({
				url : undefined,
				method : 'GET',
				params : {},
				timeout : 10000,
				onSuccess : function (xhr) {},
				onFailure : function (xhr) {},
				onTimeout : function (timeout) {}
			}, config || {});

		/*var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
		var xhr = new XHR();*/
		var xhr = createXMLHttpRequest();

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					config.onSuccess(xhr);
				} else {
					config.onFailure(xhr);
					console.log('URL "' + config.url + '" returned: ' + xhr.statusText);
				}
				xhr = undefined;
			}
		}

		xhr.ontimeout = function () {
			config.onTimeout(config.timeout);
		}

		//GET
		var params = [];
		if (config.method.toUpperCase() == "GET") {
			for (var key in config.params) {
				params.push(key + '=' + encodeURIComponent(config.params[key]));
			}
		}

		xhr.open(config.method, config.url + '?' + params.join('&'), true);
		//In Internet Explorer. [timeout] property should be set after calling [open()] method only and before calling [send()]
		xhr.timeout = config.timeout;

		//POST (multipart/form-data)
		var body = ['\r\n'];
		if (config.method.toUpperCase() == "POST") {
			var boundary = String(Math.random()).slice(2);
			var boundaryMiddle = '--' + boundary + '\r\n';
			var boundaryLast = '--' + boundary + '--\r\n';

			for (var key in config.params) {
				//Adding field
				body.push('Content-Disposition: form-data; name="' + key + '"\r\n\r\n' + config.params[key] + '\r\n');
			}
			body = body.join(boundaryMiddle) + boundaryLast;

			xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
		}

		xhr.send(body);
		return xhr;

		/************************/
		/**
		 * Creates XMLHttpRequest crossbrowserly
		 */
		function createXMLHttpRequest() {
			if (typeof XMLHttpRequest === 'undefined') {
				XMLHttpRequest = function () {
					try {
						return new ActiveXObject("Msxml2.XMLHTTP.6.0");
					} catch (e) {}
					try {
						return new ActiveXObject("Msxml2.XMLHTTP.3.0");
					} catch (e) {}
					try {
						return new ActiveXObject("Msxml2.XMLHTTP");
					} catch (e) {}
					try {
						return new ActiveXObject("Microsoft.XMLHTTP");
					} catch (e) {}
					throw new Error("This browser does not support XMLHttpRequest.");
				};
			}

			return new XMLHttpRequest();
		}
	}

	/************************/
	/**
	 * Loads JS script from source URL
	 */
	function LoadScriptFrom(config) {
		config = ApplyIf({
				url : undefined,
				onLoad : function () {},
				onError : function () {}
			}, config || {});

		var successfullyLoaded = true;

		var script = document.createElement('script');
		script.src = config.url;
		document.documentElement.appendChild(script);

		script.onload = script.onerror = function () {
			if (!this.executed) { //Executes once only
				this.executed = true;
				if (successfullyLoaded)
					config.onLoad();
			}
		};

		script.onreadystatechange = function () {
			var self = this;
			if (this.readyState == "complete" || this.readyState == "loaded") {
				setTimeout(function () {
					self.onload()
				}, 0); //Carry [this] for [onload] event
			}
		};

		script.onerror = function () {
			successfullyLoaded = false;
			config.onError();
		};
	}

	/************************/
	/**
	 * Get weekday name
	 */
	function GetWeekDayName(date) {
		date = date || new Date();
		var days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
		var day = date.getDay();

		return days[day];
	}

	/************************/
	/**
	 * Declension of unit measure title
	 *
	 * @param {Number} num      Numeric
	 * @param {Object} cases    Word variables {nominativ: 'час', genetiv: 'часа', plural: 'часов'}
	 * @return {String}
	 */
	function Declension(num, cases) {
		num = Math.abs(num);

		var word = '';

		if (num.toString().indexOf('.') > -1) {
			word = cases.genetiv;
		} else {
			word = (
				num % 10 == 1 && num % 100 != 11
				 ? cases.nominativ
				 : num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)
				 ? cases.genetiv
				 : cases.plural);
		}

		return word;
	}

	/************************/
	/**
	 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
	 *
	 * @param {Object} obj1
	 * @param {Object} obj2
	 * @return {Object} obj3 a new object based on obj1 and obj2
	 */
	function ApplyIf(obj1, obj2) {
		var obj3 = {};
		for (var attrname in obj1) {
			obj3[attrname] = obj1[attrname];
		}
		for (var attrname in obj2) {
			obj3[attrname] = obj2[attrname];
		}
		return obj3;
	}

	/************************/
	/**
	 * Get DOM-element coordinates on page
	 */
	function GetElementCoords(element) {
		var box = element.getBoundingClientRect();

		var body = document.body;
		var docEl = document.documentElement;

		/* Считаем прокрутку страницы.
		 * Все браузеры, кроме IE8- поддерживают свойство pageXOffset/pageYOffset.
		 * В более старых IE, когда установлен DOCTYPE, прокрутку можно получить из documentElement, ну и наконец если DOCTYPE некорректен – использовать body
		 */
		var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
		var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

		/*В IE документ может быть смещен относительно левого верхнего угла. Получ+им это смещение.*/
		var clientTop = docEl.clientTop || body.clientTop || 0;
		var clientLeft = docEl.clientLeft || body.clientLeft || 0;

		/*Добавим прокрутку к координатам окна и вычтем смещение html/body, чтобы получить координаты всего документа.*/
		var top = box.top + scrollTop - clientTop;
		var left = box.left + scrollLeft - clientLeft;

		return {
			top : top,
			left : left
		};
	}

	/************************/
	/**
	 * Makes smooth scrolling of page to target DOM-element
	 */
	function SmoothScrollTo(element, callback) {

		var startY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
		var stopY = GetElementCoords(element).top;

		var distance = Math.abs(stopY - startY);
		if (distance > 100) {
			var speed = Math.round(distance / 100);
			speed = (speed >= 20) ? 20 : speed;

			var step = Math.round(distance / 25);
			var leapY = (stopY > startY) ? startY + step : startY - step;
			var timer = 0;

			if (stopY > startY) {
				for (var i = startY; i < stopY; i += step) {
					//setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
					setTimeout(window.scrollTo.bind(null, 0, leapY), timer * speed);
					leapY += step;
					if (leapY > stopY)
						leapY = stopY;
					timer++;
				}
			} else {
				for (var i = startY; i > stopY; i -= step) {
					//setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
					setTimeout(window.scrollTo.bind(null, 0, leapY), timer * speed);
					leapY -= step;
					if (leapY < stopY)
						leapY = stopY;
					timer++;
				}
			}

			if (typeof(callback) === "function") {
				setTimeout(callback, timer * speed);
			}
		} else {
			window.scrollTo(0, stopY);
		}
	}

	/************************/
	/**
	 * Checking string for JSON correct format
	 */
	function IsJSON(str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}

	var extensions = {
		GetParam : GetParam,
		AjaxRequest : AjaxRequest,
		LoadScriptFrom : LoadScriptFrom,
		GetWeekDayName : GetWeekDayName,
		Declension : Declension,
		ApplyIf : ApplyIf,
		GetElementCoords : GetElementCoords,
		SmoothScrollTo : SmoothScrollTo,
		IsJSON : IsJSON
	}
	window.Extensions = extensions;

})();

/************************/
/**
 * CSS helper object
 */
(function () {

	// supported functions
	var hasClass,
	addClass,
	removeClass,
	toggleClass;

	/************************/
	/**
	 * Returns RegEx for className
	 */
	function classReg(className) {
		return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
	}

	// modern browsers supports 'classList'
	if ('classList' in document.documentElement) {
		hasClass = function (elem, c) {
			return elem.classList.contains(c);
		};
		addClass = function (elem, c) {
			elem.classList.add(c);
		};
		removeClass = function (elem, c) {
			elem.classList.remove(c);
		};
	} else {
		hasClass = function (elem, c) {
			return classReg(c).test(elem.className);
		};
		addClass = function (elem, c) {
			if (!hasClass(elem, c)) {
				elem.className = elem.className + ' ' + c;
			}
		};
		removeClass = function (elem, c) {
			elem.className = elem.className.replace(classReg(c), ' ');
		};
	}

	/************************/
	/**
	 * Toggle function is custom
	 */
	toggleClass = function (elem, c) {
		var fn = hasClass(elem, c) ? removeClass : addClass;
		fn(elem, c);
	}

	var csshelper = {
		hasClass : hasClass,
		addClass : addClass,
		removeClass : removeClass,
		toggleClass : toggleClass
	};

	window.csshelper = csshelper;
})();
