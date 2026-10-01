// CreateLinePathBetweenLayers.jsx

(function () {
    // Ensure two layers are selected
    if (app.project.activeItem == null || !(app.project.activeItem instanceof CompItem)) {
        alert("Please open a composition and select two layers.");
        return;
    }
    
    var comp = app.project.activeItem;
    var selectedLayers = comp.selectedLayers;

    if (selectedLayers.length !== 2) {
        alert("Please select exactly two layers.");
        return;
    }

    // Get the positions of the selected layers
    var layer1 = selectedLayers[0];
    var layer2 = selectedLayers[1];
    var position1 = layer1.transform.position.valueAtTime(comp.time, false);
    var position2 = layer2.transform.position.valueAtTime(comp.time, false);

    // Start an undo group to allow the user to undo the action
    app.beginUndoGroup("Create Line Path Between Layers");

    // Create a new shape layer
    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = "Line";

    // Create a path group inside the shape layer
    var shapeGroup = shapeLayer.content.addProperty("ADBE Vector Group");
    var pathProperty = shapeGroup.content.addProperty("ADBE Vector Shape - Group");

    // Create the path between the two layers
    var myShape.vertices = [position1, position2];
    myShape.inTangents = [[0, 0], [0, 0]];
    myShape.outTangents = [[0, 0], [0, 0]];
    myShape.is_closed = true;

    // Set the stroke to 2px by default
    var stroke = shapeGroup.content.addProperty("ADBE Vector Graphic - Stroke");
    stroke.color = [1, 1, 1]; // White color
    stroke.strokeWidth = 2; // Set stroke width to 2px
    stroke.lineCap = 2; // Round cap for smoothness
    stroke.lineJoin = 2; // Round join for smoothness

    // Create the path
    pathProperty.property("ADBE Vector Shape").setValue(myShape);

    // End the undo group
    app.endUndoGroup();
})();
