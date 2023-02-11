// Capstone Project V - Using API's to retrieve information about South African cities.

//The version of node.js used during this task was 16.13.1, as the fetch keyword wasn't implemented
//until 18 an external module had to be used. The package.json had to be altered to be recognised as a module.
import fetch from "node-fetch";

// -------------------- To search for a city please alter the string variable below ---------------------------

let cityName = "johannesburg";

// A random list of cities that have been tested.
// Johannesburg, Springs, Newcastle, Port Elizabeth, Graaff-Reinet(no elevation data), Cape Town, simon's town(no elevation data),
// kimberley, east london(no elevation data), queenstown(no elevation data).

// ------------------------------------------------------------------------------------------------------------


// The first variables provide the password and server address needed to access and retrieve the information.
// REMEMBER - DELETE BEFORE POSTING TO GITHUB
const apiPassword = 'Insert Password Here';
const geoApiHost = "wft-geo-db.p.rapidapi.com";
const weatherApiHost = "weatherbit-v1-mashape.p.rapidapi.com";

// Requries the use of geological location codes from wikidata.org to search specific countries.
// This code if for South Africa as suggested in the task to limit it to this country.
const countryWikidataId = "Q258";

// This functions only purpose is to slow down the program at certain invervals with the amount set in 
// miliseconds at the point of initiziation. This is to solve the issue of limitations placed on the amount in
// which an api may be accessed with a 1 second timeframe. 
const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

// When calling the API address it will require both a server to retrieve the data from and
// a password to ensure you have permission to access the data. This set is for the geological data.
const geoHeaderOptions = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': apiPassword,
		'X-RapidAPI-Host': geoApiHost
	}
};

// This contains the location/permissions for the weather data.
const weatherHeaderOptions = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': apiPassword,
		'X-RapidAPI-Host': weatherApiHost
	}
};

// This function starts the process by checking that the name passes certain checks such as isn't empty or a number.
let city = cityName => {

    // Checks to see if the field is an empty string.
    if(cityName == "") {
        return console.log(`You haven't entered anything into the field.`);
    } 

    // Checks to see if the user hasn't initilized the variable.
    else if(cityName == null) {
        return console.log(`Please provide a city name in a string`);
    } 

    // Checks to see if it is a number string.
    else if(!isNaN(cityName)) {
        return console.log(cityName + ` is a number please provide a string.`);
    } 
            
    // If it passes the checks the string is then altered so that the first letter of each word has a capital letter.
    // This is necessary as the namePrefex from the api uses this format and can be used to return the correct object 
    // if multiple records are found.
    cityName = cityName.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());

    // This is necessary as some cities names are more than one word and spaces have a different syntax in urls.
    let urlName = cityName.replaceAll(" ", "%20");

    // The correctly url formatted name is then provided and the original capitilized input for user feedback if needed. 
    return cityId(urlName, cityName);
    }
    
// The purpose of this function is to locate the correct city using the name provided. This is due to not all the details being present when searching with a name.
// So it is necessary to first retrieve the unique wikidataid field to search for the full details needed for this task.
async function cityId(urlName, inputedName) {

    // Due to restrictions on how quickly the api can be accessed a delay has been created between retrieving data. This message
    // is to let the user know that the program is working and to wait.
    console.log("Please be patient, due to api limitations you will experience a delay of up to 10 seconds.");

    // This variable retrieves the city information using limits such as the country and database entries that have no population to limit the number of entries located.
    // The altered name provided is then added to the url and the information is retrieved using the access information variable for this api. 
    // This is then immedtiatly converted to a json formatting to access the data using 2 await commands to ensure it waits until the data is retrieved.  
    let cityCode = await (await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=${countryWikidataId}&minPopulation=1&namePrefix=${urlName}`, geoHeaderOptions)).json();

    // Due to the issue of only being allowed one access per second a delay had to be introduced to ensure that enough time had passed before another access was attempted.
    // Without the sleep function a message would appear stating that i have reached my limit and preventing the program from progressing.
    // If i ever upgrade to a premium account these can be removed.
    await sleep(2000);

    // Due to the issue of multiple entries being returned if the string is present in the entry and not an exact match these statements are to return the wanted entry. 
    // If there are more than one entry found in the retrieved data this statement is called.
    if (cityCode["metadata"]["totalCount"] > 1) {

        // A sleep is used to ensure that the api can be accessed. This is needed as even set to 2 seconds there have times the limit has been met.
        await sleep(2000);
        
        // The retrieved information has a default limit of 5 entries so this is to retrieve all the entries found.
        let number = cityCode["metadata"]["totalCount"];
        let cityList = await (await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=${number}&countryIds=${countryWikidataId}&minPopulation=1&namePrefix=${urlName}`, geoHeaderOptions)).json();
        
        // Once the data has been retrieved it is then sent to a seperate function for retrieval.
        searchRefinement(inputedName, cityList);
    }

    // If no entries are found the program ends letting the user know.
    else if (cityCode["metadata"]["totalCount"] == 0) {
        return console.log(`Sorry but ${inputedName} doesn't appear in the database, please check your spelling and try again.`);
    }

    // If only a single entry has been found the wikidataid is extracted and sent to another async function to retrieve the required information.
    else if (cityCode["metadata"]["totalCount"] == 1) {
        return cityInfo(cityCode["data"][0]["wikiDataId"]);
    }

    // This is returned if the api is unable to be retrieve the information such as if the access limit has been reached.
    else {
        return console.log("Apologies but due to unforseen circumstances we are unable to retrieve any data. Please contact tech support.");
    }
}

