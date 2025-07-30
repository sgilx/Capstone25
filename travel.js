let cachedToken = null;
let tokenExpiry = 0;

//create and cache token for proper usage
async function getAccessToken() {
    const now = Date.now();

    if(cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

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

    //throw error if no token is retrieved
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${response.status} - ${error}`);
    }

    const data = await response.json();

    cachedToken = data.access_token;
    tokenExpiry = now + (data.expires_in * 1000) - 60000;

    return cachedToken;

}

//fetch flights function using access token, all required params provided by user input
async function fetchFlights(origin, destination, departure, passengers) {
    const access_token = await getAccessToken();

    //builds query string to use to search the API for provided 
    const query = new URLSearchParams({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departure,
        adults: passengers,
        currencyCode: 'USD',
        max: '5'
    });

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

//create const to retrieve travel form 
const input = document.getElementById('travelForm');

input.addEventListener('submit', async function (e) {
    e.preventDefault();

    //retrieve information from user input and sanitize it(trim and uppercase for proper searching)
    const origin = document.getElementById('origin').value.trim().toUpperCase();
    const destination = document.getElementById('destination').value.trim().toUpperCase();
    const departure = document.getElementById('departure').value;
    const passengers = document.getElementById('passengers').value;
    const resultsContainer = document.getElementById('results');

    //message to show user the api is being searched through
    resultsContainer.innerHTML = '<div class="center-align">Searching flights...</div>';

  try {
    //if no flights, notify user there are no available flights 
    const flights = await fetchFlights(origin, destination, departure, passengers);

    if (!flights.data || flights.data.length === 0) {
      resultsContainer.innerHTML = '<div class="center-align">No flights found.</div>';
      return;
    }

    //clear previous information
    resultsContainer.innerHTML = '';


    //iterate through each flights returned and access the first segment to retrieve the first 
    // itinerary and corresponing info
    flights.data.forEach(flight => {
        const seg = flight.itineraries[0].segments[0];
        const depTime = new Date(seg.departure.at).toLocaleString();
        const price = flight.price.total;

        //create cards to display each flight information
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
    //display proper error message to users
    resultsContainer.innerHTML = `<div class="card-panel red lighten-4 center-align">Error: ${err.message}</div>`;
  }
});