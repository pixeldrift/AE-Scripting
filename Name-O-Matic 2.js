//@target illustrator
//@script "Name-O-Matic"
//@targetengine "main"

var nameOMaticPalette = new Window("palette", "Name-O-Matic");
var renameButton = nameOMaticPalette.add("button", undefined, "Rename Layers");
var doc = app.activeDocument;

renameButton.onClick = function() {
    alert("Here");
    var messenger = new BridgeTalk;
    bt.target = "illustrator";
    bt.body = "\n" + "alert(app.activeDocument.layers[i].name);\n" + "app.refresh();\n";
    bt.onResult = function(msg) {
        alert("Now Here");
        var myResult = msg.body;
        doSomethingNow( myResult );
    }
    bt.onError = function(msg) {
       alert("Error: " + msg.body);
    }

    messenger.send();
}

doSomethingNow = function( result ) {

  alert("First layer is named: " + result);
}


nameOMaticPalette.show();


