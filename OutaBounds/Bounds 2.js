{
    // Create UI panel
    var win = new Window("palette", "Precompose Selected Layers", undefined);
    win.orientation = "column";

    // Slider for Padding
    win.add("statictext", undefined, "Comp Padding:");
    var paddingSlider = win.add("slider", undefined, 0, 0, 500);
    var paddingValue = win.add("edittext", undefined, "0");
    paddingValue.characters = 5;

    // Update the edittext when slider changes
    paddingSlider.onChanging = function() {
        paddingValue.text = Math.round(paddingSlider.value);
    };

    // Button to execute precomposing
    var executeButton = win.add("button", undefined, "Precompose Selected Layers");

    // Named function for precomposing layers
    function precomposeLayers() {
        app.beginUndoGroup("Precompose Selected Layers");

        // Select the active item in the project window and make sure it's a comp
        var myComp = app.project.activeItem;
        if (myComp instanceof CompItem) {
            // Make sure one or more layers are selected
            var myLayers = myComp.selectedLayers;
            if (myLayers.length > 0) {
                // Set new comp's default in and out points to those of the first layer
                var newInPoint = myLayers[0].inPoint;
                var newOutPoint = myLayers[0].outPoint;

                // Create new comp name of "Precomp " plus name of the first layer
                var newCompName = "Precomp ";
                var layerName = myLayers[0].name;
                if (layerName.length > 26) {
                    layerName = layerName.substring(0, 26);
                }
                newCompName += layerName;

                // Initialize bounds and layer indices
                var left = Number.MAX_VALUE;
                var top = Number.MAX_VALUE;
                var right = Number.MIN_VALUE;
                var bottom = Number.MIN_VALUE;
                var layerIndices = [];

                // Calculate bounds for all selected layers
                for (var i = 0; i < myLayers.length; i++) {
                    layerIndices.push(myLayers[i].index);
                    var bounds = myLayers[i].sourceRectAtTime(0, false);
                    var layerPosition = myLayers[i].transform.position.value;

                    // Update bounds
                    left = Math.min(left, bounds.left + layerPosition[0]);
                    top = Math.min(top, bounds.top + layerPosition[1]);
                    right = Math.max(right, bounds.left + layerPosition[0] + bounds.width);
                    bottom = Math.max(bottom, bounds.top + layerPosition[1] + bounds.height);
                }

                // Add padding
                var padding = parseInt(paddingValue.text) || 0;
                var precompWidth = Math.ceil(right - left + padding * 2);
                var precompHeight = Math.ceil(bottom - top + padding * 2);

                // Precompose the selected layers
                var precompLayerIndex = myComp.layers.precompose(layerIndices, newCompName, true);

                // Set the new comp's width and height
                var preCompLayer = myComp.layer(precompLayerIndex);
                var preComp = app.project.item(precompLayerIndex);
                preComp.width = precompWidth;
                preComp.height = precompHeight;

                // Position the precomp layer to maintain relative positioning
                var newPos = [left + padding + (precompWidth / 2), top + padding + (precompHeight / 2)];
                preCompLayer.transform.position.setValue(newPos);

                // Set in and out points of new comp
                preCompLayer.inPoint = newInPoint;
                preCompLayer.outPoint = newOutPoint;

            } else {
                alert("Select at least one layer to precompose.");
            }
        } else {
            alert("Please select a composition.");
        }
        
        app.endUndoGroup();
    }

    // Assign the button action to the named function
    executeButton.onClick = precomposeLayers;

    // Show the UI panel
    win.center();
    win.show();
}
