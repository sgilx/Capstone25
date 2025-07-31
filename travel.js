let cachedToken = null;
let tokenExpiry = 0;

// create and cache token for proper usage
async function getAccessToken() {
    const now = Date.now(); //cstore current time as now

    if(cachedToken && now < tokenExpiry) {
        return cachedToken; // return the token if the current time is before the time of expiration
    }

    // sends authentication request using client credentials
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: 'K8bQh9xjPjcodnGawWpkZhD7b8qw7F8P',
            client_secret: 'RTSTCkL1nBqpOqW2'
        })
    });

    // throw error if no token is retrieved
    if (!response.ok) {
        const error = await response.text(); // retrieve error message
        throw new Error(`Failed to get access token: ${response.status} - ${error}`); // throw status and the error message
    }

    const data = await response.json();  

    cachedToken = data.access_token; // retrieve token given the credentials
    tokenExpiry = now + (data.expires_in * 1000) - 60000; // calculate expiration time 1 min early to avoid using expired token

    return cachedToken;

}

// fetch flights function using access token, all required params provided by user input
async function fetchFlights(origin, destination, departure, passengers) {
    const access_token = await getAccessToken();

    // builds a query string to use to search the API given user input
    const query = new URLSearchParams({
        originLocationCode: origin, // where to depart from
        destinationLocationCode: destination, // where to arrive
        departureDate: departure, // when to depart 
        adults: passengers, // number of passengers
        currencyCode: 'USD', // currency to display
        max: '5' // max amount of flights to return
    });

    // fetch flight offers API given the query string above
    const response = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${query}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch flights: ${response.status} - ${error}`);
    }

      return await response.json();
}

// create const to retrieve travel form 
const input = document.getElementById('travelForm');

// event listener that displays flights upon form submission
input.addEventListener('submit', async function (e) {
    e.preventDefault();

    // retrieve information from user input and sanitize it(trim and uppercase for proper searching)
    const origin = document.getElementById('origin').value.trim().toUpperCase(); // trimmed for security and proper search
    const destination = document.getElementById('destination').value.trim().toUpperCase(); // uppercase for optimized search as well
    const departure = document.getElementById('departure').value; // retrieves user input value for departure date
    const passengers = document.getElementById('passengers').value; // retrieves user input value for amt of passengers
    const resultsContainer = document.getElementById('results'); // stores the results div in which to display the cards

    // loading messsage to display to user while awaiting flight result info
    resultsContainer.innerHTML = '<div class="center-align">Searching flights...</div>';

  try {
    // creates a variable flights given user input to use for API searching
    const flights = await fetchFlights(origin, destination, departure, passengers);

    // if there is no input and / or no flights then display message to user
    if (!flights.data || flights.data.length === 0) {
      resultsContainer.innerHTML = '<div class="center-align">No flights found.</div>';
      return;
    }

    // clear previous results 
    resultsContainer.innerHTML = '';


    // iterate through each flight offered returned by the API
    flights.data.forEach(flight => {
        const seg = flight.itineraries[0].segments[0]; // stores access the first segment of first itinerary
        const depTime = new Date(seg.departure.at).toLocaleString(); // creates a departure date and returns date& time
        const price = flight.price.total;  // stores price of flight

        // create cards to display each flight information
        const card = document.createElement('div');
        card.className = 'card blue lighten-5 center-align';
        card.innerHTML = `
            <div class="card-content">
                <span class="card-title">${seg.departure.iataCode} to ${seg.arrival.iataCode}</span>
                <p><strong>Departure:</strong> ${depTime}</p>
                <p><strong>Price:</strong> $${price}</p>
            </div>
            `;
        resultsContainer.append(card);
    });
  } catch (err) {
    // display proper error message to users
    resultsContainer.innerHTML = `<div class="card-panel red lighten-4 center-align">Error: ${err.message}</div>`;
  }
});