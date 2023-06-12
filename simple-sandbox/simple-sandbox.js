function createSandbox(canvas) {
    let sandbox = {
        clock: 0,
        surface: canvas.getContext("2d"),
        objects: new Map(),
        createObject: function (renderer, collider, physics) {
            const id = this.clock++;
            this.objects.set(id, {
                id: id,
                transform: transform(),
                renderer: renderer,
                collider: collider,
                physics: physics
            });
            return this.objects.get(id);
        },
        destroyObject: function (object) {
            this.objects.delete(object.id);
        },
        update: function () {
            this.surface.reset();
            this.objects.forEach(object => {
                object.renderer.draw(object, this.surface);
            });
        },
        drawLine: function (from, to, width = 5) {
            const sw = this.surface.canvas.width, sh = this.surface.canvas.height;
            this.surface.beginPath();
            this.surface.lineWidth = width / unit * (0.5 * (sw + sh));
            if (sw > sh) {
                this.surface.moveTo((from.x + unit * 0.5) / unit * sh + (sw - sh) * 0.5, (from.y + unit * 0.5) / unit * sh);
                this.surface.lineTo((to.x + unit * 0.5) / unit * sh + (sw - sh) * 0.5, (to.y + unit * 0.5) / unit * sh);
            } else if (sw < sh) {
                this.surface.moveTo((from.x + unit * 0.5) / unit * sw, (from.y + unit * 0.5) / unit * sw + (sh - sw) * 0.5);
                this.surface.lineTo((to.x + unit * 0.5) / unit * sw, (to.y + unit * 0.5) / unit * sw + (sh - sw) * 0.5);
            } else {
                this.surface.moveTo((from.x + unit * 0.5) / unit * sw, (from.y + unit * 0.5) / unit * sh);
                this.surface.lineTo((to.x + unit * 0.5) / unit * sw, (to.y + unit * 0.5) / unit * sh);
            }
            this.surface.stroke();
            this.surface.closePath();
        }
    };
    sandbox.surface.rotateFrom = function (position, angle) {
        this.translate(position.x, position.y);
        this.rotate(angle);
        this.translate(-position.x, -position.y);
    };
    return sandbox;
}

const unit = 1000;

function vec(x, y) {
    return {x: x, y: y}
}

function dotProduct(vec1, vec2) {
    return vec1.x * vec2.x + vec1.y * vec2.y;
}

function transform() {
    return {
        position: vec(0, 0),
        scale: vec(1, 1),
        rotation: 0,
        toNormalizedUnits: function () {
            let clone = transform();
            clone.position = vec((this.position.x + unit * 0.5) / unit, (this.position.y + unit * 0.5) / unit);
            clone.scale = vec(this.scale.x, this.scale.y);
            clone.rotation = this.rotation;
            return clone;
        },
        toViewport: function (surface) {
            const sw = surface.canvas.width, sh = surface.canvas.height;
            let transform = this.toNormalizedUnits();
            if (sw > sh) {
                transform.position = vec(transform.position.x * sh + (sw - sh) * 0.5, transform.position.y * sh);
                transform.scale.x /= sw / sh;
            } else if (sw < sh) {
                transform.position = vec(transform.position.x * sw, transform.position.y * sw + (sh - sw) * 0.5);
                transform.scale.y /= sh / sw;
            } else {
                transform.position = vec(transform.position.x * sw, transform.position.y * sh);
            }
            return transform;
        }
    };
}

function boxRenderer(width, height, color="black") {
    return {
        width: width,
        height: height,
        color: color,
        draw: function (self, surface) {
            const transform = self.transform.toViewport(surface);
            const nw = width / unit * transform.scale.x, nh = height / unit * transform.scale.y;
            const sw = surface.canvas.width, sh = surface.canvas.height;

            surface.fillStyle = this.color;
            surface.rotateFrom(transform.position, transform.rotation * (Math.PI / 180));
            surface.fillRect(transform.position.x - (nw * 0.5 * sw), transform.position.y - (nh * 0.5 * sh), nw * sw, nh * sh);
            surface.rotateFrom(transform.position, -transform.rotation * (Math.PI / 180));
            surface.fillStyle = "black";
        }
    };
}

