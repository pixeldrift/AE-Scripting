{
    // Create a dockable panel.
    var win = (this instanceof Panel) ? this : new Window("palette", "Draw Bounds for Selected Layers", undefined);
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

    // Convert degrees to radians
    Math.radians = function(degrees) {
        return degrees * (Math.PI / 180);
    };

    // Function to calculate the rotated bounding box
    function getRotatedBounds(layer, rect) {
        var rotation = layer.transform.rotation.value;
        var radians = Math.radians(rotation);

        // Calculate the corners of the unrotated rectangle
        var corners = [
            [-rect.width / 2, -rect.height / 2],  // Top-left
            [rect.width / 2, -rect.height / 2],   // Top-right
            [rect.width / 2, rect.height / 2],    // Bottom-right
            [-rect.width / 2, rect.height / 2]     // Bottom-left
        ];

        // Rotate corners
        var rotatedCorners = [];
        for (var i = 0; i < corners.length; i++) {
            var corner = corners[i];
            var x = corner[0] * Math.cos(radians) - corner[1] * Math.sin(radians);
            var y = corner[0] * Math.sin(radians) + corner[1] * Math.cos(radians);
            rotatedCorners.push([x, y]);
        }

        // Find the bounding box of the rotated corners
        var minX = rotatedCorners[0][0];
        var maxX = rotatedCorners[0][0];
        var minY = rotatedCorners[0][1];
        var maxY = rotatedCorners[0][1];

        for (var j = 1; j < rotatedCorners.length; j++) {
            var c = rotatedCorners[j];
            if (c[0] < minX) minX = c[0];
            if (c[0] > maxX) maxX = c[0];
            if (c[1] < minY) minY = c[1];
            if (c[1] > maxY) maxY = c[1];
        }

        return {
            left: minX,
            right: maxX,
            top: minY,
            bottom: maxY
        };
    }

    // Main function for drawing the bounds
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

            // Initialize bounds variables
            var topMost = Number.MAX_VALUE;
            var leftMost = Number.MAX_VALUE;
            var bottomMost = Number.MIN_VALUE;
            var rightMost = Number.MIN_VALUE;

            for (var i = 0; i < myLayers.length; i++) {
                var myLayer = myLayers[i];

                // Check if the layer has a position property
                if (myLayer.transform && myLayer.transform.position) {
                    // Get the sourceRect for accurate dimensions
                    var rect = myLayer.sourceRectAtTime(myComp.time, false);
                    
                    // Calculate the rotated bounds
                    var rotatedBounds = getRotatedBounds(myLayer, rect);

                    // Get the layer's position
                    var layerPos = myLayer.transform.position.value;

                    // Translate the bounds to comp space
                    leftMost = Math.min(leftMost, layerPos[0] + rotatedBounds.left);
                    rightMost = Math.max(rightMost, layerPos[0] + rotatedBounds.right);
                    topMost = Math.min(topMost, layerPos[1] + rotatedBounds.top);
                    bottomMost = Math.max(bottomMost, layerPos[1] + rotatedBounds.bottom);
                }
            }

            // Add the optional padding
            var padding = parseInt(paddingValue.text) || 0;
            leftMost -= padding;
            rightMost += padding;
            topMost -= padding;
            bottomMost += padding;

            // Calculate the bounding box height and width
            var boundsHeight = bottomMost - topMost;
            var boundsWidth = rightMost - leftMost;

            // Check if bounds are valid
            if (boundsHeight <= 0 || boundsWidth <= 0) {
                alert("No valid bounds calculated.");
                return;
            }

            // Create a new shape layer to draw the bounding box
            var shapeLayer = myComp.layers.addShape();
            shapeLayer.name = "Bounding Box";

            // Create a rectangle path
            var rectPath = shapeLayer.property("Contents").addProperty("ADBE Vector Shape - Rect");
            rectPath.property("Size").setValue([boundsWidth, boundsHeight]);

            // Position the rectangle in the correct location
            rectPath.property("Position").setValue([
                leftMost + (boundsWidth / 2) - (myComp.width / 2), // Adjust for comp center
                topMost + (boundsHeight / 2) - (myComp.height / 2) // Adjust for comp center
            ]);

            // Create a stroke for the rectangle
            var stroke = shapeLayer.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
            stroke.property("Color").setValue([1, 0, 0]); // Red color
            stroke.property("Stroke Width").setValue(1);

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            app.endUndoGroup();
        }
    }

    // Assign the button action to the named function
    executeButton.onClick = drawBounds;

    // Show the dockable panel
    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }
}
