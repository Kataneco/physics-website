function main() {
    const deltaTime = 10;
    let canvas = renderer(document.getElementById("surface"));
    let myBox = canvas.push(box(100, 100));
    let myLine = canvas.push(line(vec(400,400), myBox.position, 5));
    let myCircle = canvas.push(circle(32));
    canvas.update();
    
    var boop = 400;
    var beep = true;
    setInterval(function(){
        boop += beep ? 1 : -1;
        if (boop<=0+myBox.size.x/2||boop>=800-myBox.size.x/2) beep = !beep;
        myBox.position = vec(boop, boop);
        myLine.end = myBox.position;
        canvas.update();
    }, deltaTime);
}