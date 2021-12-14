(function() {

	/* Alias */
	const find = document.querySelector.bind(document);
	const findAll = document.querySelectorAll.bind(document);
	const findId = document.getElementById.bind(document);

	/* Unsplash API */
	const clientId = apikeys.UNSPLASH_CLIENT_ID;
	const unsplashUrl = `https://api.unsplash.com/photos/random?query=landscape&client_id=${clientId}`;



	const elements = {
		date: find('.js_date'),
		temp: find('.js_temp'),
		description: find('.js_description'),
		tempMin: find('.js_temp_min .value'),
		tempMax: find('.js_temp_max .value'),
		chanceOfRain: find('.js_chance_of_rain .value'),
		uvIndex: find('.js_uv_index .value'),
		wind: find('.js_wind .value'),
		sunrise: find('.js_sunrise .value'),
		sunset: find('.js_sunset .value'),
		icon: find('.js_weather_icon'),
		forecastList: find('.js_forecast_list')
	};

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

		fetchImage();
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
	function fetchImage() {

		fetch(unsplashUrl)
			.then(response => response.json())
			.then(data => {
				// displayImage(data);
			}).catch(function(error) {
				console.log(error);
			});
	}

	/**
	 * Fetch image from Unsplash API and set as background
	 * @param {object} imgData Fetched image data
	 */
	function displayImage(imgData) {
		// const imgContainer = document.querySelector('.js_background');
		const imgAuthor = document.querySelector('.js_author');

		// let img = document.createElement("img");
		// img.src = imgData.urls.regular;
		// img.src = 'bg.jpg';

		let link = document.createElement("a");
		link.href = imgData.user.links.html;
		link.classList.add('link');
		link.textContent = 'Image by: ' + imgData.user.name;

		// imgContainer.appendChild(img);
		imgAuthor.appendChild(link);
	}


	/**
	 * Fetches WeatherData from openweathermap API
	 */
	function fetchWeather() {

		/* Weather Data */
		const apiKey = apikeys.OWM_API_KEY;
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
			var berlinLong ='13.4468267';
			 weatherUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${berlinlat}&lon=${berlinLong}&appid=${apiKey}&units=${unit}&exclude=minutely`;



			fetch(weatherUrl)
				.then(response => response.json())
				.then(data => {
					displayWeather(data);
					console.log("fetched");
				}).catch(function(error) {
					console.log(error);
				});
		// }

	}

	/**
	 * Sets fetched weather data to corresponding HTML element
	 * @param {object} weatherData Fetched weather data object containing current condition and 8 days forecast
	 */
	function displayWeather(weatherData) {
		console.log(weatherData);

		/* Current weather condition */
		elements.temp.textContent = Math.round(weatherData.current.temp, 2);
		elements.description.textContent = weatherData.current.weather[0].description;

		elements.tempMin.textContent = Math.round(weatherData.daily[0].temp.min, 2);
		elements.tempMax.textContent = Math.round(weatherData.daily[0].temp.max, 2);
		elements.chanceOfRain.textContent = Math.round(weatherData.hourly[0].pop * 100, 2) + '%';
		elements.uvIndex.textContent = weatherData.current.uvi;
		elements.wind.textContent = weatherData.current.wind_deg + "deg / " + weatherData.current.wind_speed;
		elements.sunrise.textContent = getTimeFromTimestamp(weatherData.current.sunrise);
		elements.sunset.textContent = getTimeFromTimestamp(weatherData.current.sunset);

		// elements.icon.src = 'weather_3d/' +weatherData.current.weather[0].icon + '.png';
		/* Forecast */
		// forecastElems.list
		// weatherData.daily.forEach(item, function() {
		//
		// });

		createForecastList(weatherData);

	}

	/**
	 * Display forecast data
	 * @param {object} weatherData Fetched weather data object containing current condition and 8 days forecast
	 */
	// function createForecastList(weatherData) {
	//
	// 	const listItem = document.querySelector('.day');
	// 	let dayMin = listItem.querySelector('.js_day_min');
	// 	let dayMax = listItem.querySelector('.js_day_max');
	// 	let dayDay = listItem.querySelector('.js_day_day');
	// 	let dayIcon = listItem.querySelector('.js_day_icon');
	// 	// let dayMin = listItem.querySelector('.js_day_min');
	//
	//
	// 	dayMin.textContent = Math.round(weatherData.daily[1].temp.min,2) + '°';
	// 	dayMax.textContent = Math.round(weatherData.daily[1].temp.max,2) + '°';
	// 	dayIcon.src = 'assets/icons/weather/' + weatherData.daily[1].weather[0].icon + '@2x.png';
	// }

	const createForecastList = (weatherData) => {

		let dailyWeather = weatherData.daily;

		for (let i = 0; i < dailyWeather.length; i++) {
			let day = dailyWeather[i];

			// skip days 0 (today), 6 and 7
			if ([0, 5, 6].indexOf(i) === -1) {
				let listItem = `<li class="day" data-idx="${i}" data-day="${getDayOfMonthFromTimestamp(day.dt)}">
					<span class="day_day js_day_day">${getDayFromTimestamp(day.dt)}</span>
					<img class="day_icon js_day_icon" width="60" src="assets/icons/weather/${day.weather[0].icon}@2x.png" />
					<span class="day_min_max">
						<span class="day_max js_day_max">${Math.round(day.temp.max,2)}°</span>
						<span class="day_min js_day_min">${Math.round(day.temp.min,2)}°</span>
					</span>
					<span class="day_description js_day_description">${day.weather[0].main}</span>
				</li>`;

				elements.forecastList.appendChild(forecastItemnode(listItem));
			}
		}

	};


	const forecastItemnode = (item) => {
		var template = document.createElement('template');
		template.innerHTML = item;
		return template.content.childNodes[0];
	};


	/* Return Day from Timestamp */
	function getDayFromTimestamp(timestamp) {
		var date;
		var dayOfWeek;
		var daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

		date = new Date(timestamp * 1000);
		dayOfWeek = daysShort[date.getDay()];

		return dayOfWeek;
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


})();