function newPanel(thisObj) {
       
    // MAIN PALETTE
    // ===========

    // Check if our panel exists already and re-use it if so.
    var mainPalette = (thisObj instanceof Panel) ? thisObj : new Window("palette", "SnapDragon Script", undefined, {resizeable: true});
        mainPalette.text = "🐉 SnapDragon v0.10";
        mainPalette.orientation = "column";
        mainPalette.alignChildren = ["lcenter","top"];
        mainPalette.spacing = 10;
        mainPalette.margins = 16;
        mainPalette.preferredSize.width = 200;

        mainPalette.onResizing = mainPalette.onResize = function () {
            this.layout.resize();
        }

    var targetLayerLabel = mainPalette.add("statictext", undefined, undefined, {name: "targetLayerLabel"});
        targetLayerLabel.text = "Target Layer:";
        targetLayerLabel.alignment = ["left","top"];

    // TARGET GROUP
    // ===========
    var targetGroup = mainPalette.add("group", undefined, {name: "targetGroup"});
        targetGroup.preferredSize.width = 200;
        targetGroup.orientation = "row";
        targetGroup.alignChildren = ["left","top"];
        targetGroup.spacing = 10;
        targetGroup.margins = 0;
        targetGroup.alignment = ["fill","top"];

    var layersDropdown = targetGroup.add("dropdownlist", undefined, undefined, {name: "layersDropdown"});
        layersDropdown.preferredSize.width = 150;
        populateLayersDropdown();

    var refreshButton = targetGroup.add("button", undefined, undefined, {name: "refreshButton"});
        refreshButton.preferredSize.width = 30;
        refreshButton.helpTip = "Refresh layers list.";
        refreshButton.text = "↻";


    // DIVIDER
    // ============
    var divider1 = mainPalette.add("panel", undefined, undefined, {name: "divider1"});
        divider1.alignment = "fill";

    // FILTER GROUP
    // ===========
    var FilterGroup = mainPalette.add("group", undefined, {name: "FilterGroup"});
        FilterGroup.preferredSize.width = 200;
        FilterGroup.orientation = "row";
        FilterGroup.alignChildren = ["left","center"];
        FilterGroup.spacing = 10;
        FilterGroup.margins = 0;

    var filterLabel = FilterGroup.add("statictext", undefined, undefined, {name: "filterLabel"});
        filterLabel.text = "Layer Filter:";
        filterLabel.justify = "right";

    var layerFilterLabel = FilterGroup.add('edittext {properties: {name: "layerFilterLabel"}}');
        layerFilterLabel.helpTip = "Only snap to layers with included text in their name.";
        layerFilterLabel.preferredSize.width = 120;

    // DIVIDER
    // ============
    var divider2 = mainPalette.add("panel", undefined, undefined, {name: "divider2"});
        divider2.alignment = "fill";

    // TOLERANCE GROUP
    // ==============
    var toleranceGroup = mainPalette.add("group", undefined, {name: "toleranceGroup"});
        toleranceGroup.preferredSize.width = 200;
        toleranceGroup.orientation = "column";
        toleranceGroup.alignChildren = ["left","center"];
        toleranceGroup.spacing = 10;
        toleranceGroup.margins = 0;

    var seekToleranceLabel = toleranceGroup.add("statictext", undefined, undefined, {name: "seekToleranceLabel"});
        seekToleranceLabel.text = "Seek Tolerance:";

    // X TOLERANCE GROUP
    // ===============
    var xToleranceGroup = toleranceGroup.add("group", undefined, {name: "xToleranceGroup"});
        xToleranceGroup.preferredSize.width = 200;
        xToleranceGroup.orientation = "row";
        xToleranceGroup.alignChildren = ["right","center"];
        xToleranceGroup.spacing = 10;
        xToleranceGroup.margins = 0;

    var xToleranceLabel = xToleranceGroup.add("statictext", undefined, undefined, {name: "xToleranceLabel"});
        xToleranceLabel.text = "Column (W):";

    var xToleranceSlider = xToleranceGroup.add("slider", undefined, undefined, undefined, undefined, {name: "xToleranceSlider"});
        xToleranceSlider.helpTip = "Horizontal width of column match.";
        xToleranceSlider.minvalue = 0;
        xToleranceSlider.maxvalue = 100;
        xToleranceSlider.value = 50;
        xToleranceSlider.preferredSize.width = 80;
        xToleranceSlider.onChange = function() {
            xToleranceText.text = Math.round(xToleranceSlider.value);
        }

    var xToleranceText = xToleranceGroup.add('edittext {justify: "right", properties: {name: "xToleranceText"}}');
        xToleranceText.text = xToleranceSlider.value;
        xToleranceText.preferredSize.width = 35;
        xToleranceText.onChange = function() {
            xToleranceSlider.value = xToleranceText.text;
        }
        

    // Y TOLERANCE GROUP
    // ===============
    var yToleranceGroup = toleranceGroup.add("group", undefined, {name: "yToleranceGroup"});
        yToleranceGroup.preferredSize.width = 200;
        yToleranceGroup.orientation = "row";
        yToleranceGroup.alignChildren = ["right","center"];
        yToleranceGroup.spacing = 10;
        yToleranceGroup.margins = 0;

    var yToleranceLabel = yToleranceGroup.add("statictext", undefined, undefined, {name: "yToleranceLabel"});
        yToleranceLabel.text = "Row (H):";

    var yToleranceSlider = yToleranceGroup.add("slider", undefined, undefined, undefined, undefined, {name: "yToleranceSlider"});
        yToleranceSlider.helpTip = "Vertical height of row match.";
        yToleranceSlider.minvalue = 0;
        yToleranceSlider.maxvalue = 100;
        yToleranceSlider.value = 50;
        yToleranceSlider.preferredSize.width = 80;
        yToleranceSlider.onChange = function() {
            yToleranceText.text = Math.round(yToleranceSlider.value);
        }

    var yToleranceText = yToleranceGroup.add('edittext {justify: "right", properties: {name: "yToleranceText"}}');
        yToleranceText.text = yToleranceSlider.value;
        yToleranceText.preferredSize.width = 35;
        yToleranceText.onChange = function() {
            yToleranceSlider.value = yToleranceText.text;
        }

    // DIVIDER
    // ============
    var divider3 = mainPalette.add("panel", undefined, undefined, {name: "divider3"});
        divider3.alignment = "fill";

    // ARROW GROUP
    // ==========
    var arrowGroup = mainPalette.add("group", undefined, {name: "arrowGroup"});
        arrowGroup.orientation = "row";
        arrowGroup.alignChildren = ["left","center"];
        arrowGroup.spacing = 10;
        arrowGroup.margins = 0;

    var upButton = arrowGroup.add("button", undefined, undefined, {name: "upButton"});
        upButton.preferredSize.width = 30;
        upButton.helpTip = "Snap to previous layer in column.";
        upButton.text = "↑";

    var downButton = arrowGroup.add("button", undefined, undefined, {name: "downButton"});
        downButton.preferredSize.width = 30
        downButton.helpTip = "Snap to next layer in column.";
        downButton.text = "↓";

    var divider4 = arrowGroup.add("panel", undefined, undefined, {name: "divider4"});
        divider4.alignment = "fill";

    var previousButton = arrowGroup.add("button", undefined, undefined, {name: "previousButton"});
        previousButton.preferredSize.width = 30;
        previousButton.helpTip = "Snap to previous layer in row.";
        previousButton.text = "←";

    var nextButton = arrowGroup.add("button", undefined, undefined, {name: "nextButton"});
        nextButton.preferredSize.width = 30;
        nextButton.helpTip = "Snap to next layer in row.";
        nextButton.text = "→";
        nextButton.onClick = function() {
            selectLayerFromDropdown();
        }

    // DIVIDER
    // ============
    var divider5 = mainPalette.add("panel", undefined, undefined, {name: "divider5"});
        divider5.alignment = "fill";

    // EXTRAS GROUP
    // ===========
    var extrasGroup = mainPalette.add("group", undefined, {name: "extrasGroup"});
        extrasGroup.orientation = "row";
        extrasGroup.alignChildren = ["left","center"];
        extrasGroup.spacing = 10;
        extrasGroup.margins = 0;

    var previousKeyframeButton = extrasGroup.add("button", undefined, undefined, {name: "previousKeyframeButton"});
        previousKeyframeButton.preferredSize.width = 30;
        previousKeyframeButton.helpTip = "Snap to previous keyframe.";
        previousKeyframeButton.text = "⤝";

    var nextKeyframeButton = extrasGroup.add("button", undefined, undefined, {name: "nextKeyframeButton"});
        nextKeyframeButton.preferredSize.width = 30;
        nextKeyframeButton.helpTip = "Snap to next kefyrame.";
        nextKeyframeButton.text = "⤞";

    var widthButton = extrasGroup.add("button", undefined, undefined, {name: "widthButton"});
        widthButton.preferredSize.width = 30;
        widthButton.helpTip = "Size to width.";
        widthButton.text = "↔︎";

    var divider6 = extrasGroup.add("panel", undefined, undefined, {name: "divider6"});
        divider6.alignment = "fill";

    var carriageReturnButton = extrasGroup.add("button", undefined, undefined, {name: "carriageReturnButton"});
        carriageReturnButton.preferredSize.width = 30;
        carriageReturnButton.helpTip = "Carriage Return. Snap to first item of next row.";
        carriageReturnButton.text = "↵";

    // DIVIDER
    // ============
    var divider7 = mainPalette.add("panel", undefined, undefined, {name: "divider7"});
        divider7.alignment = "fill";

    // HOME GROUP
    // =========
    var homeGroup = mainPalette.add("group", undefined, {name: "homeGroup"});
        homeGroup.orientation = "row";
        homeGroup.alignChildren = ["left","center"];
        homeGroup.spacing = 10;
        homeGroup.margins = 0;

    var topButton = homeGroup.add("button", undefined, undefined, {name: "topButton"});
        topButton.preferredSize.width = 30;
        topButton.helpTip = "Snap to first layer in column.";
        topButton.text = "⤒";

    var bottomButton = homeGroup.add("button", undefined, undefined, {name: "bottomButton"});
        bottomButton.preferredSize.width = 30;
        bottomButton.helpTip = "Snap to last layer in column.";
        bottomButton.text = "⤓";

    var divider8 = homeGroup.add("panel", undefined, undefined, {name: "divider8"});
        divider8.alignment = "fill";

    var startButton = homeGroup.add("button", undefined, undefined, {name: "startButton"});
        startButton.preferredSize.width = 30;
        startButton.helpTip = "Snap to first layer in row.";
        startButton.text = "⇤";

    var endButton = homeGroup.add("button", undefined, undefined, {name: "endButton"});
        endButton.preferredSize.width = 30;
        endButton.helpTip = "Snap to last layer in row.";
        endButton.text = "⇥";

    // DIVIDER
    // ============
    var divider9 = mainPalette.add("panel", undefined, undefined, {name: "divider9"});
        divider9.alignment = "fill";

    // ANCHOR GROUP
    // ===========
    var anchorGroup = mainPalette.add("group", undefined, {name: "anchorGroup"});
        anchorGroup.orientation = "column";
        anchorGroup.alignChildren = ["center","center"];
        anchorGroup.spacing = 10;
        anchorGroup.margins = 0;

    var statictext1 = anchorGroup.add("statictext", undefined, undefined, {name: "statictext1"});
        statictext1.text = "Snap Position A:";
        statictext1.justify = "center";

    // ANCHOR GROUP TOP
    // ==============
    var anchorGroupTop = anchorGroup.add("group", undefined, {name: "anchorGroupTop"});
        anchorGroupTop.orientation = "row";
        anchorGroupTop.alignChildren = ["left","center"];
        anchorGroupTop.spacing = 10;
        anchorGroupTop.margins = 0;

    var button1 = anchorGroupTop.add("button", undefined, undefined, {name: "button1"});
        button1.text = "↖";
        button1.preferredSize.width = 45;
        button1.preferredSize.height = 30;

    var button2 = anchorGroupTop.add("button", undefined, undefined, {name: "button2"});
        button2.text = "↑";
        button2.preferredSize.width = 45;
        button2.preferredSize.height = 30;

    var button3 = anchorGroupTop.add("button", undefined, undefined, {name: "button3"});
        button3.text = "↗";
        button3.preferredSize.width = 45;
        button3.preferredSize.height = 30;

    // ANCHOR GROUP MIDDLE
    // =================
    var anchorGroupMiddle = anchorGroup.add("group", undefined, {name: "anchorGroupMiddle"});
        anchorGroupMiddle.orientation = "row";
        anchorGroupMiddle.alignChildren = ["left","center"];
        anchorGroupMiddle.spacing = 10;
        anchorGroupMiddle.margins = 0;

    var button4 = anchorGroupMiddle.add("button", undefined, undefined, {name: "button4"});
        button4.text = "←";
        button4.preferredSize.width = 45;
        button4.preferredSize.height = 30;

    var button5 = anchorGroupMiddle.add("button", undefined, undefined, {name: "button5"});
        button5.text = "☉";
        button5.preferredSize.width = 45;
        button5.preferredSize.height = 30;

    var button6 = anchorGroupMiddle.add("button", undefined, undefined, {name: "button6"});
        button6.text = "→";
        button6.preferredSize.width = 45;
        button6.preferredSize.height = 30;

    // ANCHOR GROUP BOTTOM
    // =================
    var anchorGroupBottom = anchorGroup.add("group", undefined, {name: "anchorGroupBottom"});
        anchorGroupBottom.orientation = "row";
        anchorGroupBottom.alignChildren = ["left","center"];
        anchorGroupBottom.spacing = 10;
        anchorGroupBottom.margins = 0;

    var button7 = anchorGroupBottom.add("button", undefined, undefined, {name: "button7"});
        button7.text = "↙";
        button7.preferredSize.width = 45;
        button7.preferredSize.height = 30;

    var button8 = anchorGroupBottom.add("button", undefined, undefined, {name: "button8"});
        button8.text = "↓";
        button8.preferredSize.width = 45;
        button8.preferredSize.height = 30;

    var button9 = anchorGroupBottom.add("button", undefined, undefined, {name: "button9"});
        button9.text = "↘";
        button9.preferredSize.width = 45;
        button9.preferredSize.height = 30;

    // mainPalette
    // ============
    var divider10 = mainPalette.add("panel", undefined, undefined, {name: "divider10"});
        divider10.alignment = "fill";

    // ANCHOR GROUP RADIO
    // ================
    var anchorGroupRadio = mainPalette.add("group", undefined, {name: "anchorGroupRadio"});
        anchorGroupRadio.orientation = "column";
        anchorGroupRadio.alignChildren = ["center","center"];
        anchorGroupRadio.spacing = 10;
        anchorGroupRadio.margins = 0;

    var statictext2 = anchorGroupRadio.add("statictext", undefined, undefined, {name: "statictext2"});
        statictext2.text = "Snap Position B:";
        statictext2.justify = "center";

    // ANCHOR RADIO TOP ROW
    // =================
    var anchorRadioTopRow = anchorGroupRadio.add("group", undefined, {name: "anchorRadioTopRow"});
        anchorRadioTopRow.orientation = "row";
        anchorRadioTopRow.alignChildren = ["left","center"];
        anchorRadioTopRow.spacing = 10;
        anchorRadioTopRow.margins = 0;

    var anchorRadio1 = anchorRadioTopRow.add("radiobutton", undefined, undefined, {name: "anchorRadio1"});
    var anchorRadio2 = anchorRadioTopRow.add("radiobutton", undefined, undefined, {name: "anchorRadio2"});
    var anchorRadio3 = anchorRadioTopRow.add("radiobutton", undefined, undefined, {name: "anchorRadio3"});

    // ANCHOR RADIO MIDDLE ROW
    // ====================
    var anchorRadioMiddleRow = anchorGroupRadio.add("group", undefined, {name: "anchorRadioMiddleRow"});
        anchorRadioMiddleRow.orientation = "row";
        anchorRadioMiddleRow.alignChildren = ["left","center"];
        anchorRadioMiddleRow.spacing = 10;
        anchorRadioMiddleRow.margins = 0;

    var anchorRadio4 = anchorRadioMiddleRow.add("radiobutton", undefined, undefined, {name: "anchorRadio4"});
    var anchorRadio5 = anchorRadioMiddleRow.add("radiobutton", undefined, undefined, {name: "anchorRadio5"});
        anchorRadio5.value = true; // Default selection
    var anchorRadio6 = anchorRadioMiddleRow.add("radiobutton", undefined, undefined, {name: "anchorRadio6"});

    // ANCHOR RADIO BOTTOM ROW
    // ====================
    var anchorRadioBottomRow = anchorGroupRadio.add("group", undefined, {name: "anchorRadioBottomRow"});
        anchorRadioBottomRow.orientation = "row";
        anchorRadioBottomRow.alignChildren = ["left","center"];
        anchorRadioBottomRow.spacing = 10;
        anchorRadioBottomRow.margins = 0;

    var anchorRadio7 = anchorRadioBottomRow.add("radiobutton", undefined, undefined, {name: "anchorRadio7"});
    var anchorRadio8 = anchorRadioBottomRow.add("radiobutton", undefined, undefined, {name: "anchorRadio8"});
    var anchorRadio9 = anchorRadioBottomRow.add("radiobutton", undefined, undefined, {name: "anchorRadio9"});

    // DIVIDER
    // ============
    var divider11 = mainPalette.add("panel", undefined, undefined, {name: "divider11"});
        divider11.alignment = "fill";

    var miscGroup = mainPalette.add("group", undefined, undefined, {name: "miscGroup"});
    
        var helpButton = miscGroup.add("button", undefined, undefined, {name: "helpButton"});
            helpButton.helpTip = "Help";
            helpButton.text = "?";

        var holdKeyframeButton = miscGroup.add("button", undefined, undefined, {name: "holdKeyframeButton"});
            holdKeyframeButton.helpTip = "Toggle hold keyframe.";
            holdKeyframeButton.text = "⬥ /  ◨";


    // ============
    // FUNCTIONS
    // ============

    // Display our window to the screen.
    mainPalette instanceof Window ? (mainPalette.center(), mainPalette.show()) : (mainPalette.layout.layout(true), mainPalette.layout.resize());

    // Call the function to populate the dropdown list.

    refreshButton.onClick = populateLayersDropdown;

    function populateLayersDropdown() {
        // Get the current composition.
        var comp = app.project.activeItem;

        // Check if a composition is active.
        if (comp && comp instanceof CompItem) {
            
            while (layersDropdown.items.length > 0) {           
                layersDropdown.remove(0);
            }

            layersDropdown.add("item", "-Current Selection-");
            // Populate the dropdown list with layer names prefaced by layer index numbers.
            for (var i = 1; i <= comp.layers.length; i++) {
                var layerName = i + ". " + comp.layers[i].name;
                layersDropdown.add("item", layerName);
            }

            layersDropdown.selection = 0;
        } else {
            alert("Open a composition..");
        }
    }

    function selectLayerFromDropdown() {
        // Get the current composition.
        var comp = app.project.activeItem;
    
        // Check if a composition is active.
        if (comp && comp instanceof CompItem) {
            // Get the selected index from the dropdown list.
            var selectedIndex = layersDropdown.selection.index;
    
            // Check if an item is selected in the dropdown list.
            if (selectedIndex > 0 && selectedIndex <= comp.layers.length) {
                // Select the corresponding layer.
                comp.layers[selectedIndex].selected = true;
            }
        } else {
            alert("Open a composition.");
        }
    }

}

// Run our script.
newPanel(this);