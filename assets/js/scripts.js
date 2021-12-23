(function() {

	/* Alias */
	const find = document.querySelector.bind(document);
	const findAll = document.querySelectorAll.bind(document);
	const findId = document.getElementById.bind(document);

	/* Unsplash API */
	const clientId = apikeys.UNSPLASH_CLIENT_ID;
	const unsplashUrl = `https://api.unsplash.com/photos/random?query=landscape&client_id=${clientId}`;
	const unsplasSourceUrl = 'https://source.unsplash.com/featured?berlin&orientation=landscape';

	const weatherApiKey = apikeys.OWM_API_KEY;

	const elements = {
		date: find('.js_date'),
		temp: find('.js_temp'),
		description: find('.js_description .js_value'),
		descriptionEmoji: find('.js_emoji'),
		tempMinMax: find('.js_temp_min_max .value'),
		chanceOfRain: find('.js_chance_of_rain .js_value'),
		uvIndex: find('.js_uv_index .js_value'),
		wind: find('.js_wind .js_value'),
		sunriseSunset: find('.js_sunrise_sunset .js_value'),
		icon: find('.js_weather_icon'),
		forecastList: find('.js_forecast_list'),
		currentWeather: find('.js_current_weather'),
		setDayTodayBtn: find('.js_set_date_today'),
		latLong: find('.js_lat_long'),
		airquality: find('.js_air_quality .js_value'),
		settingsSave: find('.js_settings .js_save'),
		settingsLocation: findId('locationSearch')
	};

	let weatherDataTemp;

	const forecastElems = {
		list: find('.js_forecast_list')
	};


	initApp();

	/**
	 * Initialize application
	 */
	function initApp() {
		setCurrentDate();
		// displayImage('test');
		fetchWeather();

		displayImage(unsplasSourceUrl);
		initClickListener();
	}


	/**
	 * Get, format and set current date
	 */
	function setCurrentDate() {
		const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		let today = new Date();
		let day = today.getDay();
		let fullDate = today.getDate() + ', ' + months[(today.getMonth())] + ' ' + today.getFullYear();

		elements.date.textContent = weekdays[day] + " " + fullDate;
	}

	/**
	 * Fetch image from Unsplash API
	 */
	// function fetchImage() {
	//
	// 	fetch(unsplasSourceUrl)
	// 		.then(response => response.json())
	// 		.then(data => {
	// 			displayImage(data);
	// 		}).catch(function(error) {
	// 			console.log(error);
	// 		});
	// }

	/**
	 * Fetch image from Unsplash API and set as background
	 * @param {object} imgData Fetched image data
	 */
	function displayImage(imgLink) {

		// const imgContainer = document.querySelector('.js_background');
		// const imgAuthor = document.querySelector('.js_author');

		// let img = document.createElement("img");
		// img.src = imgData.urls.regular;
		// img.src = 'bg.jpg';

		// let link = document.createElement("a");
		// link.href = imgData.user.links.html;
		// link.classList.add('link');
		// link.textContent = 'Image by: ' + imgData.user.name;

		// imgContainer.appendChild(img);
		// imgAuthor.appendChild(link);

		elements.currentWeather.style.backgroundImage = "url('" + imgLink + "')";
	}


	/**
	 * Fetches WeatherData from openweathermap API
	 */
	function fetchWeather() {

		/* Weather Data */

		const inputVal = 'Berlin';
		const cityIdBerlin = 2950159;
		let unit = 'metric';
		let userPosLat;
		let userPosLong;
		let weatherUrl;

		/* Get User Location */
		// if (navigator.geolocation) {
		// 	navigator.geolocation.getCurrentPosition(showPosition);
		// } else {
		// 	console.log("Geolocation is not supported by this browser.");
		// }


		// TODO: remove

		// function showPosition(position) {

		// console.log(position);
		// userPosLat = position.coords.latitude;
		// userPosLong = position.coords.longitude;

		var berlinlat = '52.5071778';
		var berlinLong = '13.4468267';
		weatherUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${berlinlat}&lon=${berlinLong}&appid=${weatherApiKey}&units=${unit}&exclude=minutely,hourly`;


		fetch(weatherUrl)
			.then(response => response.json())
			.then(data => {
				displayWeather(data, 0);
				weatherDataTemp = data;
				// console.log("fetched");
			}).catch(function(error) {
				console.log(error);
			});
		// }

	}

	/**
	 * Sets fetched weather data to corresponding HTML element
	 * @param {object} weatherData Fetched weather data object containing current condition and 8 days forecast
	 * @param {int} day Day number starting at zero to fetch weather for that day
	 */
	function displayWeather(weatherData, day) {
		console.log(weatherData);


		/* Current weather condition */
		elements.temp.textContent = Math.round(weatherData.current.temp, 2);
		elements.descriptionEmoji.textContent = getIconForWeather(weatherData.current.weather[0].id);
		elements.description.textContent = weatherData.current.weather[0].description;

		/* Highlights */
		elements.tempMinMax.textContent = Math.round(weatherData.daily[day].temp.max, 2) + '° / ' + Math.round(weatherData.daily[day].temp.min, 2) + '°';
		elements.chanceOfRain.textContent = Math.round(weatherData.daily[day].pop * 100, 2) + '%';
		elements.uvIndex.textContent = weatherData.daily[day].uvi;
		elements.wind.textContent = Math.round((weatherData.daily[day].wind_speed * 3.6), 2) + "km/h"; //km/h
		elements.sunriseSunset.textContent = getTimeFromTimestamp(weatherData.daily[day].sunrise) + ' / ' + getTimeFromTimestamp(weatherData.daily[day].sunset);
		elements.latLong.textContent = weatherData.lat + '° N, ' + weatherData.lon + '° W,';
		fetchAndSetAirQualityData(day);


		// elements.icon.src = 'weather_3d/' +weatherData.current.weather[0].icon + '.png';
		/* Forecast */
		// forecastElems.list
		// weatherData.daily.forEach(item, function() {
		//
		// });

		if (day === 0) {
			createForecastList(weatherData);
		}


	}

	function fetchAndSetAirQualityData(day) {

		const airPollutionUrl = `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=52.5067614&lon=13.2846508&appid=${weatherApiKey}`;
		const ratings = ['Good2', 'Fair', 'Moderate', 'Bad', 'Unhealthy'];

		// Air Quality
		fetch(airPollutionUrl)
			.then(response => response.json())
			.then(data => {
				// console.log(data);
				elements.airquality.textContent = ratings[data.list[0].main.aqi - 1];
				// console.log()
			})
			.catch(() => {
				// console.log("Air Quality Index temporarily not available. Please try again later.");
			});
	}



	const createForecastList = (weatherData) => {

		let dailyWeather = weatherData.daily;

		for (let i = 0; i < dailyWeather.length; i++) {
			let day = dailyWeather[i];

			// skip days 0 (today), 6 and 7
			if ([0, 6, 7].indexOf(i) === -1) {
				let listItem = `<li class="day js_day" data-idx="${i}" data-day="${getDayShortFromTimestamp(day.dt)}">
					<span class="date_day">${getDayOfMonthFromTimestamp(day.dt)}. ${getMonthShortFromTimestamp(day.dt)}</span>
					<span class="icon_description">
						<img class="day_icon js_day_icon" width="60" src="assets/icons/weather/${day.weather[0].icon}@2x.png" />
						<span class="day_description js_day_description">${day.weather[0].main}</span>
					</span>
					<span class="day_min_max">
						<span class="day_max js_day_max">${Math.round(day.temp.max,2)}°</span>
						<span class="day_min js_day_min">${Math.round(day.temp.min,2)}°</span>
					</span>

				</li>`;

				elements.forecastList.appendChild(createItemNode(listItem, i, getDayFromTimestamp(day.dt)));
			}
		}

	};


	const createItemNode = (item, i, daytext) => {
		var template = document.createElement('template');
		template.innerHTML = item;
		template.content.childNodes[0].addEventListener('click', function() {
			findAll(".js_day").forEach((el) => el.classList.remove("active"));
			this.classList.add('active');
			displayWeather(weatherDataTemp, i);
			// update headline text
			find('.js_today_label').textContent = daytext;
			// show today btn
			elements.setDayTodayBtn.classList.add('active');
		});
		return template.content.childNodes[0];
	};


	/* Return Day (short) from Timestamp */
	function getDayShortFromTimestamp(timestamp) {
		var date;
		var dayOfWeek;
		var daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

		date = new Date(timestamp * 1000);
		dayOfWeek = daysShort[date.getDay()];

		return dayOfWeek;
	}

	/* Return Day from Timestamp */
	function getDayFromTimestamp(timestamp) {
		var date;
		var dayOfWeek;
		var daysShort = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

		date = new Date(timestamp * 1000);
		dayOfWeek = daysShort[date.getDay()];

		return dayOfWeek;
	}

	function getMonthShortFromTimestamp(timestamp) {
		var date;
		var dayOfWeek;
		const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		let today = new Date();
		let day = today.getDay();


		return monthsShort[(today.getMonth())];
	}

	function getIconForWeather(weatherId) {
		let weatherIdString = weatherId.toString(10);
		let idFirstNumber = weatherIdString.charAt(0);

		// if weather condition id starts with 8, use the full id, otherwise only the first number
		let lookUpId = parseInt(idFirstNumber) == 8 ? weatherId : idFirstNumber;

		let emojiLookup = {
			2: '🌪',
			3: '🌧',
			5: '☔️',
			6: '❄️',
			7: '🌀',
			800: '☀️',
			801: '🌤',
			802: '⛅️',
			803: '🌥',
			804: '☁️'
		};

		return emojiLookup[lookUpId];
	}


	/* Return Day from Timestamp */
	function getDayOfMonthFromTimestamp(timestamp) {
		var date;
		var dayOfMonth;

		date = new Date(timestamp * 1000);
		dayOfMonth = date.getDate();

		return dayOfMonth;
	}

	/* Return Time from Timestamp */
	function getTimeFromTimestamp(timestamp) {
		var date;
		var hour;

		date = new Date(timestamp * 1000);

		hour = date.toLocaleTimeString();

		return hour.slice(0, -3);
	}



	function initClickListener() {
		/* Reset Highlights Data to today */
		elements.setDayTodayBtn.addEventListener('click', function() {
			this.classList.remove('active');
			findAll(".js_day").forEach((el) => el.classList.remove("active"));
			find('.js_today_label').textContent = 'Today';
			displayWeather(weatherDataTemp, 0);
		});

		/* Settings: Save */
		elements.settingsSave.addEventListener('click', function() {
			this.classList.add('active');
		});

		// city search
		let citySearchApi;
		let citySearchLength = 0;



		var countries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua &amp; Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia &amp; Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central Arfrican Republic","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauro","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre &amp; Miquelon","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","St Kitts &amp; Nevis","St Lucia","St Vincent","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad &amp; Tobago","Tunisia","Turkey","Turkmenistan","Turks &amp; Caicos","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];


		elements.settingsLocation.addEventListener('keyup', function() {
			let val = this.value;
			// console.log(this.value);
			// citySearchLength++;
			citySearchApi = `http://api.openweathermap.org/geo/1.0/direct?q=${this.value}&limit=5&appid=${weatherApiKey}`;

			// City Search
			fetch(citySearchApi)
				.then(response => response.json())
				.then(data => {
					console.log(data);
					autocomplete(elements.settingsLocation, data, val);
				})
				.catch(() => {
				});
		});

	}

})();