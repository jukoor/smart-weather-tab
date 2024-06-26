/* - Author: Julian Orth
   - Version: 1.0
	 - URL: https://github.com/jukoor/smart-weather-tab
	 - Date: 01.2023
	 - Purpose: Fetch weather data from open-meteo API and display it in chrome new tab window
*/

(function() {

	// Alias
	const find = document.querySelector.bind(document);
	const findAll = document.querySelectorAll.bind(document);
	const findId = document.getElementById.bind(document);

	let weatherDataTemp;

	// Local settings defaults
	var savedSettings = {
		cityLat: 0,
		cityLon: 0,
		cityName: '',
		countryShort: '',
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

		chrome.storage.sync.get('cityName', function(data) {
			// If there is a value, set value to input element and trigger change event
			if (data.cityName !== undefined) {
				savedSettings.cityName = data.cityName;
			} else {
				chrome.storage.sync.set({
					cityName: ''
				});
			}
		});

		chrome.storage.sync.get('countryShort', function(data) {
			// If there is a value, set value to input element and trigger change event
			if (data.countryShort !== undefined) {
				savedSettings.countryShort = data.countryShort;
			} else {
				chrome.storage.sync.set({
					countryShort: ''
				});
			}
		});

		// Get darkmode-setting, set it to input field and trigger change event
		chrome.storage.sync.get('settingsDarkmode', function(data) {
			// If there is a value, set value to input element and trigger change event
			if (data.settingsDarkmode !== undefined) {
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
			if (data.settingsWindmode !== undefined) {
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
			if (data.settingsTempmode !== undefined) {
				elements.settingsTempBool.checked = data.settingsTempmode === 'celsius' ? true : false;
				// Create a new 'change' event
				var event = new Event('change');
				// Dispatch it.
				elements.settingsTempBool.dispatchEvent(event);
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
	}

	/**
	 * Get, format and display current date
	 */
	function setCurrentDate() {
		const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var today = new Date();
		var day = today.getDay();
		var fullDate = today.getDate() + ', ' + months[(today.getMonth())].substring(0, 3) + ' ' + today.getFullYear();

		elements.date.textContent = weekdays[day - 1] + " " + fullDate;
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

			savedSettings.cityLat = coordinates.latitude;
			savedSettings.cityLon = coordinates.longitude;

			// Fetch weather
			console.log("fetching from user pos");
			fetchWeather();
		}

		function error(err) {
			console.warn(`ERROR(${err.code}): ${err.message}`);
		}

		// if user location is already known - use the one stored instead of finding it
		chrome.storage.sync.get('userLocation', function(data) {
			if (data.userLocation !== undefined) {
				savedSettings.cityLat = data.userLocation.lat;
				savedSettings.cityLon = data.userLocation.long;
				fetchWeather(savedSettings.cityName, savedSettings.countryShort);
			} else {
				navigator.geolocation.getCurrentPosition(success, error, options);
			}
		});
	}

	/**
	 * Fetches WeatherData from open-meteo API
	 * @param {string} city - City name, selected after citysearch-autocomplete
	 * @param {string} countryCode - 2-letter country code like "DE" for germanny
	 */
	function fetchWeather(city, countryCode) {

		var unit = savedSettings.tempMode;
		var userPosLat = savedSettings.cityLat;
		var userPosLong = savedSettings.cityLon;
		var weatherUrl;

		fetchAndDisplayUserLocation(userPosLat, userPosLong, city, countryCode);

		weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${userPosLat}&longitude=${userPosLong}&hourly=temperature_2m,precipitation&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,windspeed_10m_max&current_weather=true&temperature_unit=${unit}&timezone=auto`;

		// fetch weather API only once per hour to minimize API calls
		// use stored weather object if its not older than a day
		chrome.storage.sync.get('weatherDataFetchedTimestamp', function(data) {
			if (data.weatherDataFetchedTimestamp !== undefined) {

				var oneHourInMilliseconds = 3600000;

				// do once per hour
				if ((Date.now() - data.weatherDataFetchedTimestamp) > oneHourInMilliseconds) {
					// more than 1 hour since last fetch -> fetch new weather data from API

					fetch(weatherUrl)
						.then(response => response.json())
						.then(data => {
							// store fetched weather data  in chrome storage
							chrome.storage.sync.set({
								weatherData: data
							});

							// set timestamp
							chrome.storage.sync.set({
								weatherDataFetchedTimestamp: Date.now()
							});

							displayWeather(data, 0);
							weatherDataTemp = data;
							document.body.dataset.tempMode = unit;
						}).catch(function(error) {
							console.log(error);
						});
				} else if (data.weatherDataFetchedTimestamp == 0) {} else {
					// shorter than 1 day since last fetch - use data stored in chrome storage
					chrome.storage.sync.get('weatherData', function(data) {
						displayWeather(data.weatherData, 0);

						weatherDataTemp = data.weatherData;
						document.body.dataset.tempMode = unit;
					});
				}
			} else {
				// timestamp not filled yet - fetch and store weather data from API
				fetch(weatherUrl)
					.then(response => response.json())
					.then(data => {

						// store fetched weather data  in chrome storage
						chrome.storage.sync.set({
							weatherData: data
						});

						// set timestamp
						chrome.storage.sync.set({
							weatherDataFetchedTimestamp: Date.now()
						});

						displayWeather(data, 0);
						weatherDataTemp = data;
						document.body.dataset.tempMode = unit;
					}).catch(function(error) {
						console.log(error);
					});
			}
		});

	}

	/**
	 * Reverse geocoding user location and display corresponding city and country
	 * @param {number} lat - Location coordinates latitute
	 * @param {number} long - Location coordinates longitude
	 * @param {string} city - City name, selected from citysearch-autocomplete
	 * @param {string} countryCode - 2-letter country code like "DE" for germanny
	 */
	function fetchAndDisplayUserLocation(lat, long, city, countryCode) {

		// Fetch cities from coordinates: reverse geocoding with bigdatacloud.net api
		var cityFromCrds = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=en`;
		fetch(cityFromCrds)
			.then(response => response.json())
			.then(data => {

				// Display user location: city and country
				if (city) {
					elements.locationCity.textContent = city;
				} else {
					elements.locationCity.textContent = data.city;
					chrome.storage.sync.set({
						cityName: data.city
					});
				}

				if (countryCode) {
					elements.locationCountry.textContent = countryCode;
					chrome.storage.sync.set({
						countryShort: countryCode
					});
				} else {
					elements.locationCountry.textContent = data.countryCode;
					chrome.storage.sync.set({
						countryShort: data.countryCode
					});
				}

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

				if (countryShort) {
					chrome.storage.sync.set({
						countryShort: countryShort
					});
				} else {
					chrome.storage.sync.set({
						countryShort: data[0].country
					});
				}

				chrome.storage.sync.set({
					userLocation: {
						lat: userPosLat,
						long: userPosLong
					}
				});

			}).catch(function(error) {});
	}

	/**
	 * Sets fetched weather data to corresponding HTML element
	 * @param {Object} weatherData - Fetched weather data object containing current condition and 8 days forecast
	 * @param {number} day - Number of day in the week starting at zero to fetch weather for that day
	 */
	function displayWeather(weatherData, day) {

		// Current weather condition
		elements.temp.textContent = Math.round(weatherData.current_weather.temperature, 2);
		elements.description.textContent = getIconForWeather(weatherData.current_weather.weathercode);

		// Highlights
		elements.tempMinMax.textContent = Math.round(weatherData.daily.temperature_2m_max[day], 2) + '° / ' + Math.round(weatherData.daily.temperature_2m_min[day], 2) + '°';
		elements.chanceOfRain.textContent = Math.round(weatherData.daily.precipitation_sum[day], 2) + ' mm';

		elements.wind.textContent = setWindSpeed(weatherData.daily.windspeed_10m_max[day]);
		elements.sunriseSunset.textContent = getTimeFromTimestamp(weatherData.daily.sunrise[day]) + ' / ' + getTimeFromTimestamp(weatherData.daily.sunset[day]);
		fetchAndSetAirQualityAndUVData(day);
		var weatherCode = "" + weatherData.current_weather.weathercode;
		elements.bgImg.src = 'assets/img/weather/' + weatherCode.charAt(0) + '.jpg';

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

		var windMode = savedSettings.windMode;

		if (windMode == 'kmh') {
			return Math.round(savedSettings.windSpeed, 2) + " km/h";
		} else if (windMode == 'mph') {
			return Math.round(savedSettings.windSpeed / 1.609, 2) + " mph";
		}
	}

	/**
	 * Fetches open meteo air pollution API and displays value of air pollution and uv index
	 */
	function fetchAndSetAirQualityAndUVData(day) {
		const airPollutionUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${savedSettings.cityLat}&longitude=${savedSettings.cityLon}&hourly=pm10,uv_index`;
		const ratings = ['Good', 'Fair', 'Poor', 'Very poor', 'Unhealthy'];
		let airQualityPm10;
		let airQualityRating;

		// Air Quality API
		fetch(airPollutionUrl)
			.then(response => response.json())
			.then(data => {
				// open meteo forecast only provides data for 4 days for uvindex and air quality
				if (day == 5) {
					day = 4;
				}

				airQualityPm10 = data.hourly.pm10[new Date().getHours() + (24 * day)];
				if (airQualityPm10 < 40) {
					airQualityRating = ratings[0];
				} else if (airQualityPm10 >= 40 && airQualityPm10 < 80) {
					airQualityRating = ratings[1];
				} else if (airQualityPm10 >= 80 && airQualityPm10 < 120) {
					airQualityRating = ratings[2];
				} else if (airQualityPm10 >= 120 && airQualityPm10 < 300) {
					airQualityRating = ratings[3];
				} else if (airQualityPm10 >= 300) {
					airQualityRating = ratings[4];
				}

				elements.airquality.textContent = airQualityRating;
				elements.uvIndex.textContent = data.hourly.uv_index[new Date().getHours() + (24 * day)];

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
		let weatherCodeFirstChar;

		// Clear list
		elements.forecastList.innerHTML = '';

		for (var i = 0; i < dailyWeather.sunset.length; i++) {

			weatherCodeFirstChar = '' + dailyWeather.weathercode[i];
			weatherCodeFirstChar = weatherCodeFirstChar.charAt(0);
			// Skip days 0 (today), 6 and 7 to create the 5 day forecast, starting from tomorrow
			if ([0, 6, 7].indexOf(i) === -1) {
				var listItem =
					`<li class="day js_day" data-idx="${i}" data-day="${getDayOfMonthFromTimestamp(dailyWeather.time[i])}">
						<span class="date_day">${getDayFromTimestamp(dailyWeather.time[i])}</span>
						<span class="icon_description">
							<img class="day_icon js_day_icon" width="60" src="assets/icons/weather/${weatherCodeFirstChar}.svg" />
							<span class="day_description js_day_description">${getIconForWeather(dailyWeather.weathercode[i])}</span>
						</span>
						<span class="day_min_max">
							<span class="day_max js_day_max">${Math.round(dailyWeather.temperature_2m_max[i],2)}°</span>
							<span class="day_min js_day_min">${Math.round(dailyWeather.temperature_2m_min[i],2)}°</span>
						</span>
					</li>`;

				elements.forecastList.appendChild(createItemNode(listItem, i, getDayFromTimestamp(dailyWeather.time[i])));
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
	 * @param {string} timestamp - Timestamp of weather condition
	 */
	function getDayFromTimestamp(timestamp) {
		var date;
		var dayOfWeek;
		var daysShort = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

		date = new Date(timestamp);
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
	 * @param {number} weatherId - weather ID from open-meteo
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
			51: '🌧 Drizzle',
			53: '🌧 Drizzle',
			55: '🌧 Drizzle',
			56: '🌨 Freezing Drizzle',
			57: '🌨 Freezing Drizzle',
			61: '🌧 Rain',
			63: '🌧 Rain',
			65: '🌧 Rain',
			66: '🌨 Freezing Rain',
			67: '🌨 Freezing Rain',
			71: '❄️ Snow',
			73: '❄️ Snow',
			75: '❄️ Snow',
			77: '❄️ Snow grains',
			80: '🌧 Rain showers',
			81: '🌧 Rain showers',
			82: '🌧 Rain showers',
			85: '❄️ Snow showers',
			86: '❄️ Snow showers',
			95: '🌪 Thunderstorm',
			96: '🌪 Thunderstorm with hail',
			99: '🌪 Thunderstorm with hail'
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

		date = new Date(timestamp);
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
		// Settings: City search input - fetch open-meteo api for city names
		elements.settingsLocation.addEventListener('keyup', function() {
			var val = this.value;
			var valLenght = this.value.length;
			citySearchApi = `https://geocoding-api.open-meteo.com/v1/search?name=${this.value}&count=5`;

			if (valLenght > 1) {
				fetch(citySearchApi)
					.then(response => response.json())
					.then(data => {
						autocomplete(elements.settingsLocation, data.results, val);
					})
					.catch(() => {
						console.log("error");
					});
			}
		});

		// On city selection - fetch weather for it
		elements.settingsLocation.addEventListener('change', function() {
			var me = this;
			window.setTimeout(function() {
				// reset fetch-weather-timestamp

				chrome.storage.sync.set({
					weatherDataFetchedTimestamp: 0
				});

				savedSettings.cityLat = me.dataset.lat;
				savedSettings.cityLon = me.dataset.lon;

				// Save selected value to chrome storage
				chrome.storage.sync.set({
					userLocation: {
						lat: me.dataset.lat,
						long: me.dataset.lon
					}
				});

				fetchWeather(me.dataset.city, me.dataset.countryCode);
			}, 300);
		});

		// Settings: Temperature mode; true: 'celsius', false: 'fahrenheit'
		elements.settingsTempBool.addEventListener('change', function(e) {
			var checked = this.checked;
			if (this.checked) {
				savedSettings.tempMode = 'celsius';
			} else {
				savedSettings.tempMode = 'fahrenheit';
			}

			// reset fetch-weather-timestamp if event is triggered by human interaction
			if (e.isTrusted) {
				chrome.storage.sync.set({
					weatherDataFetchedTimestamp: 0
				});
				fetchWeather();
			}

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