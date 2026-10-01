//@target illustrator
//@script "Name-O-Matic"
//@targetengine "main"

//IIFE
(function(UIObj) {

(function nameOMatic(thisObj) {

    //MAIN SCRIPT
        try {
            scriptName = "Name-O-Matic";
            scriptVersion = "1.000";
            var nameOMaticPalette = thisObj instanceof Panel ? thisObj : new Window("palette", scriptName + " v" + scriptVersion, undefined, {
                minimizeButton: true,
                maximizeButton: true,
                resizeable: false,
                closeButton: true,
                independent: false,
            });

        // User Interface
            nameOMaticPalette.orientation = "column";
            nameOMaticPalette.alignChildren = ["center", "center"];

            var nameInputGroup = nameOMaticPalette.add("group");
            nameInputGroup.orientation = "row";
            var inputLabel = nameInputGroup.add("statictext", undefined, "");
            var inputTextBox = nameInputGroup.add("edittext", undefined, "Enter your text");

            inputTextBox.characters = 35;
            inputTextBox.active = true;

            var dropdownGroup = nameOMaticPalette.add("group");
            dropdownGroup.orientation = "row";
            var dropdown = dropdownGroup.add("dropdownlist", undefined, ["Rename Layers", "Add Text Before", "Add Text After"]);
            dropdown.selection = 0;
            var numberCheckbox = dropdownGroup.add("checkbox", undefined, "Number Sequentially");
            numberCheckbox.value = true;

            var numberingGroup = nameOMaticPalette.add("group");
            numberingGroup.orientation = "row";

            var numberPositionRadioGroup = numberingGroup.add("panel");
            numberPositionRadioGroup.orientation = "row";
            var numberPositionLabel = numberPositionRadioGroup.add("statictext", undefined, "Numbering:");
            var numberPositionBefore = numberPositionRadioGroup.add("radiobutton", undefined, "Before");
            var numberPositionAfter = numberPositionRadioGroup.add("radiobutton", undefined, "After");
            numberPositionBefore.value = true;

            var startingNumberLabel = numberingGroup.add("statictext", undefined, "Starting #:");
            var startingNumberInput = numberingGroup.add("edittext", undefined, "1");
            startingNumberInput.characters = 4;
            startingNumberInput.enabled = true;

            var renameButton = nameOMaticPalette.add("button", undefined, "Rename Layers");

        // End User Interface


            numberCheckbox.onClick = function() {
                numberingGroup.enabled = numberCheckbox.value;
            };
            renameButton.onClick = function() {
                try {
                    performRename(inputTextBox);
                } catch (e) {
                    alert(e.toString() + " - Function : " + arguments.callee.name + "\nLine : " + e.line.toString());
                }
            };

            function getPaddedNumber(number, digits) {
                var paddedNumber = "0000000000" + number;
                return paddedNumber.slice(-digits);
            }

            function performRename(newText) {
                if (app) {
                    alert("Application is accessible");
                } else {
                    alert("Application is not accessible");
                    return;
                }
                var doc = app.document;

                // if (selectedLayers.length === 0) {//if no layers are selected
                //     alert("Please select at least one layer.");
                //     return;
                // }
                //TEST TO GO THROUGH ALL LAYERS
                for (var i = 0; i < doc.length; i++)// fred
                               {// fred
                    var layerName = new String(docs[i].name);//fred
                    if (layernames[docs[i].name]) {// fred
                         alert(docs[i].name);// fred
                        doc[i].name = newText;// fred
                    }// fred
                }// fred



                var operation = dropdown.selection.text;
                var newText = inputTextBox.text;
                var startNumber = parseInt(startingNumberInput.text);
                var padDigits = parseInt(paddingInput.text);
                var addNumbering = numberCheckbox.value;
                var positionBefore = numberPositionBefore.value;

                var undoGroup = app.documents.layers.add();
                undoGroup.name = "Batch Rename Layers";
                app.executeMenuCommand("group");


                for (var i = 0; i < selectedLayers.length; i++) {
                    var layer = selectedLayers[i];
                    var originalLayerName = layer.name;

                    if (operation === "Rename Layers") {
                        layer.name = newText;
                    } else if (operation === "Add Text Before") {
                        layer.name = newText + originalLayerName;
                    } else if (operation === "Add Text After") {
                        layer.name = originalLayerName + newText;
                    }

                    if (addNumbering) {
                        var numbering = getPaddedNumber(startNumber + i, autoPadCheckbox.value ? selectedLayers.length.toString().length : padDigits);
                        if (positionBefore) {
                            layer.name = numbering + layer.name;
                        } else {
                            layer.name = layer.name + numbering;
                        }
                    }
                }

                undoGroup.remove();
            }

            nameOMaticPalette.show();
        } catch (e) {
            alert(e.toString() + " - Function : " + arguments.callee.name + "\nLine : " + e.line.toString());

        }
    })(UIObj);
})(this);
