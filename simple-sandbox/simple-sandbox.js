function makeSandbox(canvas) {
    return {
        clock: 0,
        surface: canvas.getContext("2d"),
        objects: new Map(),
        makeObject: function(renderer, collider, physics) {
            const id = this.clock++;
            this.objects.set(id, {
                id: id,
                layer: 0,
                transform: transform(),
                renderer: renderer,
                collider: collider,
                physics: physics
            });
            return this.objects.get(id);
        },
        removeObject: function(object) {
            this.objects.delete(object.id);
        },
        update: function() {
            this.surface.reset();
            this.objects.forEach(object => {
                object.renderer.draw(object, this.surface);
            });
        },
        drawLine: function(from, to, width = 5) {
            const sw = this.surface.canvas.width, sh = this.surface.canvas.height;
            this.surface.beginPath();
            this.surface.lineWidth = width/unit*(0.5*(sw+sh));
            this.surface.moveTo((from.x+unit*0.5)/unit*sw, (from.y+unit*0.5)/unit*sh);
            this.surface.lineTo((to.x+unit*0.5)/unit*sw, (to.y+unit*0.5)/unit*sh);
            this.surface.stroke();
            this.surface.closePath();
        }
    };
}

const unit = 1000;

function vec(x, y) {
    return {x: x, y: y}
}

function transform() {
    return {
        position: vec(0, 0),
        scale: vec(1, 1),
        rotation: 0,
        toNormalizedCamera: function() {
            return {
                position: vec((this.position.x+unit*0.5)/unit, (this.position.y+unit*0.5)/unit),
                scale: this.scale,
                rotation: this.rotation,
            };
        }
    };
}

function boxRenderer(width, height) {
    return {
        draw: function(self, surface) {
            const transform = self.transform.toNormalizedCamera();
            const nw = width/unit*transform.scale.x, nh = height/unit*transform.scale.y;
            const sw = surface.canvas.width, sh = surface.canvas.height;
            
            surface.translate((transform.position.x)*sw, (transform.position.y)*sh);
            surface.rotate(transform.rotation*(Math.PI/180));
            surface.translate(-(transform.position.x)*sw, -(transform.position.y)*sh);

            surface.fillRect(
                (transform.position.x-nw*0.5)*sw, (transform.position.y-nh*0.5)*sh,
                nw*sw, nh*sh
            );

            surface.translate((transform.position.x)*sw, (transform.position.y)*sh);
            surface.rotate(-transform.rotation*(Math.PI/180));
            surface.translate(-(transform.position.x)*sw, -(transform.position.y)*sh);
        }
    };
}

function circleRenderer(radius) {
    return {
        draw: function(self, surface) {
            const transform = self.transform.toNormalizedCamera();
            const sw = surface.canvas.width, sh = surface.canvas.height;
            const nr = radius/unit*(0.5*(transform.scale.x+transform.scale.y));

            surface.beginPath();
            surface.arc((transform.position.x)*sw, (transform.position.y)*sh, Math.abs(nr*(0.5*(sw+sh))), 0, Math.PI*2);
            surface.stroke();
            surface.fill();
            surface.closePath();
        }
    };
}

function textureRenderer(img, width, height) {
    return {
        draw: function(self, surface) {
            const transform = self.transform.toNormalizedCamera();
            const nw = width/unit*transform.scale.x, nh = height/unit*transform.scale.y;
            const sw = surface.canvas.width, sh = surface.canvas.height;
            
            surface.translate((transform.position.x)*sw, (transform.position.y)*sh);
            surface.rotate(transform.rotation*(Math.PI/180));
            surface.translate(-(transform.position.x)*sw, -(transform.position.y)*sh);

            surface.drawImage(img, (transform.position.x-nw*0.5)*sw, (transform.position.y-nh*0.5)*sh, nw*sw, nh*sh);

            surface.translate((transform.position.x)*sw, (transform.position.y)*sh);
            surface.rotate(-transform.rotation*(Math.PI/180));
            surface.translate(-(transform.position.x)*sw, -(transform.position.y)*sh);
        }
    };
}
