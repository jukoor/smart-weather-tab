(function() {

	// Alias
	const find = document.querySelector.bind(document);
	const findAll = document.querySelectorAll.bind(document);
	const findId = document.getElementById.bind(document);

	// API Keys
	const weatherApiKey = apikeys.OWM_API_KEY;
	// const clientId = apikeys.UNSPLASH_CLIENT_ID;

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
		tempMode: 'celsius',
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
		description: find('.js_description'),
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
			} else {
				chrome.storage.sync.set({
					cityName: ''
				});
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
				elements.settingsTempBool.checked = data.settingsTempmode === 'celsius' ? true : false;
				// Create a new 'change' event
				var event = new Event('change');
				// Dispatch it.
				elements.settingsWindBool.dispatchEvent(event);
			} else {
				// if there is no data, like on the first try, write default value "celsius"
				chrome.storage.sync.set({
					settingsTempmode: 'celsius'
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
				// set default value to 'celsius'
				chrome.storage.sync.set({
					settingsTempmode: 'celsius'
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
			fetchWeather(savedSettings.tempMode, coordinates.latitude, coordinates.longitude);
		}

		function error(err) {
			console.warn(`ERROR(${err.code}): ${err.message}`);
		}

		// if user location is already known - use the one stored instead of finding it
		chrome.storage.sync.get('userLocation', function(data) {
			if (data.userLocation !== undefined) {
				fetchWeather(savedSettings.tempMode, data.userLocation.lat, data.userLocation.long, savedSettings.cityName);
			} else {
				navigator.geolocation.getCurrentPosition(success, error, options);
			}
		});
	}

	/**
	 * Fetches WeatherData from openweathermap API
	 * @param {string} weatherUnit - Weather unit 'celsius' or 'fahrenheit'
	 * @param {number} lat - Location coordinates latitute
	 * @param {number} long - Location coordinates longitude
	 * @param {string} city - City name, selected after citysearch-autocomplete
	 */
	function fetchWeather(weatherUnit, lat, long, city) {

		var unit = weatherUnit;
		var userPosLat = lat;
		var userPosLong = long;
		var weatherUrl;

		fetchAndDisplayUserLocation(userPosLat, userPosLong, city);

		weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${userPosLat}&longitude=${userPosLong}&hourly=temperature_2m,precipitation,weathercode&daily=shortwave_radiation_sum,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,windspeed_10m_max,shortwave_radiation_sum&current_weather=true&temperature_unit=${unit}&windspeed_unit=mph&timezone=auto`;

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
	 * Reverse geocoding user location and display corresponding city and country
	 * @param {number} lat - Location coordinates latitute
	 * @param {number} long - Location coordinates longitude
	 */
	function fetchAndDisplayUserLocation(lat, long, city) {

		// Fetch cities from coordinates: reverse geocoding
		var cityFromCrds = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${long}&limit=5&appid=${weatherApiKey}`;
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

	}

	/**
	 * Sets fetched weather data to corresponding HTML element
	 * @param {Object} weatherData - Fetched weather data object containing current condition and 8 days forecast
	 * @param {number} day - Number of day in the week starting at zero to fetch weather for that day
	 */
	function displayWeather(weatherData, day, weatherUnit) {
		console.log(weatherData);

		// Current weather condition getCurrentTemp()
		elements.temp.textContent = Math.round(weatherData.current_weather.temperature, 2);
		elements.description.textContent = getIconForWeather(weatherData.hourly.weathercode[new Date().getHours()]);

		// Highlights
		elements.tempMinMax.textContent = Math.round(weatherData.daily.temperature_2m_min[day], 2) + '° / ' + Math.round(weatherData.daily.temperature_2m_max[0], 2) + '°';
		elements.chanceOfRain.textContent = Math.round(weatherData.daily.precipitation_sum[day], 2) + ' mm';
		// elements.uvIndex.textContent = Math.round(weatherData.daily[day].uvi, 2);
		elements.wind.textContent = setWindSpeed(weatherData.current_weather.windspeed);
		elements.sunriseSunset.textContent = getTimeFromTimestamp(weatherData.daily.sunrise[day]) + ' / ' + getTimeFromTimestamp(weatherData.daily.sunset[day]);
		fetchAndSetAirQualityData(day);

		elements.bgImg.src = 'assets/img/weather/' + weatherData.hourly.weathercode[new Date().getHours()] + '.jpg';

		if (day === 0) {
			// createForecastList(weatherData);
		}
	}

	/**
	 * Get, format and display wind speed
	 * @param {number} windSpeed - Formats fetched wind speed according to user settigns
	 */
	function setWindSpeed(windSpeed) {
		savedSettings.windSpeed = windSpeed;

		var windMode = savedSettings.windMode;

		if (windMode == 'kmh') {
			return Math.round(savedSettings.windSpeed, 2) + " km/h";
		} else if (windMode == 'mph') {
			return Math.round(savedSettings.windSpeed / 1.609, 2) + " mph";
		}
	}

	/**
	 * Fetches open meteo air pollution API and displays value
	 * @param {number} day - Number of day in the week starting at zero to fetch weather for that day
	 */
	function fetchAndSetAirQualityData(day) {
		console.log(savedSettings.cityLat, savedSettings.cityLon);
		const airPollutionUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.5235&longitude=13.4115&hourly=pm10,uv_index';
		const ratings = ['Good', 'Fair', 'Moderate', 'Bad', 'Unhealthy'];

		// Air Quality API
		fetch(airPollutionUrl)
			.then(response => response.json())
			.then(data => {
				connsole.log(data);
				// elements.airquality.textContent = ratings[data.list[0].main.aqi - 1];
				// elements.airquality.textContent = data.
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
	 * Takes weather ID from API and returns corresponding emoji as string plus text
	 * @param {number} weatherId - weather ID from openweathermap
	 * @return {string} Weather condition string as emoji and text
	 */
	function getIconForWeather(weatherId) {

		// simpliefied WMO Weather interpretation codes
		var emojiLookup = {
			0: '☀️ Clear sky',
			1: '🌤 Mainly clear',
			2: '⛅️ Partly cloudy',
			3: '☁️ Overcast',
			45: '🌫 Fog',
			46: '🌫 Depositing rime fog',
			51: '🌧 Drizzle (light)',
			53: '🌧 Drizzle (moderate)',
			55: '🌧 Drizzle (dense)',
			56: '🌨 Freezing Drizzle (light)',
			57: '🌨 Freezing Drizzle (dense)',
			61: '🌧 Rain (slight)',
			63: '🌧 Rain (moderate)',
			65: '🌧 Rain (heavy)',
			66: '🌨 Freezing Rain (light)',
			67: '🌨 Freezing Rain (heavy)',
			71: '❄️ Snow (slight)',
			73: '❄️ Snow (moderate)',
			75: '❄️ Snow (heavy)',
			77: '❄️ Snow grains',
			80: '🌧 Rain showers (light)',
			81: '🌧 Rain showers (moderate)',
			82: '🌧 Rain showers (violent)',
			85: '❄️ Snow showers (slight)',
			86: '❄️ Snow showers (heavy)',
			95: '🌪 Thunderstorm',
			96: '🌪 Thunderstorm with hail (slight)',
			99: '🌪 Thunderstorm with hail (heavy)'
		};

		return emojiLookup[weatherId];
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

		date = new Date(timestamp);
		hour = date.toLocaleTimeString();
		// remove seconds
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
				fetchWeather(savedSettings.tempMode, me.dataset.lat, me.dataset.lon, me.dataset.city);
			}, 300);
		});

		// Settings: Temperature mode; true: 'celius', false: 'fahrenheit'
		elements.settingsTempBool.addEventListener('change', function() {
			var checked = this.checked;
			if (this.checked) {
				savedSettings.tempMode = 'celsius';
			} else {
				savedSettings.tempMode = 'fahrenheit';
			}

			fetchWeather(savedSettings.tempMode, savedSettings.cityLat, savedSettings.cityLon);

			// Save selected value to chrome storage
			chrome.storage.sync.set({
				settingsTempmode: checked ? 'celsius' : 'fahrenheit'
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