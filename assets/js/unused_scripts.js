/**
 * Fetch image from Unsplash API
 */
function fetchImage() {

	fetch(unsplasSourceUrl)
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
function displayImage(imgLink) {

	const imgContainer = document.querySelector('.js_background');
	const imgAuthor = document.querySelector('.js_author');

	let img = document.createElement("img");
	img.src = imgData.urls.regular;
	img.src = 'bg.jpg';

	let link = document.createElement("a");
	link.href = imgData.user.links.html;
	link.classList.add('link');
	link.textContent = 'Image by: ' + imgData.user.name;

	imgContainer.appendChild(img);
	imgAuthor.appendChild(link);

	elements.currentWeather.style.backgroundImage = "url('" + imgLink + "')";
}