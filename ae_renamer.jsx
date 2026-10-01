// ========================================
// Batch Renamer Panel - v.052
// ========================================

#target aftereffects

// --- Close existing panel if it exists ---
if (typeof renamerPanel !== "undefined" && renamerPanel instanceof Window) {
    try { renamerPanel.close(); } catch(e) {}
    renamerPanel = undefined;
}

// --- Main panel builder ---
function batchRenamerPanel() {

    // State
    var dataSource = [];                 // Array of row objects
    var availableTokens = ["{#}"];       // Tokens shown to user
    var selectedFiles = [];              // When in file mode
    var dataHeaders = [];            // Stores headers from CSV/JSON for auto-template
    var lastAutoTemplate = "";           // Remember suggested filename format
    var numberPatternModified = false;   // Step 3: disable auto-fill when edited by user
    var filenamePatternModified = false; // Step 4: disable auto-fill when edited by user
    var previewIndex = 0;   // zero-based
    var previewCount = 0;  // total items available for preview




    // Create window
    renamerPanel = new Window("palette", "Batch Rename Utility", undefined, {resizeable:true});
    renamerPanel.orientation = "column";
    renamerPanel.alignChildren = ["fill","top"];
    renamerPanel.margins = 10;

    // ---------- Helpers ----------
    function arrayContains(arr, val) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === val) return true;
        }
        return false;
    }

    function trimES(s) {
        return String(s).replace(/^\s+|\s+$/g,'');
    }

    // escapeRegExp: safe for building regex from user pattern
    function escapeRegExp(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // Given a sample name string and a user pattern (e.g. "Comp{#} - v2 - Animation {#}"),
    // try to extract the digits that correspond to the FIRST {#} occurrence. Returns { number: "01", pad: 2, matched: true }
    // or null if no pattern match — caller must fallback.
    function detectNumber(sampleName, pattern) {
        sampleName = String(sampleName || "");
        pattern = String(pattern || "");

        if (pattern.indexOf("{#}") === -1) return null;

        // Escape everything then replace the escaped token with a capture
        var escaped = escapeRegExp(pattern);
        // replace the first escaped token occurrence
        escaped = escaped.replace("\\{\\#\\}", "(\\\\d+)");
        // NOTE: we used double-escaped digits in the replace to produce a valid RegExp (ExtendScript)
        // Now build regexp
        var re;
        try {
            re = new RegExp(escaped);
        } catch (e) {
            return null;
        }

        var m = sampleName.match(re);
        if (m && m[1]) {
            return { number: m[1], pad: m[1].length, matched: true };
        }
        return null;
    }

    // Unified numeric extraction
    function parseSampleNameNumber(sample) {
        sampleName = String(sampleName || "");
        var numberStart = -1, numberEnd = -1;
        for (var i = sampleName.length - 1; i >= 0; i--) {
            var c = sampleName.charAt(i);
            if (c >= "0" && c <= "9") {
                numberEnd = i + 1;
                while (i >= 0 && sampleName.charAt(i) >= "0" && sampleName.charAt(i) <= "9") i--;
                numberStart = i + 1;
                break;
            }
        }
        if (numberStart !== -1) {
            var numStr = sampleName.substring(numberStart, numberEnd);
            return {
                pre: sampleName.substring(0, numberStart),
                number: numStr,
                post: sampleName.substring(numberEnd),
                pad: numStr.length,
                matched: true,
                startIndex: numberStart,
                endIndex: numberEnd
            };
        }
        return {
            pre: sampleName,
            number: null,
            post: "",
            pad: 0,
            matched: false,
            startIndex: -1,
            endIndex: -1
        };
    }

    function detectNameToken(headers) {
        if (!headers || headers.length === 0) return "{#}";
        var normalized = [];
        for (var i = 0; i < headers.length; i++) normalized.push(String(headers[i]).toLowerCase().replace(/\s+/g,''));
        var firstIdx=-1, lastIdx=-1, nameIdx=-1;
        for (var i=0;i<normalized.length;i++){
            if(firstIdx===-1 && normalized[i].indexOf("first")!==-1) firstIdx=i;
            if(lastIdx===-1 && normalized[i].indexOf("last")!==-1) lastIdx=i;
            if(nameIdx===-1 && normalized[i].indexOf("name")!==-1) nameIdx=i;
        }
        if(firstIdx!==-1 && lastIdx!==-1) return "{"+headers[firstIdx]+"} {"+headers[lastIdx]+"}"; // use space by default
        if(nameIdx!==-1) return "{"+headers[nameIdx]+"}";
        return "{#}";
    }

    function buildFilenameTemplate(sampleName, headers) {
        var n = parseSampleNameNumber(sampleName);
        var token = detectNameToken(headers);
        var validSeps = ["_", "-", " "];
        var sep = "_";
        if (n.pre.length>0 && arrayContains(validSeps, n.pre.slice(-1))) sep = ""; // already has separator
        return n.pre + sep + token + n.post;
    }

    // ---------- UI: 1: Renaming Mode ----------
    var operationModeGroup = renamerPanel.add("panel", undefined, "1: Renaming Mode");
    operationModeGroup.orientation = "column";
    operationModeGroup.alignChildren = "fill";
    operationModeGroup.margins = 10;

    // Radio buttons
    // -------------
    var radioButtonCompMode = operationModeGroup.add("radiobutton", undefined, "Send named items to Queue");
    var radioButtonFileMode = operationModeGroup.add("radiobutton", undefined, "Rename existing files");
    radioButtonCompMode.value = true;

    // Comp/File selection
    // -------------------
    var itemSelectionGroup = operationModeGroup.add("group");
    itemSelectionGroup.orientation = "row";
    itemSelectionGroup.alignChildren = ["right","center"];
    itemSelectionGroup.alignment = ["fill","center"]; // stays single-row
    itemSelectionGroup.spacing = 10;

    // Left-aligned select button
    var itemSelectionButton = itemSelectionGroup.add("button", undefined, "Create Comps from Data");

    var itemSelectionInfo = itemSelectionGroup.add("statictext", undefined, "No comps selected");
    itemSelectionInfo.justify = "right";
    itemSelectionInfo.alignment = ["right","center"];
    itemSelectionInfo.preferredSize.width = 180;


    // Mode Switching
    // --------------
    radioButtonCompMode.onClick = radioButtonFileMode.onClick = function () {


        // Change the button text and info text based on mode selection
        if (radioButtonCompMode.value) {
            // COMP MODE
            itemSelectionButton.text = "Create Comps from Data";
            itemSelectionInfo.text = "No comps selected";
        } else {

            // FILE MODE
            itemSelectionButton.text = "Select Files to Rename...";
            itemSelectionInfo.text = "No files selected";
        }

        // Refresh the text based on actual selection
        updateSelectionInfo();

        // Change the inferred template based on comp vs files
        autoSuggestFilenameTemplate();

        // Enable or disable execution buttons
        updateExecutionButtonsState();
    };

    function updateSelectionInfo() {

        if (radioButtonCompMode.value) {
            // We are reaching here
            var comps = getSelectedComps();
            if (comps.length === 0) {
                itemSelectionInfo.text = "No comps selected";
                itemSelectionButton.enabled = false;
            } else {
                itemSelectionInfo.text = "Comps selected: " + comps.length;
                itemSelectionButton.enabled = true;
            }

        } else { // File mode
            // We are NOT reaching here
            if (selectedFiles.length === 0) {
                itemSelectionInfo.text = "No files selected";
                itemSelectionButton.enabled = true;
            } else {
                itemSelectionInfo.text = "Files selected: " + selectedFiles.length;
                itemSelectionButton.enabled = true;
            }
        }

        itemSelectionGroup.layout.layout(true);
    }

    // ---------- UI: 2: Data Source ----------
    var dataGroup = renamerPanel.add("panel", undefined, "2: Data Source");
    dataGroup.orientation = "column";
    dataGroup.alignChildren = "fill";
    dataGroup.margins = 10;

    var helperText = "Paste data here (CSV, TSV, or JSON)";
    var txtData = dataGroup.add("edittext", undefined, helperText, {multiline:true});
    txtData.preferredSize.height = 80;
    var dataHintActive = true;

    txtData.onActivate = function() {
        if(dataHintActive) { txtData.text = ""; dataHintActive = false; }
    };
    txtData.onDeactivate = function() {
        if(trimES(txtData.text) === "") { txtData.text = helperText; dataHintActive = true; }
    };

    var fileGroup = dataGroup.add("group");
    fileGroup.orientation = "row";
    fileGroup.alignChildren = "left";
    fileGroup.add("statictext", undefined, "Or:");
    var buttonChooseFile = fileGroup.add("button", undefined, "Choose Data File...");

    // ---------- Data info display ----------
    var dataInfo = fileGroup.add("statictext", undefined, "No data loaded");
    dataInfo.justify = "right";
    dataInfo.alignment = ["right","center"];
    dataInfo.preferredSize.width = 100; // keep it reasonably sized


    function parseData(text) {
        dataSource = [];
        availableTokens = ["{#}"];
        if(!text || text === helperText) return;

        try {
            var headers = [];

            if(text.match(/^\s*\{.*\}\s*$/)) {
                dataSource = JSON.parse(text) || [];
                if(dataSource.length > 0 && typeof dataSource[0] === "object") {
                    for(var key in dataSource[0]) if(dataSource[0].hasOwnProperty(key)) headers.push(key);
                }
            } else {
                var linesRaw = text.split(/\r?\n|\r/);
                var lines = [];
                for(var i=0;i<linesRaw.length;i++) if(linesRaw[i] && trimES(linesRaw[i])!=="") lines.push(linesRaw[i]);
                if(lines.length < 2) return;
                var delimiter = lines[0].indexOf("\t")!==-1 ? "\t" : ",";
                headers = lines[0].split(delimiter);
                for(var i=1;i<lines.length;i++){
                    var row = {};
                    var cols = lines[i].split(delimiter);
                    for(var j=0;j<headers.length;j++){
                        if(headers[j]) row[headers[j]] = cols[j] != undefined ? cols[j] : "";
                    }
                    dataSource.push(row);
                }
            }

            // Add a list of available header names to use in the template
            for(var h=0; h<headers.length; h++) availableTokens.push("{"+headers[h]+"}");
            labelFields.text = "Available tokens: " + availableTokens.join(", ");
            dataHeaders = headers.slice();

            // Confirm the number of rows detected in the data
            dataInfo.text = "Data Rows: " + dataSource.length;

            // When data loads, try to suggest a filename template using the current sample name
            if(!filenamePatternModified && dataHeaders.length > 0) {
                autoSuggestFilenameTemplate();
            }

        } catch(e) {
            alert("Failed to parse data: "+e.toString());
            dataInfo.text = "Unable to load data";
        }

        updatePreview(0);
    }

    buttonChooseFile.onClick = function() {
        var f = File.openDialog("Select CSV/TSV/JSON file");
        if(!f) return;
        f.open("r"); var contents = f.read(); f.close();
        txtData.text = contents;
        dataHintActive = false;
        parseData(contents);
    };

    // ---------- UI: 3: Numbering Pattern ----------
    var groupPattern = renamerPanel.add("panel", undefined, "3: Numbering Pattern");
    groupPattern.orientation = "column";
    groupPattern.alignChildren = "fill";
    groupPattern.margins = 10;

    var numberPatternHint = groupPattern.add("statictext", undefined, "Use {#} to identify the number pattern that will be replaced.");

    var txtPattern = groupPattern.add("edittext", undefined, "");
    txtPattern.helpTip = "Use {#} to identify the number that will be replaced";
    txtPattern.preferredSize.height = 25;

    txtPattern.onActivate = function() {
        if (!numberPatternModified && groupPattern.text.indexOf("(Autodetected)")!==-1)
            groupPattern.text = "3: Numbering Pattern";
    };

    txtPattern.onChanging = function() {
        numberPatternModified = true;
        updatePreview(0);
    };

    // ---------- UI: 4: Filename Template ----------
    var groupTemplate = renamerPanel.add("panel", undefined, "4: Filename Template");
    groupTemplate.orientation = "column";
    groupTemplate.alignChildren = "fill";
    groupTemplate.margins = 10;

    var labelFields = groupTemplate.add("statictext", undefined, "Available fields: {#}");
    labelFields.justify = "left";

    var txtTemplate = groupTemplate.add("edittext", undefined, "{#}");
    txtTemplate.preferredSize.height = 25;

    txtTemplate.onActivate = function() {
        if (!filenamePatternModified && groupTemplate.text.indexOf("(Autodetected)")!==-1)
            groupTemplate.text = "4: Filename Template";
    };
    txtTemplate.onChanging = function() {
        if(txtTemplate.text !== lastAutoTemplate) filenamePatternModified = true;
        updatePreview(0);
    };


    // Preview
    var groupPreview = groupTemplate.add("group");
    groupPreview.orientation = "row";
    groupPreview.alignChildren = ["fill","center"];

    // ---------- Preview Navigation ----------
    var grpPreviewNav = groupTemplate.add("group");
    grpPreviewNav.orientation = "row";
    grpPreviewNav.alignChildren = ["center","center"];
    grpPreviewNav.spacing = 6;

    // "<" button
    var btnPrev = grpPreviewNav.add("button", undefined, "<");
    btnPrev.preferredSize.width = 25;

    // Editable index field
    var txtPreviewIndex = grpPreviewNav.add("edittext", undefined, "1");
    txtPreviewIndex.preferredSize.width = 30;
    txtPreviewIndex.justify = "center";

    // "of N" label
    var lblPreviewOf = grpPreviewNav.add("statictext", undefined, "of 0");

    // ">" button
    var btnNext = grpPreviewNav.add("button", undefined, ">");
    btnNext.preferredSize.width = 25;
    var labelPreview = groupPreview.add("statictext", undefined, "");
    labelPreview.alignment = ["fill","center"];
    labelPreview.preferredSize.width = 300;


    // ---------- UI: 5: Filename Conflicts ----------
    var groupConflicts = renamerPanel.add("panel", undefined, "5: Filename Conflicts");
    groupConflicts.orientation = "column";
    groupConflicts.alignChildren = "left";
    groupConflicts.margins = 0;

    var radioButtonHalt = groupConflicts.add("radiobutton", undefined, "Halt on conflict");
    var radioButtonSkip = groupConflicts.add("radiobutton", undefined, "Skip existing items");
    var radioButtonKeep = groupConflicts.add("radiobutton", undefined, "Keep both");
    var radioButtonOverwrite = groupConflicts.add("radiobutton", undefined, "Overwrite existing files");

    radioButtonHalt.value = true; // SAFE DEFAULT



    function clampPreviewIndex(i) {
        if (i < 0) return 0;
        if (i >= previewCount) return previewCount - 1;
        return i;
    }

    function updatePreviewNavigationUI() {
        // Update index field (1-based for humans)
        txtPreviewIndex.text = (previewIndex + 1).toString();

        // Update total
        lblPreviewOf.text = "of " + previewCount;

        // Enable / disable arrows
        btnPrev.enabled = previewIndex > 0;
        btnNext.enabled = previewIndex < previewCount - 1;
    }

    btnPrev.onClick = function () {
        updatePreview(previewIndex - 1);
    };

    btnNext.onClick = function () {
        updatePreview(previewIndex + 1);
    };

    function commitPreviewIndexFromField() {
        var n = parseInt(txtPreviewIndex.text, 10);
        if (isNaN(n)) {
            updatePreviewNavigationUI(); // revert
            return;
        }

        // Convert to zero-based
        updatePreview(n - 1);
    }

    txtPreviewIndex.onDeactivate = commitPreviewIndexFromField;
    txtPreviewIndex.onChange = commitPreviewIndexFromField; // works in some AE versions



    // ---------- Selection helpers ----------
    function getSelectedComps() {
        var sel = app.project.selection || [];
        var out = [];
        for (var i=0;i<sel.length;i++){
            if (sel[i] instanceof CompItem) out.push(sel[i]);
        }
        return out;
    }

    function getItemsArrayForProcessing() {
        if (radioButtonFileMode && radioButtonFileMode.value && selectedFiles && selectedFiles.length>0) return selectedFiles;
        return getSelectedComps();
    }

    // ---------- getSampleNameAt ----------
    function getSampleNameAt(idx) {
        var inFileMode = radioButtonFileMode && radioButtonFileMode.value;
        if(inFileMode) {
            if(selectedFiles && selectedFiles.length>idx) {
                try { return decodeURI(selectedFiles[idx].name); } catch(e) { return selectedFiles[idx].name; }
            } else if(selectedFiles && selectedFiles.length>0) {
                try { return decodeURI(selectedFiles[0].name); } catch(e) { return selectedFiles[0].name; }
            } else return "Sample01";
        } else {
            var comps = getSelectedComps();
            if(comps && comps.length>idx) return comps[idx].name || "Sample01";
            if(comps && comps.length>0) return comps[0].name || "Sample01";
            return "Sample01";
        }
    }

    // ---------- Preview builder ----------
    function updatePreview(index) {
        if (index === undefined) index = previewIndex;

        var results = generateFilenames();
        previewCount = results.length;

        previewIndex = clampPreviewIndex(index);

        if (previewCount === 0) {
            labelPreview.text = "No preview available";
            updatePreviewNavigationUI();
            return;
        }

        var r = results[previewIndex];

        labelPreview.text = "Preview: " + r.after;

        updatePreviewNavigationUI();
    }



    // ---------- Auto-suggest filename template ----------
    function autoSuggestFilenameTemplate() {
        if (filenamePatternModified) return; // user already edited

        var sample = getSampleNameAt(0);
        if (!sample) return;

        var token = "{#}"; // default token

        // Prefer first+last or name fields if headers exist
        if (dataHeaders && dataHeaders.length > 0) {
            var firstIdx = -1, lastIdx = -1, nameIdx = -1;
            for (var i = 0; i < dataHeaders.length; i++) {
                var h = String(dataHeaders[i]).toLowerCase().replace(/\s+/g,"");
                if(firstIdx===-1 && h.indexOf("first")!==-1) firstIdx = i;
                if(lastIdx===-1 && h.indexOf("last")!==-1) lastIdx = i;
                if(nameIdx===-1 && h.indexOf("name")!==-1) nameIdx = i;
            }
            if(firstIdx!==-1 && lastIdx!==-1) token = "{"+dataHeaders[firstIdx]+"} {"+dataHeaders[lastIdx]+"}";
            else if(nameIdx!==-1) token = "{"+dataHeaders[nameIdx]+"}";
        }

        // Parse sample name to find last numeric group
        var parsed = parseSampleNameNumber(sample);
        var sep = "_";
        var validSeps = ["_", "-", " "];

        if(parsed.number) {
            if(parsed.pre.length>0 && arrayContains(validSeps, parsed.pre.slice(-1))) sep = "";
            txtTemplate.text = parsed.pre + sep + token + parsed.post;
        } else {
            var lastChar = sample.slice(-1);
            var sep2 = (["_","-"," "].indexOf(lastChar)!==-1) ? "" : " ";
            txtTemplate.text = sample + sep2 + token;
        }

        lastAutoTemplate = txtTemplate.text;
        groupTemplate.text = "4: Filename Template (Autodetected)";
        filenamePatternModified = false;

        updatePreview(0);
    }


    // ---------- Core: Generate Filenames ----------
    function generateFilenames() {
        var results = [];
        var items = getItemsArrayForProcessing();
        if(!items || items.length === 0) return results;

        for(var idx=0; idx<items.length; idx++){
            var sample = getSampleNameAt(idx);
            if(!sample) sample = "Item" + (idx+1);

            // 1) try to extract number from user-specified pattern (if provided)
            var numberObj = null;
            if(txtPattern && txtPattern.text && txtPattern.text.indexOf("{#}") !== -1) {
                numberObj = detectNumber(sample, txtPattern.text);
            }
            // 2) fallback to last numeric group
            if(!numberObj) numberObj = parseSampleNameNumber(sample);
            // 3) fallback to index-based
            if(!numberObj) {
                var def = ("0" + (idx+1)).slice(-2);
                numberObj = { number: def, pad: def.length, matched: false };
            }

            var formattedNumber = numberObj.number;

            // Build template replacement
            var tmpl = txtTemplate.text.replace(/\{#\}/g, formattedNumber);

            // Replace data tokens if present in dataSource
            var row = dataSource[idx] || {};
            for(var k in row) {
                if(row.hasOwnProperty(k)) {
                    var re = new RegExp("\\{" + escapeRegExp(k) + "\\}", "g");
                    tmpl = tmpl.replace(re, row[k]);
                }
            }

            // extension for preview
            var ext = ".ext";
            if(radioButtonFileMode && radioButtonFileMode.value && selectedFiles.length>0) {
                try {
                    var f = selectedFiles[idx] || selectedFiles[0];
                    var parts = (f.name || "").split(".");
                    ext = parts.length>1 ? ("." + parts.pop()) : "";
                } catch(e) { ext = ""; }
            }

            results.push({ before: sample, after: tmpl + ext, number: formattedNumber });
        }

        return results;
    }

    // ---------- Core: apply renaming (mutating) ----------
    function applyRenaming(results) {
        if(!results || results.length === 0) return;

        // If queue mode, add comps to render queue first (if not already present)
        if(radioButtonCompMode && radioButtonCompMode.value) {
            var comps = getSelectedComps();
            for(var c=0;c<comps.length;c++){
                var comp = comps[c];
                var exists = false;
                for(var j=1;j<=app.project.renderQueue.numItems;j++){
                    if(app.project.renderQueue.item(j).comp == comp) { exists = true; break; }
                }
                if(!exists) app.project.renderQueue.items.add(comp);
            }
        }

        // Apply renaming
        for(var i=0;i<results.length;i++){
            var before = results[i].before;
            var after = results[i].after;

            if(radioButtonFileMode && radioButtonFileMode.value) {
                // FILE MODE
                var fileObj = selectedFiles[i] || selectedFiles[0];
                if(!fileObj || !fileObj.exists) continue;

                var folder = fileObj.parent;
                var targetName = after;
                var targetFile = File(folder.fsName + "/" + targetName);

                if(targetFile.exists) {
                    if(radioButtonHalt && radioButtonHalt.value) { alert("Name conflict detected: " + targetName); return; }
                    if(radioButtonSkip && radioButtonSkip.value) { continue; }
                    if(radioButtonKeep && radioButtonKeep.value) {
                        var base = targetName.replace(/(\.[^.]*)$/,"");
                        var extMatch = targetName.match(/(\.[^.]*)$/);
                        var ext = extMatch ? extMatch[0] : "";
                        var k = 2;
                        while(File(folder.fsName + "/" + base + "_" + k + ext).exists) k++;
                        targetName = base + "_" + k + ext;
                    }
                    // overwrite -> proceed
                }

                try {
                    fileObj.rename(targetName);
                } catch(e) {
                    alert("Failed to rename " + fileObj.name + ": " + e.toString());
                }

            } else {
                // RENDER QUEUE MODE: set output module paths for matching comps
                var comps = getSelectedComps();
                var comp = comps[i] || comps[0];
                if(!comp) continue;

                for(var r = 1; r <= app.project.renderQueue.numItems; r++){
                    var rq = app.project.renderQueue.item(r);
                    if(rq.comp == comp) {
                        try {
                            var om = rq.outputModule(1);
                            var outFolder = om.file && om.file.parent ? om.file.parent : Folder.myDocuments;
                            var desiredBase = after.replace(/\.[^\.]+$/, ""); // strip preview ext if present
                            var currentFile = om.file;
                            var extension = "";
                            if(currentFile && currentFile.name && currentFile.name.indexOf(".") !== -1) extension = currentFile.name.substr(currentFile.name.lastIndexOf("."));
                            var newPath = (outFolder.fsName ? outFolder.fsName : Folder.myDocuments.fsName) + "/" + desiredBase + extension;
                            om.file = new File(newPath);
                        } catch(e) {
                            alert("Failed to update output module for comp '" + comp.name + "': " + e.toString());
                        }
                        break;
                    }
                }
            }
        } // for results
    }

    function showReportWindow(results, isDryRun) {

        try {
            var title = isDryRun ? "Dry Run Report" : "Renaming Report";
            var reportLines = [];

            var reportDialog = new Window("dialog", title);
            reportDialog.orientation = "column";
            reportDialog.alignChildren = ["fill", "top"];
            reportDialog.margins = 15;

            if (isDryRun) {
                reportLines.push("DRY RUN REPORT");
                reportLines.push("Preview only, no real action taken.");
                reportLines.push("------------------------------------\n");
            } else {
                reportLines.push("RENAMING REPORT");
                reportLines.push("The following changes were made.");
                reportLines.push("------------------------------------\n");
            }

            for (var i = 0; i < results.length; i++) {
                var r = results[i];
                reportLines.push(r.before + "   →   " + r.after);
            }

            // Report text
            var reportText = reportDialog.add("edittext", undefined, "", { multiline: true, scrolling: true });
            reportText.preferredSize = [600, 300];

            reportText.text = reportLines.join("\n");

            var okButton = reportDialog.add("button", undefined, "OK");

        } catch (err) {
            alert(err);
        }
        reportDialog.show();
    }

    // ---------- Execution Buttons ----------
    var groupExecWrap = renamerPanel.add("group");
    groupExecWrap.orientation = "row";
    groupExecWrap.alignChildren = ["fill","top"];
    var groupExec = groupExecWrap.add("group");
    groupExec.orientation = "row";
    groupExec.alignment = ["right","top"];
    groupExec.spacing = 10;

    var buttonDryRun = groupExec.add("button", undefined, "Dry Run (Report only)");
    var buttonRenameNow = groupExec.add("button", undefined, "Rename Now!");

    // Disable buttons by default
    buttonDryRun.enabled = false;
    buttonRenameNow.enabled = false;

    // Helper function to enable/disable the execution buttons
    function updateExecutionButtonsState() {
        var hasItems = getItemsArrayForProcessing().length > 0;
        var hasData = dataSource && dataSource.length > 0;
        var enable = hasItems && hasData;
        buttonDryRun.enabled = enable;
        buttonRenameNow.enabled = enable;
    }

    // ---------- Dry Run handler ----------
    buttonDryRun.onClick = function() {
        var results = generateFilenames();
        showReportWindow(results, true); // Dry Run mode is TRUE
    }

    // ---------- Rename Now handler ----------
    buttonRenameNow.onClick = function() {
        var results = generateFilenames();
        applyRenaming(results);
        showReportWindow(results, false); // Dry Run mode is FALSE
    };

    itemSelectionButton.onClick = function() {
        // If we are in file mode, the button opens a file selection dialog
        if (radioButtonFileMode) {
            selectedFiles = [];
            var f = File.openDialog("Select files (or cancel to select a folder)", "", true);
            if(f) {
                if(f instanceof Array) selectedFiles = f;
                else if(f instanceof File) selectedFiles = [f];
            } else {
                var folder = Folder.selectDialog("Select a folder containing files");
                if(folder) {
                    var all = folder.getFiles();
                    for(var i=0;i<all.length;i++) if(all[i] instanceof File) selectedFiles.push(all[i]);
                } else return;
            }
            autoSuggestFilenameTemplate();
            updatePreview(0);
            updateExecutionButtonsState();
        } else {
            // Otherwise, clicking the button duplicates a copy
            // of the selected comp for each item in the data source

        }
    };

    txtData.onChange = function() {
        parseData(txtData.text);
        updateExecutionButtonsState();
    };

    buttonChooseFile.onClick = function() {
        var f = File.openDialog("Select CSV/TSV/JSON file");
        if(!f) return;
        f.open("r"); var contents = f.read(); f.close();
        txtData.text = contents;
        dataHintActive = false;
        parseData(contents);
        updateExecutionButtonsState();
    };

    // ---------- Initialize UI on open ----------
    var sampleName = getSampleNameAt(0) || "Sample01";

    // Numbering pattern auto-detect
    if(!numberPatternModified) {
        var nMatch = sampleName.match(/(\d+)/);
        if(nMatch) txtPattern.text = sampleName.substring(0,nMatch.index)+"{#}"+sampleName.substring(nMatch.index+nMatch[0].length);
        else txtPattern.text = sampleName;
        groupPattern.text = "3: Numbering Pattern (Autodetected)";
    }

    // Filename template auto-suggest if we already have headers
    if(!filenamePatternModified && dataHeaders.length>0) {
        autoSuggestFilenameTemplate();
    }

    labelFields.text = "Available tokens: " + availableTokens.join(", ");
    updatePreview(0);

    updateSelectionInfo();
    updateExecutionButtonsState();


    renamerPanel.center();
    renamerPanel.show();
}

// --- Launch ---
batchRenamerPanel();
