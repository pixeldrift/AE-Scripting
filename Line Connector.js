// Connect selected "Node ##" layers with unique line shape layers (fixed, robust)
(function() {
    var proj = app.project;
    if (!proj) return;
    var comp = proj.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        alert("Please open a composition and select at least two Node layers.");
        return;
    }

    var sel = comp.selectedLayers;
    if (!sel || sel.length < 2) {
        alert("Select at least 2 layers named 'Node 01', 'Node 02', etc.");
        return;
    }


    function escName(name) {
        return name.replace(/'/g, "\\'"); // escape single quotes for expression strings
    }

    app.beginUndoGroup("Connect Nodes with Lines (fixed)");

    var now = comp.time;

    for (var i = 0; i < sel.length; i++) {
        for (var j = i + 1; j < sel.length; j++) {
            try {
                var nodeA = sel[i];
                var nodeB = sel[j];

                // Extract a short index from names like "Node 01" (keeps "01")
                var nameA = (nodeA.name.match(/\d+/) || [nodeA.name])[0];
                var nameB = (nodeB.name.match(/\d+/) || [nodeB.name])[0];
                var lineName = "Line - " + nameA + " to " + nameB;

                // Skip if a line with this exact name already exists
                if (comp.layer(lineName)) {
                    continue;
                }

                // Create shape layer
                var lineLayer = comp.layers.addShape();
                lineLayer.name = lineName;

                // Root contents (compat across AE versions)
                var root = lineLayer.property("ADBE Root Vectors Group") || lineLayer.property("Contents") || lineLayer.property(1);
                if (!root) throw("Can't find shape Contents on new shape layer");

                // Add a vector group
                var shapeGroup = root.addProperty("ADBE Vector Group");
                shapeGroup.name = "Line Path";

                var shapeContents = shapeGroup.property("ADBE Vectors Group") || shapeGroup.property("Contents") || shapeGroup.property(1);
                if (!shapeContents) throw("Can't get Contents of shape group");

                // Add the path shape (vector shape group)
                var shapePath = shapeContents.addProperty("ADBE Vector Shape - Group");
                var pathProp = shapePath.property("ADBE Vector Shape") || shapePath.property("Path") || shapePath.property(1);
                if (!pathProp) throw("Can't find Path property");

                // Expression that grabs each node's anchorPoint in comp space then converts to this layer space
                var aEsc = escName(nodeA.name);
                var bEsc = escName(nodeB.name);
                var expr =
                    "var A = thisComp.layer('" + aEsc + "').toComp(thisComp.layer('" + aEsc + "').anchorPoint);\n" +
                    "var B = thisComp.layer('" + bEsc + "').toComp(thisComp.layer('" + bEsc + "').anchorPoint);\n" +
                    "A = fromComp(A);\nB = fromComp(B);\n" +
                    "createPath(points=[A,B], inTangents=[], outTangents=[], closed=false);";
                pathProp.expression = expr;

                // Add stroke (2px white)
                var stroke = shapeContents.addProperty("ADBE Vector Graphic - Stroke");
                var colorP = stroke.property("ADBE Vector Stroke Color") || stroke.property("Color") || stroke.property(1);
                if (colorP) colorP.setValue([1, 1, 1]);
                var wP = stroke.property("ADBE Vector Stroke Width") || stroke.property("Stroke Width") || stroke.property(2);
                if (wP) wP.setValue(2);

            } catch (err) {
                alert("Error creating line for " + sel[i].name + " → " + sel[j].name + "\n" + err.toString());
            }
        }
    }

    app.endUndoGroup();
})();
