/* Source: https://www.w3schools.com/howto/howto_js_autocomplete.asp */

function autocomplete(inp, arr, value) {
	var currentFocus;

	var a, b, i, val = value;
	var substring = '';
	var countryIcon;
	/*close any already open lists of autocompleted values*/
	closeAllLists();
	if (!val) {
		return false;
	}
	currentFocus = -1;
	/*create a DIV element that will contain the items (values):*/
	a = document.createElement("DIV");
	a.setAttribute("id", inp.id + "-autocomplete-list");
	a.setAttribute("class", "autocomplete-items");
	/*append the DIV element as a child of the autocomplete container:*/
	inp.parentNode.appendChild(a);

	for (i = 0; i < arr.length; i++) {

		if (arr[i].name.substr(0, val.length).toUpperCase() == val.toUpperCase()) {

			b = document.createElement("DIV");
			b.classList.add('country_item');

			countryIcon = document.createElement("IMG");
			countryIcon.classList.add('country_icon');
			countryIcon.src = "assets/icons/country_flags/" + arr[i].country.toLowerCase() + ".svg";

			/*make the matching letters bold:*/
			var c = document.createElement("P");
			c.classList.add('listitem');

			substring = arr[i].name.substr(val.length);
			if (arr[i].state) {
				substring += ", " + arr[i].state;
			}
			substring += ", " + arr[i].country;

			b.innerHTML = "<span><strong>" + arr[i].name.substr(0, val.length) + "</strong><span>" + substring + "</span></span>";

			/*insert a input field that will hold the current array item's value:*/
			b.innerHTML += "<input type='hidden' value='" + arr[i].name + "'>";

			c.dataset.lat = arr[i].lat;
			c.dataset.lon = arr[i].lon;

			c.addEventListener("click", function(e) {
				inp.dataset.lat = this.dataset.lat;
				inp.dataset.lon = this.dataset.lon;
				inp.dataset.city = this.querySelector('input').value;

				inp.value = this.getElementsByTagName("input")[0].value;

				closeAllLists();
			});
			c.appendChild(b);
			c.prepend(countryIcon);
			a.appendChild(c);
		}
	}


	function closeAllLists(elmnt) {
		/*close all autocomplete lists in the document,
		except the one passed as an argument:*/
		var x = document.getElementsByClassName("autocomplete-items");
		for (var i = 0; i < x.length; i++) {
			if (elmnt != x[i] && elmnt != inp) {
				x[i].parentNode.removeChild(x[i]);
			}
		}
	}
	/*execute a function when someone clicks in the document:*/
	document.addEventListener("click", function(e) {
		closeAllLists(e.target);
	});
}