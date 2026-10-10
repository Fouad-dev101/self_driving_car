class Car {
    constructor(x, y, width, height, controlType, maxSpeed = 3) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;

        this.useBrain = controlType == "AI";

        if (controlType != "DUMMY") {
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork(
                [this.sensor.rayCount, 6, 4]
            );
        }
        this.controls = new Controls(controlType);
    }

    update(roadBorders, traffic) {
        // only look at traffic that is actually close to this car
        const near = traffic.filter(t => Math.abs(t.y - this.y) < 300);
        if (!this.damaged) {
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, near);
        }
        // dead cars don't need to think anymore
        if (this.sensor && !this.damaged) {
            this.sensor.update(roadBorders, near);
            const offsets = this.sensor.readings.map(
                s => s == null ? 0 : 1 - s.offset
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);

            if (this.useBrain) {
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.reverse = outputs[3];
            }
        }
    }


    #assessDamage(roadBorders, traffic) {
        for (let i = 0; i < roadBorders.length; i++) {
            if (polyIntersect(this.polygon, roadBorders[i])) {
                return true;
            }
        }
        for (let i = 0; i < traffic.length; i++) {
            if (polyIntersect(this.polygon, traffic[i].polygon)) {
                return true;
            }
        }
        return false;
    }


    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }


    #move() {
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
            this.speed -= this.acceleration;
        }

        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }

        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        if (this.speed != 0) {
            const flip = this.speed > 0 ? 1 : -1;

            if (this.controls.left) {
                this.angle += 0.03 * flip;
            }
            if (this.controls.right) {
                this.angle -= 0.03 * flip;
            }
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    // small helper so the rounded shapes work on any browser
    #roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, r);
        } else {
            ctx.rect(x, y, w, h);
        }
    }

    draw(ctx, color, drawSensor = false, detailed = true) {
        // cheap version for the pack: just the plain shape
        if (!detailed) {
            ctx.fillStyle = this.damaged ? "grey" : color;
            ctx.beginPath();
            ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
            for (let i = 1; i < this.polygon.length; i++) {
                ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
            }
            ctx.fill();
            return;
        }

        const w = this.width;
        const h = this.height;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        // wheels
        ctx.fillStyle = "#111";
        const wheelY = h * 0.27;
        for (const y of [-wheelY, wheelY]) {
            ctx.fillRect(-w / 2 - 2, y - 6, 5, 12);
            ctx.fillRect(w / 2 - 3, y - 6, 5, 12);
        }

        // body
        ctx.fillStyle = this.damaged ? "grey" : color;
        this.#roundRect(ctx, -w / 2, -h / 2, w, h, 9);
        ctx.fill();

        // windshield
        ctx.fillStyle = "rgba(15, 25, 45, 0.85)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.36, -h * 0.17);
        ctx.lineTo(w * 0.36, -h * 0.17);
        ctx.lineTo(w * 0.30, -h * 0.02);
        ctx.lineTo(-w * 0.30, -h * 0.02);
        ctx.closePath();
        ctx.fill();

        // roof (slightly darker than the body)
        ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
        this.#roundRect(ctx, -w * 0.30, -h * 0.02, w * 0.60, h * 0.22, 3);
        ctx.fill();

        // rear window
        ctx.fillStyle = "rgba(15, 25, 45, 0.85)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.30, h * 0.20);
        ctx.lineTo(w * 0.30, h * 0.20);
        ctx.lineTo(w * 0.35, h * 0.31);
        ctx.lineTo(-w * 0.35, h * 0.31);
        ctx.closePath();
        ctx.fill();

        // headlights and taillights
        if (!this.damaged) {
            ctx.fillStyle = "#ffe97a";
            this.#roundRect(ctx, -w / 2 + 3, -h / 2 + 1, 7, 4, 1.5);
            ctx.fill();
            this.#roundRect(ctx, w / 2 - 10, -h / 2 + 1, 7, 4, 1.5);
            ctx.fill();

            ctx.fillStyle = "#8b0000";
            this.#roundRect(ctx, -w / 2 + 3, h / 2 - 5, 7, 4, 1.5);
            ctx.fill();
            this.#roundRect(ctx, w / 2 - 10, h / 2 - 5, 7, 4, 1.5);
            ctx.fill();
        }

        ctx.restore();

        // sensor is drawn in world coordinates, so after restore
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }
}
