// Todo: Abstract for non-ExtDev uses?

var EXPORTED_SYMBOLS = [
    'getRDFService',
    'releaseRDFService',
    'saveHistoryItems',
    'loadHistoryItems',
    'saveSingleItem',
    'loadSingleItem'
];

var Cc = Components.classes, Ci = Components.interfaces;
const EXTENSIONDEV_NS = "http://ted.mielczarek.org/code/mozilla/extensiondev#";


/*
 * Append the extensiondev namespace to x.
 */
function ED_NS (x) {
    return EXTENSIONDEV_NS + x;
}

var gRDF = null;

function getRDFService () {
    if (!gRDF) {
        gRDF = Cc['@mozilla.org/rdf/rdf-service;1'].getService(Ci.nsIRDFService);
    }
}

function releaseRDFService () {
    gRDF = null;
}

function emptySeq (ds, seq, propname) {
    getRDFService();
    var resources = [];
    var it = seq.GetElements();
    var prop = gRDF.GetResource(propname);
    // blow away all the value assertions
    while (it.hasMoreElements()) {
        var res = it.getNext();
        resources.push(res);
        var val = ds.GetTarget(res, prop, true);
        ds.Unassert(res, prop, val, true);
    }
    // now remove all the elements from the seq
    for (var i=0; i < resources.length; i++) {
        seq.RemoveElement(resources[i], false);
        resources[i] = null;
    }
}

function getExtensionDevRDFFileDS (ios) {
    // get the file in our profile directory
    var file = Cc['@mozilla.org/file/directory_service;1'].createInstance(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
    // try to migrate our old file if it exists
    var old = file.clone();
    old.append("extensions");
    old.append("{75739dec-72db-4020-aa9a-6afa6744759b}");
    old.append("extensiondev.rdf");
    if (old.exists()) {
        old.moveTo(file, "extensiondev.rdf");
    }
    file.append("extensiondev.rdf");
    var fileURI = ios.newFileURI(file);
    return gRDF.GetDataSourceBlocking(fileURI.spec);
}

function saveHistoryItems (list, seqpropname, seqitemname) {
    // get the RDF service/utils/ioservice
    var rdfContainerUtils = Cc['@mozilla.org/rdf/container-utils;1'].getService(Ci.nsIRDFContainerUtils);
    var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);

    // load the datasource
    var ds = getExtensionDevRDFFileDS(ios);

    // make the Seq to hold our history
    var jsh = gRDF.GetResource(seqpropname);
    var seq = rdfContainerUtils.MakeSeq(ds, jsh);
    // make sure it's empty first
    if (!rdfContainerUtils.IsEmpty(ds, jsh)) {
        emptySeq(ds, seq, seqitemname);
    }

    for (var i=0; i < list.length; i++) {
        // add each path item
        var res = gRDF.GetAnonymousResource();
        var prop = gRDF.GetResource(seqitemname);
        var value = gRDF.GetLiteral(list[i]);
        // assert the value
        ds.Assert(res, prop, value, true);
        // put it in the Seq
        seq.AppendElement(res);
    }
    // write it to the file
    ds.QueryInterface(Ci.nsIRDFRemoteDataSource);
    ds.Flush();
    ds = null;
}

function loadHistoryItems (seqpropname, seqitemname) {
    getRDFService();
    var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
    var rdfContainerUtils = Cc['@mozilla.org/rdf/container-utils;1'].getService(Ci.nsIRDFContainerUtils);
    var ds = getExtensionDevRDFFileDS(ios);
    // make the Seq to hold our history
    // "/jsshell/history"
    var jsh = gRDF.GetResource(seqpropname);
    var seq = rdfContainerUtils.MakeSeq(ds, jsh);
    var items = [];
    var it = seq.GetElements();
    // "http://ted.mielczarek.org/code/mozilla/extensiondev/jsshell/historyitem"
    var prop = gRDF.GetResource(seqitemname);
    // get all the value assertions
    while (it.hasMoreElements()) {
        var res = it.getNext();
        var lit = ds.GetTarget(res, prop, true);
        try {
            lit.QueryInterface(Ci.nsIRDFLiteral);
            items.push(lit.Value);
        }
        catch(ex) { dump(ex + "\n"); }
    }
    return items;
}

function saveSingleItem (shortname, value) {
    getRDFService();
    var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
    /* var ds = */ getExtensionDevRDFFileDS(ios);
    /* var res = */ gRDF.GetResource(ED_NS(shortname));
    /* var prop = */ gRDF.GetResource(ED_NS("saveddata"));
    value = gRDF.GetLiteral(value.toString());
    //TODO: unassert previous value
    //ds.Assert(res, prop, value, true);
    console.log(value);
}

function loadSingleItem (shortname) {
    getRDFService();
    var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
    var ds = getExtensionDevRDFFileDS(ios);
    var res = gRDF.GetResource(ED_NS(shortname));
    var prop = gRDF.GetResource(ED_NS("saveddata"));
    var lit = ds.GetTarget(res, prop, true);
    try {
        lit.QueryInterface(Ci.nsIRDFLiteral);
        return lit.Value;
    }
    catch(ex) {
        return null;
    }
}
