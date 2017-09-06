(function () {
	var self;
	var wrapperEl = null;
	var suggestEl = null;
	var xhr;
	
	var classes = {
		active: "__active",
		wrapper: "wrapper",
		base: "pv-autocomplete",
		items: "suggestions"
	}

	function __constructor(inputEl, options) {
		self = this;

		var defaults = {
			inputTimeout: 300, // задержка начала поиска
			data: [], // список подсказок
			minTermLength: 3, //минимальная длина текста для поиска
			url: null, //URL-адрес для AJAX запроса
			limit: 10 //Ограничение длины выводимого списка подсказок
		};

		// [property]
		self._input = inputEl;
		// [property]
		self._options = Extensions.ApplyIf(defaults, options || {});

		wrap();

		var requestTimeout = null;
		// Events
		// Обработка ввода текста
		self._input.addEventListener('keypress', onKeypress);

		// Обработка нажатия "функциональных" клавиш
		self._input.addEventListener('keydown', function (event) {
			var keyCode = event.keyCode || event.which;

			// клавиши вверх-вниз
			if (keyCode == 40 || keyCode == 38) {
				event.stopPropagation();
				event.preventDefault();
				self.navigateOpts(keyCode == 40 ? 1 : -1);
				// esc
			} else if (keyCode == 27) {
				self.closeSuggest();
				// enter
			} else if (keyCode == 13) {
				event.preventDefault();
				self.selectItem();
				// backspace
			} else if (keyCode == 8) {
				if (self._input.value.length <= 1) {
					self.closeSuggest();
				} else {
					onKeypress(event);
				}
			}
		});

		// Событие Click на wrapper'е
		wrapperEl.addEventListener('click', function (event) {
			event.stopPropagation(); //Чтобы не всплывало событие на документ
			self.selectItem();
		});

		// Событие Mouseover на подсказках
		wrapperEl.addEventListener('mouseover', function (event) {
			var target = event.target;
			while (target != event.currentTarget) {
				if (target.hasAttribute('data-value')) {
					highlightItem(target);
					break;
				}
				target = target.parentNode;
			}

		});

		/************************/
		/**
		 * Обрамляет элемент ввода
		 */
		function wrap() {
			wrapperEl = document.createElement('DIV');
			wrapperEl.className = classes.base + " " + classes.wrapper;

			self._input.parentNode.insertBefore(wrapperEl, self._input.nextSibling);
			wrapperEl.appendChild(self._input);
		}

		/************************/
		/**
		 * Подсвечивает текущую подсказку
		 */
		function highlightItem(suggestion) {
			//Убираем подсветку у имеющихся елементов
			Array.prototype.forEach.call(suggestEl.querySelectorAll("." + classes.active), function (item) {
				csshelper.removeClass(item, classes.active);
			});
			//Устанавливаем подстветку на текущем
			csshelper.addClass(suggestion, classes.active);
		}

		/************************/
		/**
		 * Событие Keypress, вызывающее отображение подсказки
		 */
		function onKeypress(event) {
			var keyCode = event.keyCode || event.which;
			// esc
			if (keyCode == 27)
				return;

			if (requestTimeout) {
				window.clearTimeout(requestTimeout); //Если отображение подсказок уже запущено, то отменяем его
			}
			requestTimeout = window.setTimeout(function () {
					self.showSuggest();
				}, self._options.inputTimeout);
		}
	}

	/************************/
	/**
	 * Открывает выпадающую подсказку
	 */
	__constructor.prototype.showSuggest = function () {
		var term = self._input.value.toLocaleLowerCase();

		//Если длина введенного текста меньше минимальной
		if (term.length < self._options.minTermLength) {
			self.closeSuggest();
			return;
		}

		if (!suggestEl) {
			suggestEl = document.createElement('DIV');
			suggestEl.className = classes.items;
			wrapperEl.appendChild(suggestEl);
		} else {
			//Очищаем текущий список
			while (suggestEl.firstChild) {
				suggestEl.removeChild(suggestEl.firstChild);
			}
		}

		//Получить список подсказок
		var data = [];
		if (self._options.url) {
			xhr = Extensions.AjaxRequest({
					url: self._options.url,
					params: {
						SearchQuery: term
					},
					method: 'GET',
					onSuccess: function (xhr) {
						data = JSON.parse(xhr.responseText);
						renderList(data);
					}
				});
		} else {
			for (var i = 0; i < self._options.data.length; i++) {
				var item = self._options.data[i];
				var idx = item.toLocaleLowerCase().indexOf(term); // ищем вхождение подстроки
				if (idx != -1)
					data.push(item);
			}

			renderList(data);
		}

		/************************/
		/**
		 * Рендерит список подсказок
		 */
		function renderList(data) {
			//Заполняем список значениями
			for (var i = 0; i < data.length && i < self._options.limit; i++) {
				var optEl = document.createElement('DIV');
				optEl.setAttribute('data-value', data[i]);
				optEl.innerText = data[i];
				if (i === 0)
					optEl.className = classes.active;
				suggestEl.appendChild(optEl);
			}

			if (data.length === 0) {
				self.closeSuggest();
			}

			document.addEventListener("click", self.closeSuggest);
		}
	}

	/************************/
	/**
	 * Закрывает выпадающую подсказку
	 */
	__constructor.prototype.closeSuggest = function () {
		//Прерываем AJAX-запрос
		if (xhr)
			xhr.abort();

		if (!suggestEl)
			return;
		suggestEl.parentNode.removeChild(suggestEl);
		suggestEl = null;
		document.removeEventListener("click", self.closeSuggest);
	}

	/************************/
	/**
	 * Выполняет навигацию по стрелкам
	 */
	__constructor.prototype.navigateOpts = function (direction) {

		//Если нет списка подсказок, то его нужно отобразить
		if (!suggestEl)
			self.showSuggest();

		var optionsEls = suggestEl.getElementsByTagName('DIV');
		if (optionsEls.length === 0)
			return;
		var selectedEl = suggestEl.querySelector("." + classes.active);
		if (!selectedEl)
			selectedEl = optionsEls[0];

		var currentIndex = Array.prototype.indexOf.call(optionsEls, selectedEl);
		if (direction === 1) {
			var nextIndex = (currentIndex + 1 <= optionsEls.length - 1) ? currentIndex + 1 : 0;
		} else if (direction === -1) {
			var nextIndex = (currentIndex - 1 >= 0) ? currentIndex - 1 : optionsEls.length - 1;
		}

		csshelper.removeClass(optionsEls[currentIndex], classes.active);
		csshelper.addClass(optionsEls[nextIndex], classes.active);
	}

	/************************/
	/**
	 * Выбирает текущую подсказку
	 */
	__constructor.prototype.selectItem = function () {
		if (!suggestEl)
			return;
		var suggestionEl = suggestEl.querySelector("." + classes.active);
		if (suggestionEl != null) {
			self._input.value = suggestionEl.getAttribute('data-value');
			self.closeSuggest();
		}
	}

	window.Autocomplete = __constructor;
})();
