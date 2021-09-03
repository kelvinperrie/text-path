
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  $(document).ready(function() {
    
    var player = new TextPathPlayer();
    $(".test-button-trigger").click(function() {
        var path = JSON.parse($(".path-output").val());
        var speed = $(".speed-increment").val();
        var text = $(".text-to-move").val();
        player.PlayPath(path,speed, text);
    });

    var recorder = new TextPathRecorder();
  });


var TextPathPlayer = function() {
    let self = this;

    self.path = null;
    self.pathPauseTime = null;
    self.textToZoom = null;
    self.currentPathTargetIndex = 0;
    self.currentLocation = null;
    self.currentAngle = 0;
    self.elementIdentifier = ".zoomy";

    self.PlayPath = function(path, pathPauseTime, textToZoom) {

        if($(self.elementIdentifier).length < 1) {
            $("body").append("<div class='zoomy'></div>")
        }

        console.log("about to play a path")
        self.path = path;
        self.pathPauseTime = pathPauseTime;
        self.textToZoom = textToZoom;

        $(self.elementIdentifier).text(self.textToZoom);
        self.DisplayAtPoint(0);

    };
    self.DisplayAtPoint = function(pointIndex) {
        console.log("displaying for point " + pointIndex);
        console.log(self.path[pointIndex]);
        console.log(self.path[pointIndex].x);
        console.log(self.path[pointIndex].direction);

        self.currentLocation = { x: self.path[pointIndex].x, y: self.path[pointIndex].y };
        self.currentAngle = self.path[pointIndex].direction;

        self.UpdateVisualLocation();

        if(pointIndex === self.path.length - 1) {
            // we're at the end.
            
        } else {
            setTimeout(function() { self.DisplayAtPoint(pointIndex + 1) }, self.pathPauseTime);
        }
    };

    self.UpdateVisualLocation = function() {
        console.log("location to put at is " + self.currentLocation.x + "," + self.currentLocation.y);
        $(self.elementIdentifier).css({ left: self.currentLocation.x, top: self.currentLocation.y });
        $(self.elementIdentifier).css({ transform: "rotate("+self.currentAngle+"deg)" });
    };
}


var TextPathRecorder = function() {
    let self = this;

    self.state = "";
    self.path = [];
    self.pathRecordWaitTime = $(".speed-increment").val();
    self.mouseCurrentX = 0;
    self.mouseCurrentY = 0;

    self.RecordPathPoint = function() {
        // check that we're still recording ...
        if(self.state === "recording") {
            let newPoint = {
                x: self.mouseCurrentX,
                y: self.mouseCurrentY
            }
            console.log("recording new point at " + newPoint.x + "," + newPoint.y);
            self.path.push(newPoint);
            setTimeout(self.RecordPathPoint, self.pathRecordWaitTime);
        }
    };
    // this is going to go through our newly recorded path and add any additional
    // information it needs
    self.UpdatePathHelper = function() {
        if(self.path.length < 2) {
            return; // mate you're joking
        }
        // remove duplicates? sure, why not
        for (let i = self.path.length -1; i > 0; i--) {
            if((self.path[i].x === self.path[i-1].x) && (self.path[i].y === self.path[i-1].y)) {
                // this is the same as the previous, so delete it
                self.path.splice(i,1);
            }
        }

        for (let i = 0; i < self.path.length; i++) {
            if(i === self.path.length -1) {
                // this is the last point, so we can't get an angle to the next one (there isn't a next)
                // I don't think we need an angle because from the last point we can't move anywhere anyway ...
            } else {
                // get the angle to the next point
                // some weird stuff is going to happen if the points are on top of each other? dunno, lets find out
                var theta = self.GetAngleBetweenPoints(self.path[i].x, self.path[i].y, self.path[i+1].x, self.path[i+1].y);
                self.path[i].direction = theta;
            }
        }
    };
    self.GetAngleBetweenPoints = function(fromX, fromY, toX, toY) {
        var dy = toY - fromY;
        var dx = toX - fromX;
        var theta = Math.atan2(dy, dx); // range (-PI, PI]
        theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
        //if (theta < 0) theta = 360 + theta; // range [0, 360)
        return theta;
    };
    self.OutputPath = function() {
        var jsonPath = JSON.stringify(self.path);
        $(".path-output").val(jsonPath);
    };

    self.UpdateState = function(newState) {
        console.log("setting state to " + newState);
        self.state = newState;
    };
    self.StartListening = function() {
        self.UpdateState("listening");
    };
    self.StartRecording = function() {
        self.path = []; // do we want to add to or clear previous data?
        self.UpdateState("recording");
        self.RecordPathPoint();
    };
    self.StopRecording = function() {
        self.UpdateState("stopped");
        self.UpdatePathHelper();
        self.OutputPath();
    };
    self.Initialize = function() {
        self.UpdateState("stopped");

        $(document).ready(function() {
            $(".listening-start-trigger").click(function() {
                self.StartListening();
                return false;   // cancel the click otherwise it will go to the other handler and we will start recording straight away
            });
            // $(".recording-stop-trigger").click(function() {
            //     self.StopRecording();
            // });
            $("html").click(function() {
                console.log("heard a click");
                // if we're listening then a click is going to start us recording,
                // if we're already recording then a click is going to stop us recording
                if(self.state === "listening") {
                    self.StartRecording();
                    return false;
                } else if(self.state === "recording") {
                    self.StopRecording();
                    return false;
                }
            });
            $("html").mousemove(function(event) {
                self.mouseCurrentX = event.pageX;
                self.mouseCurrentY = event.pageY;
            });
        });
    };
    self.Initialize();
};