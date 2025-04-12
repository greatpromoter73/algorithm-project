// Initialize Map
var map = L.map('map').setView([23.8103, 90.4125], 10); // Default: Dhaka

// Load OpenStreetMap Tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Routing Control
var control = L.Routing.control({
    waypoints: [],
    routeWhileDragging: false,
    showAlternatives: true,
    altLineOptions: {
        styles: [
            { color: 'black', opacity: 0.15, weight: 9 },
            { color: 'white', opacity: 0.8, weight: 6 },
            { color: 'blue', opacity: 0.5, weight: 2 }
        ]
    }
}).addTo(map);

// When a route is selected, update instructions and enable hover markers
control.on('routeselected', function (e) {
    var route = e.route;
    var summary = route.summary;
    var instructions = `<strong>${(summary.totalDistance / 1000).toFixed(1)} km, ${(summary.totalTime / 60).toFixed(0)} min</strong><br><ol>`;
    
    route.instructions.forEach(instr => {
        instructions += `<li>${instr.text} - ${instr.distance.toFixed(0)} m</li>`;
    });

    instructions += '</ol>';
    document.getElementById('directions-panel').innerHTML = instructions;

    setTimeout(enableStepHover, 300); // 👈 Enable hover markers after rendering
});

// Helper for geocoding
function getCoords(query) {
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(res => res.json())
        .then(data => {
            if (!data.length) throw new Error(`Location not found: ${query}`);
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        });
}

// Find route based on input
function findRoute() {
    var start = document.getElementById("start").value;
    var waypoint = document.getElementById("waypoint").value;
    var end = document.getElementById("end").value;
    var mode = document.getElementById("mode").value;

    document.getElementById('directions-panel').innerHTML = "Loading route...";

    Promise.all([
        getCoords(start),
        waypoint ? getCoords(waypoint) : null,
        getCoords(end)
    ])
    .then(([startCoords, waypointCoords, endCoords]) => {
        if (control) map.removeControl(control);

        const waypoints = [startCoords];
        if (waypointCoords) waypoints.push(waypointCoords);
        waypoints.push(endCoords);

        control = L.Routing.control({
            waypoints: waypoints.map(c => L.latLng(c[0], c[1])),
            router: L.Routing.osrmv1({ profile: mode }),
            routeWhileDragging: false,
            showAlternatives: true,
            altLineOptions: {
                styles: [
                    { color: 'black', opacity: 0.15, weight: 9 },
                    { color: 'white', opacity: 0.8, weight: 6 },
                    { color: 'blue', opacity: 0.5, weight: 2 }
                ]
            }
        }).addTo(map);

        control.on('routeselected', function (e) {
            const route = e.route;
            const summary = route.summary;
            let html = `<strong>${(summary.totalDistance / 1000).toFixed(1)} km, ${(summary.totalTime / 60).toFixed(0)} min</strong><br><ol>`;
            route.instructions.forEach(i => {
                html += `<li>${i.text} - ${i.distance.toFixed(0)} m</li>`;
            });
            html += '</ol>';
            document.getElementById('directions-panel').innerHTML = html;

            setTimeout(enableStepHover, 300);
        });
    })
    .catch(err => {
        alert(err.message);
    });
}

// Hover Marker Logic
let hoverMarker = null;

function enableStepHover() {
    const steps = document.querySelectorAll("#directions-panel li");

    steps.forEach((step, index) => {
        step.addEventListener("mouseenter", () => {
            const route = control._routes[0];
            if (!route || !route.instructions || !route.instructions[index]) return;

            const latLng = route.instructions[index].latLng;
            if (latLng) {
                if (hoverMarker) {
                    map.removeLayer(hoverMarker);
                }
                hoverMarker = L.circleMarker(latLng, {
                    radius: 6,
                    color: '#007bff',
                    fillColor: '#007bff',
                    fillOpacity: 0.9
                }).addTo(map);
            }
        });

        step.addEventListener("mouseleave", () => {
            if (hoverMarker) {
                map.removeLayer(hoverMarker);
                hoverMarker = null;
            }
        });
    });
}