function sphereRenderer(radius, color="black") {
    return {
        radius: radius,
        color: color,
        draw: function (self, surface) {
            const transform = self.transform.toViewport(surface);
            const sw = surface.canvas.width, sh = surface.canvas.height;
            const nr = radius / unit * (0.5 * (transform.scale.x + transform.scale.y));

            surface.beginPath();
            surface.fillStyle = this.color;
            surface.arc(transform.position.x, transform.position.y, Math.abs(nr * (0.5 * (sw + sh))), 0, Math.PI * 2);
            surface.stroke();
            surface.fill();
            surface.fillStyle = "black";
            surface.closePath();
        }
    };
}

function textureRenderer(img, width, height) {
    return {
        draw: function (self, surface) {
            const transform = self.transform.toViewport(surface);
            const nw = width / unit * transform.scale.x, nh = height / unit * transform.scale.y;
            const sw = surface.canvas.width, sh = surface.canvas.height;

            surface.rotateFrom(transform.position, transform.rotation * (Math.PI / 180));
            surface.drawImage(img, transform.position.x - (nw * 0.5 * sw), transform.position.y - (nh * 0.5 * sh), nw * sw, nh * sh);
            surface.rotateFrom(transform.position, -transform.rotation * (Math.PI / 180));
        }
    };
}

//This was HELL to implement
function orientedBoxCollider(width, height) {
    return {
        type: "obb",
        width: width,
        height: height,
        checkCollision: function (self, other) {
            if (other.collider.type == "obb") {
                return checkOrientedBoxCollision(self, other);
            } else if (other.collider.type == "sphere") {
                return checkOrientedBoxSphereCollision(self, other);
            }
            return false;
        }
    };
}

function sphereCollider(radius) {
    return {
        type: "sphere",
        radius: radius,
        checkCollision: function (self, other) {
            if (other.collider.type == "obb") {
                return checkOrientedBoxSphereCollision(other, self);
            } else if (other.collider.type == "sphere") {
                return checkSphereCollision(self, other);
            }
            return false;
        }
    };
}

function checkOrientedBoxCollision(box1, box2) {
    const vertices1 = getTransformedVertices(box1.transform, box1.collider.width, box1.collider.height);
    const vertices2 = getTransformedVertices(box2.transform, box2.collider.width, box2.collider.height);
    return checkSATCollision(vertices1, vertices2);
}

function getTransformedVertices(transform, width, height) {
    const position = transform.position;
    const scale = transform.scale;
    const rotation = transform.rotation;

    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;

    const vertices = [
        vec(position.x - halfWidth * scale.x, position.y - halfHeight * scale.y), //bottom left
        vec(position.x + halfWidth * scale.x, position.y - halfHeight * scale.y), //bottom right
        vec(position.x + halfWidth * scale.x, position.y + halfHeight * scale.y), //top right
        vec(position.x - halfWidth * scale.x, position.y + halfHeight * scale.y) //top left
    ];

    const rotatedVertices = vertices.map(vertex => {
        const cosTheta = Math.cos(rotation * (Math.PI / 180));
        const sinTheta = Math.sin(rotation * (Math.PI / 180));

        const translatedX = vertex.x - position.x;
        const translatedY = vertex.y - position.y;

        const rotatedX = translatedX * cosTheta - translatedY * sinTheta;
        const rotatedY = translatedX * sinTheta + translatedY * cosTheta;

        return vec(rotatedX + position.x, rotatedY + position.y);
    });

    return rotatedVertices;
}

