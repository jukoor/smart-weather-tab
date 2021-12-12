(function() {

	/* Alias */
	const find = document.querySelector.bind(document);
	const findAll = document.querySelectorAll.bind(document);
	const findId = document.getElementById.bind(document);

	/* Unsplash API */
	const clientId = apikeys.UNSPLASH_CLIENT_ID;
	const unsplashUrl = `https://api.unsplash.com/photos/random?query=landscape&client_id=${clientId}`;


	/* Weather Data */
	const apiKey = apikeys.OWM_API_KEY;
	const inputVal = 'Berlin';
	const cityIdBerlin = 2950159;
	let unit = 'metric';
	let weatherUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=52.5067614&lon=13.2846508&appid=${apiKey}&units=${unit}&exclude=minutely`;

	const elements = {
		date: find('.js_date'),
		temp: find('.js_temp'),
		description: find('.js_description'),
		tempMin: find('.js_temp_min .value'),
		tempMax: find('.js_temp_max .value'),
		chanceOfRain: find('.js_chance_of_rain .value'),
		uvIndex: find('.js_uv_index .value'),
		icon: find('.js_weather_icon')
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

		elements.date.textContent = weekdays[day] + " " +  fullDate;
	}

	/**
	 * Fetch image from Unsplash API
	 */
	function fetchImage() {
		fetch(unsplashUrl)
			.then(response => response.json())
			.then(data => {
				displayImage(data);
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
		fetch(weatherUrl)
			.then(response => response.json())
			.then(data => {
				displayWeather(data);
			}).catch(function(error) {
				console.log(error);
			});
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
	function createForecastList(weatherData) {

		const listItem = document.querySelector('.day');
		let dayMin = listItem.querySelector('.js_day_min');
		let dayMax = listItem.querySelector('.js_day_max');
		let dayDay = listItem.querySelector('.js_day_day');
		let dayIcon = listItem.querySelector('.js_day_icon');
		// let dayMin = listItem.querySelector('.js_day_min');


		dayMin.textContent = Math.round(weatherData.daily[1].temp.min,2) + '°';
		dayMax.textContent = Math.round(weatherData.daily[1].temp.max,2) + '°';
		dayIcon.src = 'assets/icons/weather/' + weatherData.daily[1].weather[0].icon + '@2x.png';
	}

})();