// This function searches through the entries retrieving an exact match to the capitilized city name provided
let searchRefinement = (name, list) => {
    let findCity = list["data"].find((data) => data.name == name);

    // If the name can't be found the inputted string is outputted with a message.
    if (findCity == null) {
        return console.log(`Sorry but ${name} doesn't appear in the database, please check your spelling and try again.`)
    }

    // If successful the wikidataid is retrieved and sent to the next async function.
    return cityInfo(findCity["wikiDataId"]);
}

// This function uses the unique code retrieved to get all the needed information about the city.
async function cityInfo(code) {

    // To ensure that the limit restriction has been passed.
    await sleep(2000);
    
    // Contains the full available data for the city using the unique code to retrieve the correct details.
    let cityData = await (await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities/${code}`, geoHeaderOptions)).json();

    // The variables are created that contain all the necessary city data. The name is retrieved to display that the correct entry has been found.
    let cityName = cityData["data"]["city"];

    // The population is altered for no reason other than to make it more presentable by adding commas and indicating whether it is in the millions
    // or thousands.
    let population = populationString(cityData["data"]["population"]);

    // Even after retrieving the full correct entry elevation data is not always provided. So this is to indicate whether it is present and display
    // the correct output. 
    let elevation = checkElevation(cityData["data"]["elevationMeters"]);

    // Needed to retrieve local weather conditions.
    let latitude = cityData["data"]["latitude"];
    let longitude = cityData["data"]["longitude"];

    // The final fetch retrieves the weather conditions of the location based on the longitude and latitude provided from the variables above.
    // The access needed for the weather data is diferent from above so uses different the alternate object. There is no time limit on this api
    // so no delays are needed. 
    let weatherInfo = await (await fetch(`https://weatherbit-v1-mashape.p.rapidapi.com/current?lon=${longitude}&lat=${latitude}`, weatherHeaderOptions)).json();

    // Retrieves the local temperature.
    let temp = weatherInfo["data"][0]["temp"];

    // Displays all the required information for the task.
    console.log(`-----------------------------------------------------------------------------------------------------------------\n` +
    `${cityName} currently has a population of ${population}\n${elevation}\nCurrently has a temperature of ${temp}°C.\n` + 
    `-----------------------------------------------------------------------------------------------------------------`);
}

// Checks to see if there is any data regarding the elevation of the city.
let checkElevation = data => {

    // If the provided information is empty there is no information in the database.
    if (data == null) {
        return `There is currently no elevation data available for this location.`
    }

    // If there is information present it is displayed.
    else {
        return `Has an elevation of ${data} meters above its reference point.`
    }
}

// Takes the population number and makes it more readable.
let populationString = number => {

    // Converts it to a string to allow alterations to take place.
    let numberString = String(number);

    // A counter is needed to determine when a , is inserted.
    let counter = 1;

    // From right to left a , is placed every 3 charecters. The counter is increased when below three and is reset when at 3.
    if (numberString.length > 3) {
        for (let i = numberString.length - 1; i > 0; i--) {
            if (counter == 3) {
                numberString = numberString.substring(0, i) + "," + numberString.substring(i);
                counter = 0;
            }
            counter++;
        }
    }

    // Once done a further string is then added to indicate millions, thousands or hundreds and returned.
    if (numberString.length > 8){
        return numberString + " million people.";
    }
    if (numberString.length < 9 && numberString.length > 3){
        return numberString + " thousand people.";
    }
    else{
        return numberString + " hundred people.";
    }
}

// Takes the intial name of the city and starts the retrieval process.
city(cityName);

// Used the web dev website to get information on delaying scripts:
// https://thewebdev.info/2022/04/25/how-to-add-delay-between-actions-in-javascript/
// Used the freecodecamp website to get information on altering string sentances to capitlize the first letter of words:
// https://www.freecodecamp.org/news/how-to-capitalize-words-in-javascript/
// Used the theprogrammingexpert website to get information on altering string sentances:
// https://theprogrammingexpert.com/insert-character-into-string-javascript/