// OutaBounds
// v1.0 - Nathan D. B. Pizar (nathan@pizar.net)
// 2024.09.23
// After Effects script to visualize the combined bounding box of selected layers.

{
    // Create a dockable panel.
    var win = (this instanceof Panel) ? this : new Window("palette", "Draw Bounds for Selected Layers", undefined);
    win.orientation = "column";

    // Add a panel for padding control
    var paddingPanel = win.add("group");
    paddingPanel.orientation = "row";
    paddingPanel.add("statictext", undefined, "Comp Padding:");

    var paddingSlider = paddingPanel.add("slider", undefined, 50, 0, 100); // Default value set to 50
    var paddingValue = paddingPanel.add("edittext", undefined, "50"); // Default value set to 50
    paddingValue.characters = 5;

    // Update the text field when slider value changes.
    paddingSlider.onChanging = function() {
        paddingValue.text = Math.round(paddingSlider.value);
    };

    // Allow manual entry
    paddingValue.onChange = function() {
        var value = parseInt(paddingValue.text);
        if (!isNaN(value)) {
            paddingSlider.value = Math.min(Math.max(value, 0), 100); // Keep within slider range for display
        }
    };

    // Checkbox for visualizing padding
    var visualizePaddingCheckbox = win.add("checkbox", undefined, "Visualize Padding");
    visualizePaddingCheckbox.value = true; // Checked by default.

    // Create buttons to execute the main functions.
    var drawBoundsButton = win.add("button", undefined, "Draw Bounds");
    var cropButton = win.add("button", undefined, "Crop to Bounds");

    // Convert degrees to radians
    Math.radians = function(degrees) {
        return degrees * (Math.PI / 180);
    };

    // Function to calculate the rotated bounding box
    function getRotatedBounds(layer, rect) {
        var rotation = layer.transform.rotation.value;
        var scale = layer.transform.scale.value;
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
            rotatedCorners.push([x * (scale[0] / 100), y * (scale[1] / 100)]);
        }

        return rotatedCorners;
    }

    // Function to find bounds of selected layers or all layers
    function findBounds() {
        var myComp = app.project.activeItem;
        var myLayers = myComp.selectedLayers;
        if (myLayers.length === 0) {
            // Use all layers if none are selected
            myLayers = [];
            for (var i = 1; i <= myComp.numLayers; i++) {
                myLayers.push(myComp.layer(i));
            }
        }
     
        var topMost = Number.MAX_VALUE;
        var leftMost = Number.MAX_VALUE;
        var bottomMost = Number.MIN_VALUE;
        var rightMost = Number.MIN_VALUE;

        for (var i = 0; i < myLayers.length; i++) {
            var myLayer = myLayers[i];

            // Check if the layer has a position property
            if (myLayer.transform && myLayer.transform.position) {
                var rect = myLayer.sourceRectAtTime(myComp.time, false);
                var layerPos = myLayer.transform.position.value;
                var anchorPoint = myLayer.transform.anchorPoint.value;
                var rotatedCorners = getRotatedBounds(myLayer, rect);

                for (var j = 0; j < rotatedCorners.length; j++) {
                    var corner = rotatedCorners[j];
                    // Calculate the corner's position in comp space
                    var adjustedX = layerPos[0] + corner[0] - anchorPoint[0];
                    var adjustedY = layerPos[1] + corner[1] - anchorPoint[1];

                    leftMost = Math.min(leftMost, adjustedX);
                    rightMost = Math.max(rightMost, adjustedX);
                    topMost = Math.min(topMost, adjustedY);
                    bottomMost = Math.max(bottomMost, adjustedY);
                }
            }
        }

        // Check if bounds are valid
        if (topMost === Number.MAX_VALUE || leftMost === Number.MAX_VALUE || 
            bottomMost === Number.MIN_VALUE || rightMost === Number.MIN_VALUE) {
            throw new Error("No valid bounds calculated.");
        }

        return { leftMost: leftMost, rightMost: rightMost, topMost: topMost, bottomMost: bottomMost };
    }

    // Function to crop the composition to the bounding box
    function cropToBounds(leftMost, rightMost, topMost, bottomMost) {
        var width = rightMost - leftMost;
        var height = bottomMost - topMost;

        // Set the composition's size
        var myComp = app.project.activeItem;
        myComp.width = Math.round(width);
        myComp.height = Math.round(height);

        // Calculate the offset for repositioning layers
        var offsetX = (myComp.width / 2) - (leftMost + (rightMost - leftMost) / 2);
        var offsetY = (myComp.height / 2) - (topMost + (bottomMost - topMost) / 2);

        // Adjust the position of the layers within the comp
        for (var i = 1; i <= myComp.numLayers; i++) {
            var layer = myComp.layer(i);
            if (layer.selected || myComp.selectedLayers.length === 0) {
                var layerPos = layer.transform.position.value;
                layer.transform.position.setValue([layerPos[0] + offsetX, layerPos[1] + offsetY]);
            }
        }
    }

    // Main function for drawing the bounds
    function drawBounds() {
        app.beginUndoGroup("Draw Bounds");
        try {
            var myComp = app.project.activeItem;
            if (!(myComp instanceof CompItem)) {
                throw new Error("Please select a composition.");
            }

            var bounds = findBounds();
            var leftMost = bounds.leftMost;
            var rightMost = bounds.rightMost;
            var topMost = bounds.topMost;
            var bottomMost = bounds.bottomMost;

            // Add the optional padding
            var padding = Math.round(parseInt(paddingValue.text) || 0);
            var paddedLeft = Math.round(leftMost - padding);
            var paddedRight = Math.round(rightMost + padding);
            var paddedTop = Math.round(topMost - padding);
            var paddedBottom = Math.round(bottomMost + padding);

            // Calculate the bounding box height and width
            var boundsHeight = Math.round(bottomMost - topMost);
            var boundsWidth = Math.round(rightMost - leftMost);

            // Check if bounds are valid
            if (boundsHeight <= 0 || boundsWidth <= 0) {
                alert("No valid bounds calculated.");
                return;
            }

            // Create a new shape layer to draw the bounding box
            var shapeLayer = myComp.layers.addShape();
            shapeLayer.name = "Bounding Box";

            // Draw the outer bounds including padding
            var outerBoundsWidth = paddedRight - paddedLeft;
            var outerBoundsHeight = paddedBottom - paddedTop;

            // Create a rectangle path for the outer padded bounds
            var outerRectPath = shapeLayer.property("Contents").addProperty("ADBE Vector Shape - Rect");
            outerRectPath.property("Size").setValue([outerBoundsWidth, outerBoundsHeight]);

            // Position the outer rectangle in the correct location
            outerRectPath.property("Position").setValue([
                Math.round(paddedLeft + (outerBoundsWidth / 2) - (myComp.width / 2)),
                Math.round(paddedTop + (outerBoundsHeight / 2) - (myComp.height / 2))
            ]);

            // Create a stroke for the outer rectangle
            var outerStroke = shapeLayer.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
            outerStroke.property("Color").setValue([1, 0, 0]); // Red color
            outerStroke.property("Stroke Width").setValue(1);

            // If the checkbox is checked, draw the padded rectangle
            if (visualizePaddingCheckbox.value) {
                // Calculate the bounding box height and width for the inner bounds
                var innerBoundsWidth = boundsWidth;
                var innerBoundsHeight = boundsHeight;

                // Create a second rectangle path for the inner bounds
                var innerRectPath = shapeLayer.property("Contents").addProperty("ADBE Vector Shape - Rect");
                innerRectPath.property("Size").setValue([innerBoundsWidth, innerBoundsHeight]);

                // Position the inner rectangle
                innerRectPath.property("Position").setValue([
                    Math.round(leftMost + (innerBoundsWidth / 2) - (myComp.width / 2)),
                    Math.round(topMost + (innerBoundsHeight / 2) - (myComp.height / 2))
                ]);

                // Create a faded stroke for the inner rectangle
                var innerStroke = shapeLayer.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
                innerStroke.property("Color").setValue([1, 0, 0, 0.5]); // Red with alpha for fading
                innerStroke.property("Stroke Width").setValue(1);
            }

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            app.endUndoGroup();
        }
    }

    // Assign the button actions to the named functions
    drawBoundsButton.onClick = drawBounds;

    cropButton.onClick = function() {
        app.beginUndoGroup("Crop Composition");
        try {
            var myComp = app.project.activeItem;
            if (!(myComp instanceof CompItem)) {
                throw new Error("Please select a composition.");
            }

            var bounds = findBounds();
            var leftMost = Math.round(bounds.leftMost);
            var rightMost = Math.round(bounds.rightMost);
            var topMost = Math.round(bounds.topMost);
            var bottomMost = Math.round(bounds.bottomMost);

            // Add the optional padding
            var padding = Math.round(parseInt(paddingValue.text) || 0);
            var paddedLeft = Math.round(leftMost - padding);
            var paddedRight = Math.round(rightMost + padding);
            var paddedTop = Math.round(topMost - padding);
            var paddedBottom = Math.round(bottomMost + padding);

            // Crop the composition
            cropToBounds(paddedLeft, paddedRight, paddedTop, paddedBottom);

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            app.endUndoGroup();
        }
    };

    // Show the dockable panel
    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }
}
