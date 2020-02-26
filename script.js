var classes = [];



window.onload = function() {
	var xhttp = new XMLHttpRequest();
	var parser = new DOMParser();

	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var vertPlanOriginal = parser.parseFromString(this.responseText, "text/html");
			var vertPlanJson = convertToJSON(vertPlanOriginal);
			vertPlanJson = JSON.parse(JSON.stringify(vertPlanJson).replace(/  +/g, ' '));

			displayJsonAsHtml(vertPlanJson);

			addFilterOptions();
			filterResultsByClass();
		}
	};

	xhttp.open("GET", window.location.origin + "/original_plan.html");
	xhttp.send();
};




function convertToJSON(original) {
	var json = {};

	var day1 = original.getElementsByClassName("mon_title")[0].innerText;
	var day1TableRows = original.querySelector("center > p > table > tbody").childNodes;

	var day2 = original.getElementsByClassName("mon_title")[1].innerText;
	var day2TableRows = original.querySelector("body > p > table > tbody").childNodes;

	json[day1] = rowsToJSON(day1TableRows);
	json[day2] = rowsToJSON(day2TableRows);


	function rowsToJSON(tableRows) {
		var classesJson = {};

		for (var i=2;i<tableRows.length;i+= 2) {
			var firstChildNodeOfRow = tableRows[i].childNodes[0];

			if (firstChildNodeOfRow.className == "list inline_header") {
				var className = firstChildNodeOfRow.innerText;

				if (classes.indexOf(className) < 0) {
					classes.push(className);
				}

				classesJson[className] = [];

				for (var j=i+2;j<tableRows.length;j+=2) {
					var firstChildNodeOfRow2 = tableRows[j].childNodes[0];

					if (firstChildNodeOfRow2.className == "list inline_header") {
						break;
					}

					var eventOriginal = tableRows[j].childNodes;
					var eventsJson = {};

					eventsJson["Typ"] = eventOriginal[0].innerText;
					eventsJson["Stunde(n)"] = eventOriginal[1].innerText;
					eventsJson["(Fach)"] = eventOriginal[3].innerText;
					eventsJson["Fach"] = eventOriginal[4].innerText;
					eventsJson["(Raum)"] = eventOriginal[5].innerText;
					eventsJson["Raum"] = eventOriginal[6].innerText;
					eventsJson["(Lehrer)"] = eventOriginal[7].innerText;
					eventsJson["Vertreter"] = eventOriginal[8].innerText;
					eventsJson["Betroffene Klassen"] = eventOriginal[2].innerText;
					eventsJson["Vertertungstext"]= eventOriginal[9].innerText;

					classesJson[className].push(eventsJson)	
				}
			}
		}

		return classesJson;
	}

	return json;
}




function displayJsonAsHtml(json) {
	for (day in json) {
		var dayContainer = document.createElement("div");
		dayContainer.className = "expandable day_container";

		dayContainer.innerHTML = 
			"<div class='header day_header'>" +
				"<span>" + day + "</span>" + 
				"<span class='icon-arrow-down'></span>" +
			"</div>";

		document.getElementById("vertretungsplan_container").append(dayContainer);

		for (className in json[day]) {
			var classDetails = document.createElement("div");
			classDetails.className = "expandable class_container";

			classDetails.innerHTML = 
				"<div class='header class_header'>" +
					"<span>" + className + "</span>" + 
					"<span class='icon-arrow-down'></span>" +
				"</div>";

			dayContainer.append(classDetails);

			for (event of json[day][className]) {
				var eventContainer = document.createElement("div");
				eventContainer.className = "expandable event_container";
				eventContainer.innerHTML = 
					"<div class='header event_header'>" +
						`<span>${event["(Fach)"]}, ${event["(Lehrer)"]}</span>` + 
						"<span class='icon-arrow-down'></span>" +
					"</div>";

				classDetails.append(eventContainer);

				eventInfoContainer = document.createElement("div");
				eventInfoContainer.classList.add("event_info_container");
				eventContainer.append(eventInfoContainer);

				for (eventInfoKey in event) {
					if (event[eventInfoKey] != "---" && event[eventInfoKey] == event[eventInfoKey].trim()) {
						if (eventInfoKey != "(Fach)" && eventInfoKey != "(Lehrer)") {
							eventInfoContainer.innerHTML +=
								`<div>${eventInfoKey}:</div>` +
								`<div>${event[eventInfoKey]}</div>`;
						}
					}
				}
			}
		}
	}

	add_expandable_listeners();
}




function add_expandable_listeners() {
	var expandable_headers = document.querySelectorAll(".expandable > .header");

	for (header of expandable_headers) {
		header.addEventListener("click", function(event) {
			var closest_expandable = event.target.closest(".expandable");
			var arrow_icon = closest_expandable.getElementsByTagName("span")[1];


			if (closest_expandable.classList.contains("open")) {
				closest_expandable.classList.remove("open");

				var child_expandables = closest_expandable.getElementsByClassName("expandable");

				for (expandable of child_expandables) {
					expandable.classList.remove("open");
					expandable.getElementsByTagName("span")[1].style.transform = "rotate(0deg)";
				}

				arrow_icon.style.transform = "rotate(0deg)";
			}
			else {
				closest_expandable.classList.add("open");
				arrow_icon.style.transform = "rotate(180deg)";
			}
		});
	}
}





function addFilterOptions() {
	var classFilterSelector = document.getElementById("classFilterSelector").getElementsByTagName("optgroup")[0];

	for (className in classes) {
		var option = document.createElement("option");

		option.innerText = classes[className];
		classFilterSelector.append(option);
	}


	if (localStorage.getItem("vertLastUsedFilter") !== null) {
		document.getElementById("classFilterSelector").value = localStorage.getItem("vertLastUsedFilter");
	}
}




function filterResultsByClass() {
	var selectedOption = document.getElementById("classFilterSelector").value;
	var class_containers = document.getElementsByClassName("class_container");

	if (selectedOption == "Alle Klassen") {
		for (var i=0;i<class_containers.length;i++) {
			class_containers[i].style.display = "";
		}
	}

	else {
		for (var i=0;i<class_containers.length;i++) {
			var headerText = class_containers[i].querySelector(".header > span").innerText.replace( /\s\s+/g, ' ' );

			if (headerText != selectedOption) {
				class_containers[i].style.display = "none";
			}
			else {
				class_containers[i].style.display = "";
			}
		}
	}

	localStorage.setItem("vertLastUsedFilter", selectedOption);
}
