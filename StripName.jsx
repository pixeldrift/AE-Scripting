{
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        app.beginUndoGroup("Remove ' Outlines' from Layer Names");

        var selectedLayers = comp.selectedLayers;
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            layer.name = layer.name.replace(" Outlines", "");
        }

        app.endUndoGroup();
    } else {
        alert("Please select a composition.");
    }
}
