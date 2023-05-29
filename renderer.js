function line(begin, end, width) {
    return {
        type: "line",
        begin: begin,
        end: end,
        color: "#000000",
        width: width,
        draw: function (surface) {
            surface.fillStyle = this.color;
            surface.lineWidth = this.width;
            surface.beginPath();
            surface.moveTo(this.begin.x, this.begin.y);
            surface.lineTo(this.end.x, this.end.y);
            surface.closePath();
            surface.stroke();
        }
    };
}

function box(x, y) {
    return {
        type: "box",
        size: {x: x, y: y},
        position: {x: 0, y: 0},
        color: "#000000",
        draw: function (surface) {
            surface.fillStyle = this.color;
            surface.fillRect(this.position.x-this.size.x/2, this.position.y-this.size.y/2, this.size.x, this.size.y);
        }
    };
}

function circle(radius) {
    return {
        type: "circle",
        radius: radius,
        position: {x: 400, y: 400},
        color: "#000000",
        draw: function (surface) {
            surface.fillStyle = this.color;
            surface.lineWidth = 1;
            surface.beginPath();
            surface.arc(this.position.x, this.position.y, this.radius, 0, 2*Math.PI)
            surface.closePath();
            surface.stroke();
            surface.fill();
        }
    };
}

function renderer(canvas) {
    return {
        size: {x: canvas.width, y: canvas.height},
        surface: canvas.getContext("2d"),
        objects: [],
        update: function () {
            this.surface.fillStyle = "#FFFFFF";
            this.surface.fillRect(0,0,this.size.x,this.size.y);
            for (let i = 0; i < this.objects.length; i++) {
                this.objects[i].draw(this.surface);
            }
        },
        push: function (object) {
            this.objects.push(object); return this.objects[this.objects.length-1];
        }
    };
}

function vec(x, y) {
    return {x:x,y:y};
}