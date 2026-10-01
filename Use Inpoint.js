// Function to update all expressions on selected layers to account for layer start time
function updateExpressionsWithStartTime(layers) {
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];

        // Check if the layer is a shape layer
        if (layer instanceof ShapeLayer) {
            // Iterate through all properties of the layer
            for (var j = 1; j <= layer.numProperties; j++) {
                var property = layer.property(j);
                if (property) {
                    updatePropertyExpressions(property);
                }
            }
        }
    }
}

// Function to recursively update expressions in properties
function updatePropertyExpressions(property) {
    // Check if the property has an expression
    if (property.expression) {
        // Replace "time" with "(time - thisLayer.startTime)"
        var newExpression = property.expression.replace(/time/g, "(time - thisLayer.startTime)");
        property.expression = newExpression;
    }

    // If the property has sub-properties, iterate through them
    if (property.numProperties) {
        for (var k = 1; k <= property.numProperties; k++) {
            var subProperty = property.property(k);
            updatePropertyExpressions(subProperty);
        }
    }
}

// Main script logic
var selectedLayers = app.project.activeItem.selectedLayers;

if (selectedLayers.length === 0) {
    alert("Please select one or more shape layers.");
} else {
    app.beginUndoGroup("Update Expressions with Layer Start Time");

    updateExpressionsWithStartTime(selectedLayers);

    app.endUndoGroup();
}
