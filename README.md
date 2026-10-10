# 🚗 Neuro-Evolution Self-Driving Car Simulation

A 2D self-driving car simulation built entirely from scratch using vanilla JavaScript and the HTML5 Canvas API. No external libraries, no TensorFlow, no PyTorch—just pure math and logic.

The AI cars use a simple feed-forward neural network and a genetic algorithm to learn how to navigate a 3-lane highway, avoid traffic, and survive as long as possible.

## ✨ Features
- **Neural Network from Scratch:** A custom implementation of a feed-forward neural network with customizable layers.
- **Ray-Casting Sensors:** Each car is equipped with 5 sensors that detect road borders and traffic.
- **Genetic Algorithm:** Cars that perform best are saved to `localStorage`. The next generation is created by mutating the best brain.
- **Procedural Traffic:** A predefined traffic pattern ensures consistent training conditions across runs.
- **Performance Optimized:** Canvas rendering is optimized to handle 200+ cars simultaneously without lagging.
- **Save & Load:** Save your best car's brain to local storage and pick up where you left off.

## 🧠 How It Works
1. **Sensors:** Each AI car casts 5 rays. If a ray hits a border or another car, it returns a value between 0 and 1 based on the distance.
2. **Neural Network:** The sensor data is fed into a neural network with a 5-6-4 structure. The outputs determine if the car should go forward, left, right, or reverse.
3. **Evolution:** At the end of a run, the car that traveled the furthest is considered the "best". Its neural network weights are saved.
4. **Mutation:** The next generation of cars loads the saved brain, but with slight random mutations (controlled by the `MUTATION` variable in `main.js`). Over time, this mimics natural selection.

## 🚀 How to Run
1. Clone the repository.
2. Open `index.html` in your browser.
3. *Tip:* Use a local development server (like VS Code's Live Server extension) for the best performance.
4. Press the **Save** button to save the current best brain to your browser's local storage.
5. Press the **Delete** button to wipe the saved brain and start fresh.

## 🛠️ Built With
- **JavaScript (ES6+)**
- **HTML5 Canvas**
- **CSS3** (Flexbox)

## 📂 Project Structure
- `car.js` - Car physics, collision detection, and drawing.
- `sensor.js` - Ray-casting logic for object detection.
- `network.js` - The neural network and genetic mutation logic.
- `visualizer.js` - Draws the neural network to the screen.
- `road.js` - Road geometry and lane management.
- `main.js` - The main simulation loop and genetic algorithm controller.
- `utils.js` - Helper math functions (lerp, intersection, etc.).