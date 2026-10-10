const carCanvas = document.getElementById("carcanvas");
carCanvas.width = 200;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

// ---- settings you can play with ----
const N = 200;          // number of AI cars (lower it if your PC still lags)
const MUTATION = 0.1;   // lower it (0.05, 0.02...) once you have a decent brain
// ------------------------------------

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

const cars = generateCars(N);
let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(
            localStorage.getItem("bestBrain"));
        if (i != 0) {
            NeuralNetwork.mutate(cars[i].brain, MUTATION);
        }
    }
}

// fixed pattern (same every run, so results are comparable)
// each entry = the lanes that have a car in that row, never all 3
const trafficPattern = [
    [1], [0, 2], [0, 1], [2], [1, 2], [1],
    [0, 2], [0], [1, 2], [0, 1], [2], [0, 2]
];
const traffic = [];
for (let row = 0; row < 25; row++) {
    const lanes = trafficPattern[row % trafficPattern.length];
    for (const lane of lanes) {
        traffic.push(
            new Car(road.getLaneCenter(lane), -100 - row * 200, 30, 50, "DUMMY", 2)
        );
    }
}

animate();

function save() {
    // only overwrite the saved brain if this one got further
    const dist = -bestCar.y;
    const prev = parseFloat(localStorage.getItem("bestDist")) || 0;
    if (dist > prev) {
        localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
        localStorage.setItem("bestDist", dist);
    }
}

function discard() {
    localStorage.removeItem("bestBrain");
    localStorage.removeItem("bestDist");
}

function generateCars(N) {
    const cars = [];
    for (let i = 1; i <= N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
    }
    return cars;
}

function animate(time) {
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic);
    }

    // find the leader without building a new array every frame
    bestCar = cars[0];
    for (let i = 1; i < cars.length; i++) {
        if (cars[i].y < bestCar.y) bestCar = cars[i];
    }

    // only resize when the window actually changed
    if (carCanvas.height != window.innerHeight) {
        carCanvas.height = window.innerHeight;
        networkCanvas.height = window.innerHeight;
    }
    carCtx.clearRect(0, 0, carCanvas.width, carCanvas.height);
    networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);

    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

    road.draw(carCtx);

    // skip anything that is off screen
    const view = carCanvas.height;
    for (let i = 0; i < traffic.length; i++) {
        if (Math.abs(traffic[i].y - bestCar.y) < view) {
            traffic[i].draw(carCtx, "red");
        }
    }

    // the pack is faded and drawn simple, only the leader gets the full car
    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        if (Math.abs(cars[i].y - bestCar.y) < view) {
            cars[i].draw(carCtx, "blue", false, false);
        }
    }
    carCtx.globalAlpha = 1;
    bestCar.draw(carCtx, "blue", true);

    carCtx.restore();

    networkCtx.lineDashOffset = -time / 50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    requestAnimationFrame(animate);
}
