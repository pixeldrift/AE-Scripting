{
    // Create a UI panel.
    var win = new Window("palette", "Draw Bounds for Selected Layers", undefined);
    win.orientation = "column";

    // Add a slider for padding.
    win.add("statictext", undefined, "Comp Padding:");
    var paddingSlider = win.add("slider", undefined, 0, 0, 500);
    var paddingValue = win.add("edittext", undefined, "0");
    paddingValue.characters = 5;

    // Update the text field when slider value changes.
    paddingSlider.onChanging = function() {
        paddingValue.text = Math.round(paddingSlider.value);
    };

    // Create a button to execute the main function.
    var executeButton = win.add("button", undefined, "Draw Bounds");

    // This function is a replacement for the standard toComp() AE expression function that for some reason
    // is not available in scripting. It converts layer-space coordinates to comp-space coordinates.
    function toCompSpace(layer, point) {
        var localPos = point.slice(); // Copy the point

        while (layer) {
            var layerPos = layer.transform.position.value;
            var layerScale = layer.transform.scale.value;
            var layerRotation = layer.transform.rotation.value;

            // Apply scaling transforms.
            localPos[0] *= (layerScale[0] / 100);
            localPos[1] *= (layerScale[1] / 100);

            // Calculate rotated coordinates
            var radians = Math.radians(layerRotation);
            var rotatedX = localPos[0] * Math.cos(radians) - localPos[1] * Math.sin(radians);
            var rotatedY = localPos[0] * Math.sin(radians) + localPos[1] * Math.cos(radians);

            // Update the position based on parent position.
            localPos = [layerPos[0] + rotatedX, layerPos[1] + rotatedY];

            // Move to the parent layer. Repeat until we finally to the top level, unparented layer space.
            layer = layer.parent;
        }

        return localPos;
    }

    // A short function to convert degrees to radians.
    Math.radians = function(degrees) {
        return degrees * (Math.PI / 180);
    };

    // The main function for drawing the bounds.
    function drawBounds() {
        app.beginUndoGroup("Draw Bounds");
        try {
            var myComp = app.project.activeItem;
            if (!(myComp instanceof CompItem)) {
                throw new Error("Please select a composition.");
            }

            var myLayers = myComp.selectedLayers;
            if (myLayers.length === 0) {
                throw new Error("Select at least one layer to calculate bounds.");
            }

            // Initiallize our bounds variables.
            // This is where we will collect the farthest values of all the layers.
            var topMost; // Lowest Y value of the top edges.
            var leftMost; // Lowest X value of all left edges.
            var bottomMost; // Highest Y value of the bottom edges.
            var rightMost; // Highest X value of all right edges.
            var topLayer;

            for (var i = 0; i < myLayers.length; i++) {
                var myLayer = myLayers[i];

                // Get the sourceRect so that the dimensions are accurate regardless of layer type.
                var rect = myLayer.sourceRectAtTime(myComp.time, false);
                var layerTopLeft = toCompSpace(myLayer, [0,0]);
                var layerBottomRight = toCompSpace(myLayer, [rect.width, rect.height]);

                // Find the bounds, starting with the first layer.
                if (i == 0) {
                    leftMost = layerTopLeft[0];
                    rightMost = layerBottomRight[0];
                    topMost = layerTopLeft[1];
                    bottomMost = layerBottomRight[1];
                } else {
                    // Figure out which of the selected layers is the farthest right.
                    // Can this be refactored using the max() and min() functions?
                    if (layerTopLeft[0] < leftMost) leftMost = layerTopLeft[0]; // Leftmost
                    if (layerBottomRight[0] > rightMost) rightMost = layerBottomRight[0]; // Rightmost
                    if (layerTopLeft[1] < topMost) topMost = layerTopLeft[1]; // Topmost
                    if (layerBottomRight[1] > bottomMost) bottomMost = layerBottomRight[1]; // Bottommost
                }
            }

            alert(topLayer.name + " is the highest!");
            // Add the optional padding.
            var padding = parseInt(paddingValue.text) || 0;
            leftMost -= padding;
            rightMost += padding;
            topMost -= padding;
            bottomMost += padding;

            // Calculate the bounding box height and width.
            var boundsHeight = bottomMost - topMost;
            var boundsWidth = rightMost - leftMost;

            // Create a new shape layer to draw the bounding box.
            var shapeLayer = myComp.layers.addShape();
            shapeLayer.name = "Bounding Box";

            // Create a rectangle path
            var rectPath = shapeLayer.property("Contents").addProperty("ADBE Vector Shape - Rect");
            rectPath.property("Size").setValue([boundsWidth, boundsHeight]);
            // Position the rectangle in the center of the calculated bounds
            rectPath.property("Position").setValue([(leftMost+(boundsWidth))/2, (topMost+(boundsHeight/2))]);

            // Create a stroke for the rectangle
            var stroke = shapeLayer.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
            stroke.property("Color").setValue([1, 0, 0]); // Red color
            stroke.property("Stroke Width").setValue(1);

            // Set the shape layer's position to (0, 0)
            shapeLayer.transform.position.setValue([0, 0]);

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            app.endUndoGroup();
        }
    }

    // Assign the button action to the named function
    executeButton.onClick = drawBounds;

    // Show the UI panel
    win.center();
    win.show();
}
