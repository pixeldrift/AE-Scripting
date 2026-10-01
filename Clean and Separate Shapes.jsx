
//  CLEANUP GROUPS FROM ILLUSTRATOR

function cleanGroups(shapeLayer) {
    var contents = shapeLayer.property("ADBE Root Vectors Group");
    if (!contents) return;

    // Loop through top-level groups
    for (var i = contents.numProperties; i >= 1; i--) {
        var grp = contents.property(i);

        // Only process vector groups at root level
        if (grp.matchName !== "ADBE Vector Group") continue;

        // Loop through children inside this group
        for (var j = grp.numProperties; j >= 1; j--) {
            var child = grp.property(j);

            // Remove any sub-group
            if (child.matchName === "ADBE Vector Group") {
                child.remove();
                continue;
            }

            // Remove merge paths
            if (child.matchName === "ADBE Vector Filter - Merge") {
                child.remove();
                continue;
            }
        }
    }
}

//  SEPARATE GROUPS INTO LAYERS

function separateGroups(shapeLayer) {
    var comp = shapeLayer.containingComp;
    var contents = shapeLayer.property("ADBE Root Vectors Group");
    if (!contents) return;

    // Store group names first so we don't lose indices after deletion
    var groupList = [];
    for (var i = 1; i <= contents.numProperties; i++) {
        var p = contents.property(i);
        if (p.matchName === "ADBE Vector Group") {
            groupList.push(p.name);
        }
    }

    // Duplicate layer once per group
    for (var g = 0; g < groupList.length; g++) {
        var grpName = groupList[g];

        var newLayer = shapeLayer.duplicate();
        var newContents = newLayer.property("ADBE Root Vectors Group");

        // Delete all groups except this one
        for (var i = newContents.numProperties; i >= 1; i--) {
            var p = newContents.property(i);
            if (p.matchName === "ADBE Vector Group" && p.name !== grpName) {
                p.remove();
            }
        }

        // Rename new layer to match the group
        newLayer.name = shapeLayer.name + " - " + grpName;
    }
}



//  MAIN SCRIPT

app.beginUndoGroup("Clean + Separate Shape Groups");

var sel = app.project.activeItem.selectedLayers;

for (var i = 0; i < sel.length; i++) {
    var layer = sel[i];

    if (layer.property("ADBE Root Vectors Group")) {

//        cleanGroups(layer);
		separateGroups(layer);
    }
}

app.endUndoGroup();
