const searchBtnEl = document.querySelector("#searchBtn");
const apiKey = "064b85f77ad8cc613db100a15ac30050";
const baseUrl = "https://api.openweathermap.org";


// <----- Current weather ----->
// Helper method to create the current weather card.
function createCurrentWeatherCard(cityName, temp, wind, humidity, iconPath) {
    const containerEl = document.getElementById("todaysWeather");
    containerEl.textContent = "";
    const headerEl = document.createElement("h3");
    const imgEl = document.createElement("img");
    imgEl.src = iconPath;
    imgEl.alt = "weather icon image"
    imgEl.style.width = "50px";
    imgEl.style.height = "50px";


    headerEl.textContent = cityName + " (" + dayjs().format("MM/DD/YYYY") + ")";
    headerEl.style.fontWeight = "bolder";
    headerEl.appendChild(imgEl);

    const pTempEl = document.createElement("p");
    pTempEl.textContent = `Temp: ${temp}`;
    const pWindEl = document.createElement("p");
    pWindEl.textContent = `Wind: ${wind}`;
    const pHumidityEl = document.createElement("p");
    pHumidityEl.textContent = `Humidity: ${humidity}`;
    containerEl.appendChild(headerEl);
    containerEl.appendChild(pTempEl);
    containerEl.appendChild(pWindEl);
    containerEl.appendChild(pHumidityEl);
}

// Helper method to invoke api to fetch current data and plot it to the UI.
function getAndPlotCurentWeather(lat, lng, cityName) {

    const curWeatherApi = `${baseUrl}/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`;
    console.log(`Get current weather for given lat: ${lat} and lng: ${lng} belonging to city: ${cityName}`);
    console.log(`Invoking ${curWeatherApi} to get the data`);
    fetch(curWeatherApi)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log("current weather");
            console.log(data);
            const temp = data.main.temp + ' °F';
            const wind = data.wind.speed + " MPH";
            const humidity = data.main.humidity + " %"
            const curDateInUTC = data.dt;
            localStorage.setItem("curDate", dayjs.unix(curDateInUTC).format("MM/DD/YYYY"));
            const iconPath = "https://openweathermap.org/img/wn/" + data.weather[0].icon + "@2x.png";
            console.log(`Got back: temp: ${temp}, wind: ${wind} and humidity: ${humidity} and icon path: ${iconPath}`);
            createCurrentWeatherCard(cityName, temp, wind, humidity, iconPath);
        });
}

// <----- 5-day weather logic ----->
// Callback method to: 
//    1. get the lat/lng  given the city name
//    2. get the 5 day forecast given the lat/lng
function queryForWeatherForecast(event) {
    event.preventDefault();
    const cityNameEl = document.getElementById("cityName");
    const cityName = cityNameEl.value;
    getWeatherInfoForCity(cityName);
    cityNameEl.value = "";
    const cityHistory = JSON.parse(localStorage.getItem("cities"));
    let cityHistorySet;
    if (cityHistory) {
        cityHistorySet = new Set(cityHistory);
        cityHistorySet.add(cityName);
    } else {
        cityHistorySet = new Set([cityName]);
    }
    console.log("Got back the below set to store in localstorage");
    console.log(cityHistorySet);
    localStorage.setItem("cities", JSON.stringify(Array.from(cityHistorySet)));
    queryAndRenderSavedHistoryToUi();
}

function parseAndRender5DayForecastToUi(data) {
    console.log("Parse weather data");
    // Find the index in the array to start the search for the 1st day as 
    // we already got the curent weather above.
    const curDate = localStorage.getItem("curDate");
    let idx;
    console.log("before: " + data.length);
    for (let i = 0; i < data.length; i++) {

        const dateInput = dayjs.unix(data[i].dt).format("MM/DD/YYYY");
        if (curDate !== dateInput) {
            console.log("found the first day in the 5-day forecast")
            idx = i;
            break;
        }
    }

    console.log("splice array at idx: " + idx);
    data.splice(0, idx);

    // Rendering the data
    let containerIdCntr = 0
    for (let i = 0; i < data.length; i += 8) {
        // get the container and reset data
        const containerId = "day-" + containerIdCntr;
        console.log("Getting container with id: " + containerId)
        const containerEl = document.getElementById(containerId);
        containerEl.textContent = "";

        // header - date
        const headerEl = document.createElement("h5");
        headerEl.textContent = dayjs.unix(data[i].dt).format("MM/DD/YYYY");
        headerEl.style.fontWeight = "bolder";

        // weather icon
        const imgEl = document.createElement("img");
        imgEl.src = "https://openweathermap.org/img/wn/" + data[i].weather[0].icon + "@2x.png";;
        imgEl.alt = "weather icon image"
        imgEl.style.width = "50px";
        imgEl.style.height = "50px";

        // temp
        const pTempEl = document.createElement("p");
        pTempEl.textContent = `Temp: ${data[i].main.temp} °F`;

        // wind
        const pWindEl = document.createElement("p");
        pWindEl.textContent = `Wind: ${data[i].wind.speed} MPH`;

        // humidity
        const pHumidityEl = document.createElement("p");
        pHumidityEl.textContent = `Humidity: ${data[i].main.humidity} %`;

        containerEl.style.backgroundColor = "#FF8488";
        containerEl.style.color = "white";
        containerEl.appendChild(headerEl);
        containerEl.appendChild(imgEl);
        containerEl.appendChild(pTempEl);
        containerEl.appendChild(pWindEl);
        containerEl.appendChild(pHumidityEl);
        containerIdCntr++;
    }
}

// <----- Main method calls ----->

// Helper method pull saved cities from local storage and render them on the ui.
// TODO: Render only last 10 cities
function queryAndRenderSavedHistoryToUi() {
    const cityHist = JSON.parse(localStorage.getItem("cities"));
    const historyContainerEl = document.getElementById("cityHistory");
    historyContainerEl.textContent = "";
    if (cityHist) {
        for (city of cityHist) {
            const btn = document.createElement("button");
            btn.setAttribute("class", "btn btn-secondary");
            btn.id = city;
            btn.style.width = "100%";
            btn.style.marginBottom = "20px";
            btn.textContent = city
            historyContainerEl.appendChild(btn);
            btn.addEventListener("click", function () {
                getWeatherInfoForCity(btn.id);
            });
        }
    }
}

// Helper method which will
//    1. Given a city name fetch the lat and long for the city
//    2. Fetch and render the current weather info for the city on the ui
//    3. Fetch and render the 5 day forecast for the city on the ui
function getWeatherInfoForCity(cityName) {
    const geocodeApi = `${baseUrl}/geo/1.0/direct?q=${cityName}&appid=${apiKey}`;
    console.log(`Invoking geo code api: ${geocodeApi} to get the lat/lng for city: ${cityName}`);
    fetch(geocodeApi)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            let lat = data[0].lat;
            let lng = data[0].lon;
            getAndPlotCurentWeather(lat, lng, cityName);
            const weatherSearchApui = `${baseUrl}/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`;
            console.log(`Got back lat: ${lat} and lng: ${lng}. Will proceed with invoking the api: ${weatherSearchApui}`);
            fetch(weatherSearchApui)
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    console.log("Got back the 5 day forecast as: ");
                    console.log(data);
                    parseAndRender5DayForecastToUi(data.list);

                });

        });
}




// <---- Event handlers ---->
console.log("Event handlers");
searchBtnEl.addEventListener('click', queryForWeatherForecast);

// On window load .. render the city history
window.onload = queryAndRenderSavedHistoryToUi;