//Works with any convex mesh
function checkSATCollision(vertices1, vertices2) {
    for (let i = 0; i < vertices1.length; i++) {
        const point1 = vertices1[i];
        const point2 = vertices1[(i + 1) % vertices1.length];

        const edge = vec(point2.x - point1.x, point2.y - point1.y);
        const axis = vec(-edge.y, edge.x);

        const axisLength = Math.sqrt(dotProduct(axis, axis));
        const normalizedAxis = vec(axis.x / axisLength, axis.y / axisLength);

        let min1 = Number.MAX_VALUE;
        let max1 = Number.MIN_VALUE;
        let min2 = Number.MAX_VALUE;
        let max2 = Number.MIN_VALUE;

        for (let j = 0; j < vertices1.length; j++) {
            const projectedPoint = dotProduct(vertices1[j], normalizedAxis);
            min1 = Math.min(min1, projectedPoint);
            max1 = Math.max(max1, projectedPoint);
        }

        for (let j = 0; j < vertices2.length; j++) {
            const projectedPoint = dotProduct(vertices2[j], normalizedAxis);
            min2 = Math.min(min2, projectedPoint);
            max2 = Math.max(max2, projectedPoint);
        }

        if (max1 < min2 || max2 < min1) return false;
    }
    return true;
}

function checkSphereCollision(sphere1, sphere2) {
    const center1 = sphere1.transform.position;
    const center2 = sphere2.transform.position;
    const distance = Math.sqrt(Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2));
    return distance <= (sphere1.collider.radius * (0.5 * (sphere1.transform.scale.x + sphere1.transform.scale.y))) + (sphere2.collider.radius * (0.5 * (sphere2.transform.scale.x + sphere2.transform.scale.y)));
}

function checkOrientedBoxSphereCollision(box, sphere) {
    const vertices = getTransformedVertices(box.transform, box.collider.width, box.collider.height);
    const center = sphere.transform.position;
    const radius = sphere.collider.radius * (0.5 * (sphere.transform.scale.x + sphere.transform.scale.y));

    for (let i = 0; i < vertices.length; i++) {
        const currentVertex = vertices[i];
        const nextVertex = vertices[(i + 1) % vertices.length];
        if (checkLineSphereIntersection(currentVertex, nextVertex, center, radius)) return true;
    }
    return isPointInBox(center, vertices);
}

function checkLineSphereIntersection(start, end, sphereCenter, sphereRadius) {
    const lineDirection = vec(end.x - start.x, end.y - start.y);
    const lineLength = Math.sqrt(dotProduct(lineDirection, lineDirection));
    const startToCenter = vec(sphereCenter.x - start.x, sphereCenter.y - start.y);
    const dotProductValue = dotProduct(startToCenter, lineDirection);

    if (dotProductValue < 0) return Math.sqrt(dotProduct(startToCenter, startToCenter)) <= sphereRadius;

    if (dotProductValue > lineLength) {
        const endToCenter = vec(sphereCenter.x - end.x, sphereCenter.y - end.y);
        return Math.sqrt(dotProduct(endToCenter, endToCenter)) <= sphereRadius;
    }

    const closestPointOnLine = vec(
        start.x + (dotProductValue / lineLength) * lineDirection.x,
        start.y + (dotProductValue / lineLength) * lineDirection.y
    );

    return Math.sqrt(dotProduct(vec(closestPointOnLine.x - sphereCenter.x, closestPointOnLine.y - sphereCenter.y), vec(closestPointOnLine.x - sphereCenter.x, closestPointOnLine.y - sphereCenter.y))) <= sphereRadius;
}

function isPointInBox(point, boxVertices) {
    let inside = false;
    for (let i = 0, j = boxVertices.length - 1; i < boxVertices.length; j = i++) {
        const intersect = (boxVertices[i].y > point.y) !== (boxVertices[j].y > point.y) && point.x < (boxVertices[j].x - boxVertices[i].x) * (point.y - boxVertices[i].y) / (boxVertices[j].y - boxVertices[i].y) + boxVertices[i].x;
        if (intersect) inside = !inside;
    }
    return inside;
}
