(function() {

	// Alias
	const find = document.querySelector.bind(document);
	const findAll = document.querySelectorAll.bind(document);
	const findId = document.getElementById.bind(document);

	// API Keys
	const weatherApiKey = apikeys.OWM_API_KEY;
	const clientId = apikeys.UNSPLASH_CLIENT_ID;

	// Unsplash API
	// const unsplashUrl = `https://api.unsplash.com/photos/random?query=landscape&client_id=${clientId}`;
	// const unsplasSourceUrl = 'https://source.unsplash.com/featured?berlin&orientation=landscape';

	var weatherDataTemp;

	// Local settings defaults
	var savedSettings = {
		cityLat: 0,
		cityLon: 0,
		cityName: '',
		cityCountry: '',
		tempMode: 'celcius',
		windMode: 'kmh',
		windSpeed: 0,
		darkMode: false
	};

	// Element references
	const elements = {
		bgImg: find('.js_bg_img'),
		locationCity: find('.js_location'),
		locationCountry: find('.js_country'),
		video: find('.js_video'),
		videoSource: find('.js_video_source'),
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
		airquality: find('.js_air_quality .js_value'),
		settingsWindow: find('.js_settings'),
		settingsBlurBg: find('.js_blur_bg'),
		settingsOpen: find('.js_settings_trigger'),
		settingsClose: find('.js_settings .js_close'),
		settingsLocation: findId('locationSearch'),
		settingsTempBool: findId('settingTempMode'),
		settingsWindBool: findId('settingWindSpeed'),
		settingsDarkmodeBool: findId('settingDarkMode')
	};

	initApp();

	/**
	 * Initialize Application
	 */
	function initApp() {
		loadSettings();
		setCurrentDate();
		getUserLocation();
		initClickListener();
	}

	/**
	 * Get settings from chrome storage and save to local variable
	 */
	function loadSettings() {

		// Get darkmode-setting, set it to input field and trigger change event
		chrome.storage.sync.get('cityName', function(data) {
			// If there is a value, set value to input element and trigger change event
			if (data !== undefined) {
				savedSettings.cityName = data.cityName;
			}
		});

		// Get darkmode-setting, set it to input field and trigger change event
		chrome.storage.sync.get('settingsDarkmode', function(data) {
			// If there is a value, set value to input element and trigger change event
			if (data !== undefined) {
				elements.settingsDarkmodeBool.checked = data.settingsDarkmode;
				// Create a new 'change' event
				var event = new Event('change');
				// Dispatch it
				elements.settingsDarkmodeBool.dispatchEvent(event);
			} else {
				// if data is empty, store default value "false"
				chrome.storage.sync.set({
					settingsDarkmode: false
				});
			}
		});

		// Get windmode-setting, set it to input field and trigger change event
		chrome.storage.sync.get('settingsWindmode', function(data) {
			// If there is a value, set value to input element and trigger change event
			if (data !== undefined) {
				elements.settingsWindBool.checked = data.settingsWindmode === 'kmh' ? true : false;
				// Create a new 'change' event
				var event = new Event('change');
				// Dispatch it.
				elements.settingsWindBool.dispatchEvent(event);
			} else {
				// if there is no data, like on the first try, write default value "kmh"
				chrome.storage.sync.set({
					settingsWindmode: 'kmh'
				});
			}
		});

		// Get tempmode-setting, set it to input field and trigger change event
		chrome.storage.sync.get('settingsTempmode', function(data) {
			// If there is a value, set value to input element and trigger change event
			if (data !== undefined) {
				elements.settingsTempBool.checked = data.settingsTempmode === 'celcius' ? true : false;
				// Create a new 'change' event
				var event = new Event('change');
				// Dispatch it.
				elements.settingsWindBool.dispatchEvent(event);
			} else {
				// if there is no data, like on the first try, write default value "kmh"
				chrome.storage.sync.set({
					settingsWindmode: 'kmh'
				});
			}
		});

		// Get and set: user location
		chrome.storage.sync.get('userLocation', function(data) {
			if (data.userLocation !== undefined) {
				savedSettings.cityLat = data.userLocation.lat;
				savedSettings.cityLon = data.userLocation.long;
			}
		});

		// Get and set: temperature mode
		chrome.storage.sync.get('settingsTempmode', function(data) {
			if (data.settingsTempmode !== undefined) {
				savedSettings.tempMode = data.settingsTempmode;
			} else {
				// set default value to 'celcius'
				chrome.storage.sync.set({
					settingsTempmode: 'celcius'
				});
			}
		});
	}

	/**
	 * Get, format and display current date
	 */
	function setCurrentDate() {
		const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var today = new Date();
		var day = today.getDay();
		var fullDate = today.getDate() + ', ' + months[(today.getMonth())] + ' ' + today.getFullYear();

		elements.date.textContent = weekdays[day] + " " + fullDate;
	}

	/**
	 * Get user location by IP or by stored value
	 */
	function getUserLocation() {

		var options = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
		};

		function success(pos) {
			var coordinates = pos.coords;

			// Save user location (latitude and longitude) to chrome storage
			chrome.storage.sync.set({
				userLocation: {
					lat: coordinates.latitude,
					long: coordinates.longitude
				}
			});
			// Fetch weather
			fetchWeather(savedSettings.tempMode === 'celcius' ? 'metric' : 'imperial', coordinates.latitude, coordinates.longitude);
		}

		function error(err) {
			console.warn(`ERROR(${err.code}): ${err.message}`);
		}

		// if user location is already known - use the one stored instead of finding it
		chrome.storage.sync.get('userLocation', function(data) {
			if (data.userLocation !== undefined) {
				fetchWeather(savedSettings.tempMode === 'celcius' ? 'metric' : 'imperial', data.userLocation.lat, data.userLocation.long, savedSettings.cityName);
			} else {
				navigator.geolocation.getCurrentPosition(success, error, options);
			}
		});
	}

	/**
	 * Fetches WeatherData from openweathermap API
	 * @param {string} weatherUnit - Weather unit 'metric' or 'imperial'
	 * @param {number} lat - Location coordinates latitute
	 * @param {number} long - Location coordinates longitude
	 * @param {string} city - City name, selected after citysearch-autocomplete
	 */
	function fetchWeather(weatherUnit, lat, long, city) {

		var unit = weatherUnit;
		var userPosLat = lat;
		var userPosLong = long;
		var weatherUrl;

		// Fetch cities from coordinates: reverse geocoding
		var cityFromCrds = `http://api.openweathermap.org/geo/1.0/reverse?lat=${userPosLat}&lon=${userPosLong}&limit=5&appid=${weatherApiKey}`;
		fetch(cityFromCrds)
			.then(response => response.json())
			.then(data => {

				// Display user location: city and country
				if (city) {
					elements.locationCity.textContent = city;
				} else {
					elements.locationCity.textContent = data[0].name;
				}
				elements.locationCountry.textContent = data[0].country;

				// Save user location city and country to storage
				if (city) {
					chrome.storage.sync.set({
						cityName: city
					});
				} else {
					chrome.storage.sync.set({
						cityName: data[0].name
					});
				}

				chrome.storage.sync.set({
					countryName: data[0].country
				});

				chrome.storage.sync.set({
					userLocation: {
						lat: userPosLat,
						long: userPosLong
					}
				});

			}).catch(function(error) {
				// if (confirm("Oops!\nAn error occured while fetching data.\nReloading the page might fix this issue.")) {
				// 	location.reload();
				// } else {}
			});


		// var berlinlat = '52.5071778';
		// var berlinLong = '13.4468267';
		weatherUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${userPosLat}&lon=${userPosLong}&appid=${weatherApiKey}&units=${unit}&exclude=minutely,hourly`;

		// fetch weather data and display it
		fetch(weatherUrl)
			.then(response => response.json())
			.then(data => {
				displayWeather(data, 0, weatherUnit);
				weatherDataTemp = data;
				document.body.dataset.tempMode = '';
				document.body.dataset.tempMode = unit;
			}).catch(function(error) {
				console.log(error);
			});
	}

	/**
	 * Sets fetched weather data to corresponding HTML element
	 * @param {Object} weatherData - Fetched weather data object containing current condition and 8 days forecast
	 * @param {number} day - Number of day in the week starting at zero to fetch weather for that day
	 */
	function displayWeather(weatherData, day, weatherUnit) {
		console.log(weatherData);

		// Current weather condition
		elements.temp.textContent = Math.round(weatherData.current.temp, 2);
		elements.descriptionEmoji.textContent = getIconForWeather(weatherData.current.weather[0].id);
		elements.description.textContent = weatherData.current.weather[0].description;

		// Highlights
		elements.tempMinMax.textContent = Math.round(weatherData.daily[day].temp.max, 2) + '° / ' + Math.round(weatherData.daily[day].temp.min, 2) + '°';
		elements.chanceOfRain.textContent = Math.round(weatherData.daily[day].pop * 100, 2) + '%';
		elements.uvIndex.textContent = Math.round(weatherData.daily[day].uvi, 2);
		elements.wind.textContent = setWindSpeed(weatherData.daily[day].wind_speed);
		elements.sunriseSunset.textContent = getTimeFromTimestamp(weatherData.daily[day].sunrise) + ' / ' + getTimeFromTimestamp(weatherData.daily[day].sunset);
		fetchAndSetAirQualityData(day);

		elements.bgImg.src = 'assets/img/weather/' + weatherData.current.weather[0].icon + '.jpg';

		if (day === 0) {
			createForecastList(weatherData);
		}
	}

	/**
	 * Get, format and display wind speed
	 * @param {number} windSpeed - Formats fetched wind speed according to user settigns
	 */
	function setWindSpeed(windSpeed) {
		savedSettings.windSpeed = windSpeed;

		var windMode;

		// Save selected value to chrome storage
		chrome.storage.sync.get('settingsWindmode', function(data) {
			windMode = data.settingsWindmode;
		});

		if (savedSettings.tempMode == 'celcius' && savedSettings.windMode == 'kmh') {
			return Math.round((savedSettings.windSpeed * 3.6), 2) + " km/h";
		} else if (savedSettings.tempMode == 'celcius' && savedSettings.windMode == 'mph') {
			return Math.round((savedSettings.windSpeed * 2.237), 2) + " mph";
		} else if (savedSettings.tempMode == 'fahrenheit' && savedSettings.windMode == 'kmh') {
			return Math.round((savedSettings.windSpeed * 1.61), 2) + " km/h";
		} else if (savedSettings.tempMode == 'fahrenheit' && savedSettings.windMode == 'mph') {
			return Math.round(savedSettings.windSpeed) + " mph";
		}
	}

	/**
	 * Fetches openweathermap air pollution API and displays value
	 * @param {number} day - Number of day in the week starting at zero to fetch weather for that day
	 */
	function fetchAndSetAirQualityData(day) {

		const airPollutionUrl = `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${savedSettings.cityLat}&lon=${savedSettings.cityLon}&appid=${weatherApiKey}`;
		const ratings = ['Good', 'Fair', 'Moderate', 'Bad', 'Unhealthy'];

		// Air Quality API
		fetch(airPollutionUrl)
			.then(response => response.json())
			.then(data => {
				elements.airquality.textContent = ratings[data.list[0].main.aqi - 1];
			})
			.catch(() => {
				console.log("Air Quality Index temporarily not available. Please try again later.");
				elements.airquality.textContent = 'N/A';
			});
	}

	/**
	 * Creates 5 days forecast list from fetched weather data
	 * @param {Object} weatherData - Fetched weather data object containing current condition and 8 days forecast
	 */
	function createForecastList(weatherData) {

		var dailyWeather = weatherData.daily;

		// Clear list
		elements.forecastList.innerHTML = '';

		for (var i = 0; i < dailyWeather.length; i++) {
			var day = dailyWeather[i];

			// Skip days 0 (today), 6 and 7 to create the 5 day forecast, starting tomorrow
			if ([0, 6, 7].indexOf(i) === -1) {
				var listItem =
					`<li class="day js_day" data-idx="${i}" data-day="${getDayOfMonthFromTimestamp(day.dt)}.">
					<span class="date_day">${getDayFromTimestamp(day.dt)}</span>
					<span class="icon_description">
						<img class="day_icon js_day_icon" width="60" src="assets/icons/weather/${day.weather[0].icon}.svg" />
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
	}

	/**
	 * Creates 5 days forecast template node and adds click listener to it
	 * @param {string} item - Forecast list item HTML
	 * @param {number} i - Iterator variable passed from createForecastList()
	 * @param {string} daytext - Day of the week as string
	 * @return {Object} HTML of forecast liste item element
	 */
	function createItemNode(item, i, daytext) {
		var template = document.createElement('template');
		template.innerHTML = item;
		template.content.childNodes[0].addEventListener('click', function() {
			findAll(".js_day").forEach((el) => el.classList.remove("active"));
			this.classList.add('active');
			displayWeather(weatherDataTemp, i);
			// Update headline text
			find('.js_today_label').textContent = daytext;
			// Show today btn
			elements.setDayTodayBtn.classList.add('active');
		});
		return template.content.childNodes[0];
	}


	/**
	 * Takes timestamp and returns day of the week (shortform) as a string
	 * @param {number} timestamp - Timestamp of weather condition
	 * @return {string} Day of the week as string in 3-letter form
	 */
	function getDayShortFromTimestamp(timestamp) {
		var date;
		var dayOfWeek;
		var daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

		date = new Date(timestamp * 1000);
		dayOfWeek = daysShort[date.getDay()];

		return dayOfWeek;
	}

	/**
	 * Takes timestamp and returns day of the week as a string
	 * @param {number} timestamp - Timestamp of weather condition
	 * @return {string} Day of the week as string
	 */
	function getDayFromTimestamp(timestamp) {
		var date;
		var dayOfWeek;
		var daysShort = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

		date = new Date(timestamp * 1000);
		dayOfWeek = daysShort[date.getDay()];

		return dayOfWeek;
	}

	/**
	 * Takes timestamp and returns month of the year as a string in 3-letter shortform
	 * @param {number} timestamp - Timestamp of weather condition
	 * @return {string} Month of the year as shortened string
	 */
	function getMonthShortFromTimestamp(timestamp) {
		var date;
		var dayOfWeek;
		const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var today = new Date();
		var day = today.getDay();


		return monthsShort[(today.getMonth())];
	}

	/**
	 * Takes weather ID from openweathermap and returns corresponding emoji as string
	 * @param {number} weatherId - weather ID from openweathermap
	 * @return {string} Weather condition string as emoji
	 */
	function getIconForWeather(weatherId) {
		var weatherIdString = weatherId.toString(10);
		var idFirstNumber = weatherIdString.charAt(0);

		// if weather condition id starts with 8, use the full id, otherwise only the first number
		var lookUpId = parseInt(idFirstNumber) == 8 ? weatherId : idFirstNumber;

		var emojiLookup = {
			2: '🌪', // thunderstorm
			3: '🌧', // drizzle: light rain
			5: '☔️', // rain
			6: '❄️', // snow
			7: '🌀', // atmosphere: smoke/dust
			800: '☀️', // clear sky/sun
			801: '🌤', // few clouds
			802: '⛅️', // medium clouds
			803: '🌥', // many clouds
			804: '☁️' // complete clouds
		};

		return emojiLookup[lookUpId];
	}

	/**
	 * Takes timestamp and returns day of the month as number
	 * @param {number} timestamp - Timestamp of weather condition
	 * @return {number} Day of month as number
	 */
	function getDayOfMonthFromTimestamp(timestamp) {
		var date;
		var dayOfMonth;

		date = new Date(timestamp * 1000);
		dayOfMonth = date.getDate();
		return dayOfMonth;
	}

	/**
	 * Takes timestamp and returns it human-readable
	 * @param {number} timestamp - Timestamp of weather condition
	 * @return {string} Time in human-readable format hh:mm
	 */
	function getTimeFromTimestamp(timestamp) {
		var date;
		var hour;

		date = new Date(timestamp * 1000);
		hour = date.toLocaleTimeString();
		return hour.slice(0, -3);
	}

	/**
	 * Initialize click listeners
	 */
	function initClickListener() {
		// Reset highlights data to today
		elements.setDayTodayBtn.addEventListener('click', function() {
			this.classList.remove('active');
			findAll(".js_day").forEach((el) => el.classList.remove("active"));
			find('.js_today_label').textContent = 'Today';
			displayWeather(weatherDataTemp, 0, 1);
		});

		// Settings: close trigger
		elements.settingsClose.addEventListener('click', function() {
			elements.settingsWindow.classList.remove('active');
			elements.settingsBlurBg.classList.remove('active');
		});

		elements.settingsBlurBg.addEventListener('click', function() {
			elements.settingsWindow.classList.remove('active');
			this.classList.remove('active');
		});

		// Settings: open trigger
		elements.settingsOpen.addEventListener('click', function() {
			elements.settingsWindow.classList.add('active');
			elements.settingsBlurBg.classList.add('active');
		});


		var citySearchApi;
		var citySearchLength = 0;
		// Settings: City search input - fetch openweathermap api for city names
		elements.settingsLocation.addEventListener('keyup', function() {
			var val = this.value;
			var valLenght = this.value.length;
			citySearchApi = `http://api.openweathermap.org/geo/1.0/direct?q=${this.value}&limit=5&appid=${weatherApiKey}`;

			if (valLenght > 1) {
				fetch(citySearchApi)
					.then(response => response.json())
					.then(data => {
						autocomplete(elements.settingsLocation, data, val);
					})
					.catch(() => {
						// show confirm dialog and reload page, if an error occurs
						// if (confirm("Oops!\nAn error occured while fetching data.\nReloading the page might fix this issue.")) {
						// 	location.reload();
						// }
					});
			}
		});

		// On city selection - fetch weather for it
		elements.settingsLocation.addEventListener('change', function() {
			var me = this;

			window.setTimeout(function() {
				fetchWeather(savedSettings.tempMode === 'celcius' ? 'metric' : 'imperial', me.dataset.lat, me.dataset.lon, me.dataset.city);
			}, 300);
		});

		// Settings: Temperature mode; true: 'celius', false: 'fahrenheit'
		elements.settingsTempBool.addEventListener('change', function() {
			var checked = this.checked;
			if (this.checked) {
				savedSettings.tempMode = 'celcius';
				fetchWeather('metric', savedSettings.cityLat, savedSettings.cityLon);
			} else {
				savedSettings.tempMode = 'fahrenheit';
				fetchWeather('imperial', savedSettings.cityLat, savedSettings.cityLon);
			}

			// Save selected value to chrome storage
			chrome.storage.sync.set({
				settingsTempmode: checked ? 'celcius' : 'fahrenheit'
			});
		});

		// Settings: Wind Mode; true: 'kmh', false: 'mph'
		elements.settingsWindBool.addEventListener('change', function() {
			if (this.checked) {
				savedSettings.windMode = 'kmh';
			} else {
				savedSettings.windMode = 'mph';
			}

			// Save selected value to chrome storage
			chrome.storage.sync.set({
				settingsWindmode: savedSettings.windMode
			});

			elements.wind.textContent = setWindSpeed(savedSettings.windSpeed);
		});

		// Settings: Dark mode
		elements.settingsDarkmodeBool.addEventListener('change', function() {
			if (this.checked) {
				document.body.classList.add('darkmode');
			} else {
				document.body.classList.remove('darkmode');
			}

			// Save selected value to chrome storage
			chrome.storage.sync.set({
				settingsDarkmode: this.checked
			});
		});
	}
})();