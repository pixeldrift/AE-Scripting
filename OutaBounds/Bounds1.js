{
    // Create UI panel
    var win = new Window("palette", "Precompose Selected Layers", undefined);
    win.orientation = "column";

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

                // "precompose" expects an array of layer indices
                var layerIndices = [];
                for (var i = 0; i < myLayers.length; i++) {
                    layerIndices.push(myLayers[i].index);
                    
                    // Adjust in and out points based on selected layers
                    if (myLayers[i].inPoint < newInPoint) newInPoint = myLayers[i].inPoint;
                    if (myLayers[i].outPoint > newOutPoint) newOutPoint = myLayers[i].outPoint;
                }

                // Precompose the selected layers
                var precompLayerIndex = myComp.layers.precompose(layerIndices, newCompName, true);

                // Set in and out points of new comp
                var preCompLayer = myComp.layer(precompLayerIndex);
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
