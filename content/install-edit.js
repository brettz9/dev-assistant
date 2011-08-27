//TODO: see if I can include this stuff from nsExtensionManager.js
// instead of copy/pasting it all.

(function () {

var Cc = Components.classes, Ci = Components.interfaces, module = Components.utils['import'];
var Extension = {}, Basics = {};
module('resource://extensiondev/Extension.js', Extension);
module('resource://extensiondev/BasicLanguageUtils.js', Basics);


var prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getDefaultBranch('');
var gInstallManifestFilename = null;
var gExtensionShortName = null;


/**
 * @private
 * @constant
 */
function $ (id) {
    return document.getElementById(id);
}

/**
 * @private
 * @constant
 */
function _setGUID () {
    try {
        var uuidGenerator = Cc['@mozilla.org/uuid-generator;1'].getService(Ci.nsIUUIDGenerator);
        var uuid = uuidGenerator.generateUUID().toString();
        $('id').value = uuid;
    }
    catch(ex) {
        dump('Error: ' + ex + '\n');
    }
}


/**
 * @private
 * @constant
 */
function _setTarget (id, minVer, maxVer) {
    var check = $(id);
    if (check == null) {
        return;
    }

    check.checked = true;
    var textboxes = check.parentNode.getElementsByTagName('textbox');
    for (var j=0; j < textboxes.length; j++) {
        var t = textboxes[j];
        if (t.id.match(/minver$/)) {
            t.value = minVer;
        }
        else if (t.id.match(/maxver$/)) {
            t.value = maxVer;
        }
    }
}

/**
 * @private
 * @constant
 */
// From https://developer.mozilla.org/en/Using_nsIXULAppInfo (MIT license)
function _getAppInfo (prop) {
    var info;
    if ('@mozilla.org/xre/app-info;1' in Cc) {
        // running under Mozilla 1.8 or later
        info = Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULAppInfo)[prop];
    }
    else {
        try {
            info = Cc['@mozilla.org/preferences-service;1']
                        .getService(Ci.nsIPrefBranch)
                        .getCharPref(prop === 'ID' ? 'app.id' : 'app.extensions.version');
        }
        catch(e) {
            // very old version
            dump(e);
        }
    }
    return info;
}

/**
 * @private
 * @constant
 */
function _setDefaultTarget () {
    var appId = _getAppInfo('ID');
    var appExtVer = _getAppInfo('version');
    _setTarget(appId, appExtVer, appExtVer);
}


/**
 * @private
 * @constant
 */
function _setFieldValues (manifest) {
    var props = ['id', 'name', 'version', 'creator', 'description', 'homepageURL',
                            'updateURL', 'iconURL', 'optionsURL', 'aboutURL'];

    for (var i=0; i < props.length; i++) {
        if (manifest[props[i]]) {
            $(props[i]).value = manifest[props[i]];
        }
    }

    if (manifest.contributors) {
        for (i=0; i < manifest.contributors.length; i++) {
            $('contributors').appendItem(manifest.contributors[i]);
        }
    }

    if (manifest.targetApplication) {
        for(i=0; i < manifest.targetApplication.length; i++) {
            var v = manifest.targetApplication[i];
            _setTarget(v.id, v.minVersion, v.maxVersion);
        }
    }

    if (manifest.files) {
        for (i=0; i < manifest.files.length; i++) {
            var fileBox = File.add(manifest.files[i].fileName);
            var providers = ['package', 'skin', 'locale'];
            for (var j=0; j < providers.length; j++) {
                if (manifest.files[i][providers[j]]) {
                    var pl = manifest.files[i][providers[j]];
                    for (var k=0; k<pl.length; k++) {
                        ChromePath.add(fileBox, providers[j], pl[k]);
                    }
                }
            }
        }
    }
}

/**
 * @private
 * @constant
 */
function _setDefaultValues () {
    dump('_setDefaultValues\n');
    _setGUID();
    ChromePath.add(File.add());
    _setDefaultTarget();
    if (gExtensionShortName) {
        $('name').value = gExtensionShortName;
    }
}


/**
 * @private
 * @constant
 */
function _pathToFileURI (path) {
    var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
    var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);
    return ios.newFileURI(file);
}

/**
 * @private
 * @constant
 * @uses readInstallManifest
 */
function _setInstallManifest (manifestPath, extensionShortName) {
    gInstallManifestFilename = manifestPath;
    if (extensionShortName) {
        gExtensionShortName = extensionShortName;
    }

    dump('_setInstallManifest 1: ' + manifestPath + '\n');
    var manifestFile = _pathToFileURI(manifestPath);
    dump('_setInstallManifest 2: ' + manifestFile.spec + '\n');
    var installmanifest = Extension.readInstallManifest(manifestFile.spec);
    dump('_setInstallManifest 3: ' + installmanifest + '\n');
    if (installmanifest && installmanifest.id) {
        _setFieldValues(installmanifest);
    }
    else {
        // could be a filename for a new file
        _setDefaultValues();
    }
}


/**
 * @private
 * @constant
 */
function _serializeRDF (ds, file) {
    var foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
    foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
    var serializer = Cc['@mozilla.org/rdf/xml-serializer;1'].createInstance(Ci.nsIRDFXMLSerializer);
    serializer.init(ds);
    serializer.QueryInterface(Ci.nsIRDFXMLSource);
    var as = Cc['@mozilla.org/atom-service;1'].getService(Ci.nsIAtomService);
    serializer.addNameSpace(as.getAtom('em'),
	'http://www.mozilla.org/2004/em-rdf#');
    serializer.Serialize(foStream);
    foStream.close();
}

/**
 * @private
 * @constant
 * @uses Extension.EM_NS
 */
function _writeInstallManifest (filename, manifest) {
    var gRDF;
    try {
        gRDF = Cc['@mozilla.org/rdf/rdf-service;1'].getService(Ci.nsIRDFService);
        var ds = Cc['@mozilla.org/rdf/datasource;1?name=in-memory-datasource'].createInstance(Ci.nsIRDFDataSource);

        var manifestRoot = gRDF.GetResource('urn:mozilla:install-manifest');
        // simple props
        var props = ['id', 'name', 'version', 'creator', 'description', 'homepageURL',
                                'updateURL', 'iconURL', 'optionsURL', 'aboutURL'];

        var lit, desc, prop, j;
        for (var i=0; i < props.length; i++) {
            if (manifest[props[i]]) {
                prop = gRDF.GetResource(Extension.EM_NS(props[i]));
                lit = gRDF.GetLiteral(manifest[props[i]]);
                ds.Assert(manifestRoot, prop, lit, true);
            }
        }

        // contributors
        if (manifest.contributors) {
            for(i=0; i < manifest.contributors.length; i++) {
                var cprop = gRDF.GetResource(Extension.EM_NS('contributor'));
                lit = gRDF.GetLiteral(manifest.contributors[i]);
                ds.Assert(manifestRoot, cprop, lit, true);
            }
        }

        // Version/Dependency
        var versionProps = ['targetApplication', 'requires'];
        var id = gRDF.GetResource(Extension.EM_NS('id')),
            minVer = gRDF.GetResource(Extension.EM_NS('minVersion')),
            maxVer = gRDF.GetResource(Extension.EM_NS('maxVersion'));

        for (i=0; i < versionProps.length; i++) {
            if (manifest[versionProps[i]]) {
                prop = gRDF.GetResource(Extension.EM_NS(versionProps[i]));
                for (j=0; j<manifest[versionProps[i]].length; j++) {
                    // the Description
                    desc = gRDF.GetAnonymousResource();
                    ds.Assert(manifestRoot, prop, desc, true);
                    lit = gRDF.GetLiteral(manifest[versionProps[i]][j].id);
                    ds.Assert(desc, id, lit, true);
                    lit = gRDF.GetLiteral(manifest[versionProps[i]][j].minVersion);
                    ds.Assert(desc, minVer, lit, true);
                    lit = gRDF.GetLiteral(manifest[versionProps[i]][j].maxVersion);
                    ds.Assert(desc, maxVer, lit, true);
                }
            }
        }

        // Files
        var fileProp = gRDF.GetResource(Extension.EM_NS('file'));
        if (manifest.files) {
            for(i=0; i < manifest.files.length; i++) {
                desc = gRDF.GetResource('urn:mozilla:extension:file:' +
                                                manifest.files[i].fileName);
                ds.Assert(manifestRoot, fileProp, desc, true);
                var providers = ['package', 'skin', 'locale'];
                for (j=0; j<providers.length; j++) {
                    if (manifest.files[i][providers[j]]) {
                        var provProp = gRDF.GetResource(Extension.EM_NS(providers[j]));
                        for (var k=0; k<manifest.files[i][providers[j]].length; k++) {
                            lit = gRDF.GetLiteral(manifest.files[i][providers[j]][k]);
                            ds.Assert(desc, provProp, lit, true);
                        }
                    }
                }
            }
        }

        var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
        file.initWithPath(filename);
        _serializeRDF(ds, file);
    }
    catch(e) {dump(e + '\n'); }

    // must release this
    gRDF = null;
}


/**
 * @private
 * @constant
 */
function _getCharPref (p) {
    return prefs.getCharPref(p);
}


/**
 * @private
 * @constant
 * @uses pr_all
 */
function _getFieldValues() {
    var manifest = {toString: Basics.properties_all};

    var props = ['id', 'name', 'version', 'creator', 'description', 'homepageURL',
                            'updateURL', 'iconURL', 'optionsURL', 'aboutURL'];

    for (var i=0; i < props.length; i++) {
        manifest[props[i]] = $(props[i]).value;
    }

    var contributors = $('contributors');
    var num = contributors.getRowCount();
    if (num > 0) {
        manifest.contributors = new Array(num);
        for (i=0; i < num; i++) {
            manifest.contributors[i] = contributors.getItemAtIndex(i).label;
        }
    }
    var j;
    var targets = $('target-applications').getElementsByTagName('checkbox');
    if (targets.length > 0) {
        manifest.targetApplication = [];
        for (i=0; i < targets.length; i++) {
            if (targets[i].checked) {
                var minVer, maxVer;
                var textboxes=targets[i].parentNode.getElementsByTagName('textbox');
                for (j=0; j<textboxes.length; j++) {
                    var t = textboxes[j];
                    if (t.id.match(/minver$/)) {
                        minVer = t.value;
                    }
                    else if (t.id.match(/maxver$/)) {
                        maxVer = t.value;
                    }
                }
                manifest.targetApplication.push({ id: targets[i].id, minVersion: minVer, maxVersion: maxVer });
            }
        }
    }

    var files = $('files-box').childNodes;
    if (files.length > 0) {
        manifest.files = new Array(files.length);
        for (i=0; i < files.length; i++) {
            manifest.files[i] = {};
            manifest.files[i].fileName = files[i].getElementsByTagName('textbox')[0].value;
            var paths = files[i].getElementsByTagName('menulist');
            if (paths.length > 0) {
                for (j=0; j<paths.length; j++) {
                    var type = paths[j].selectedItem.label;
                    var path = paths[j].nextSibling.value;
                    if (!manifest.files[i][type]) {
                        manifest.files[i][type] = [];
                    }
                    manifest.files[i][type].push(path);
                }
            }
        }
    }
    return manifest;
}


/**
 * @private
 * @constant
 */
function _promptForFilename () {
    var nsIFilePicker = Ci.nsIFilePicker;
    var fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
    fp.init(window, 'Save As', nsIFilePicker.modeSave);
    if (fp.show() == nsIFilePicker.returnOK) {
        return fp.file.path;
    }
    return 'install.rdf';
}

var Manifest = {
    doSaveManifest : function () {
        if (!gInstallManifestFilename) {
            gInstallManifestFilename = _promptForFilename();
        }

        _writeInstallManifest(gInstallManifestFilename, _getFieldValues());
    },
    doLoadManifest : function () {
        if (window.arguments && window.arguments[0]) {
            _setInstallManifest(window.arguments[0], window.arguments[1]);
        }
        else {
            _setDefaultValues();
        }
    }
};

var Contributor = {
    add : function () {
        var c = $('contributor-add');
        if (c.value != '') {
            $('contributors').appendItem(c.value);
            c.value = '';
        }
    },
    remove : function () {
        var c = $('contributors');
        var si = c.selectedItems;
        for(var i = si.length-1; i >= 0; i--) {
            c.removeItemAt(c.getIndexOfItem(si[i]));
        }
        c.clearSelection();
        $('remove-contributor').disabled = true;
    },
    select : function () {
        $('remove-contributor').disabled = ($('contributors').selectedCount == 0);
    }
};


var ChromePath = {
    remove : function (cb) {
        var pathsbox = $('files-box').getElementsByTagName('rows')[0];
        pathsbox.removeChild(cb.parentNode);
    },
    add : function (filebox, chrometype, pathname) {
        var pathsSpare = $('paths-spare');
        var pathBox = filebox.getElementsByTagName('rows')[0].appendChild(
            pathsSpare.getElementsByTagName('row')[0].cloneNode(true)
        );
        if (chrometype != undefined && pathname != undefined) {
            var ml = pathBox.getElementsByTagName('menulist')[0];
            var mi = pathBox.getElementsByTagName('menuitem');
            for (var i=0; i < mi.length; i++) {
                if (mi[i].label == chrometype) {
                    ml.selectedIndex = i;
                }
            }
            var tx = pathBox.getElementsByTagName('textbox')[0];
            tx.value = pathname;
        }
    },
    setDefault : function (menulist) {
        var txt = menulist.nextSibling;
        switch (menulist.selectedItem.label) {
        case 'package':
            txt.value = 'content/';
            break;
        case 'skin':
            txt.value = 'skin/';
            break;
        case 'locale':
            txt.value = 'locale/' + _getCharPref('general.useragent.locale') + '/';
            break;
        }
    }
};

var File = {
    remove : function (cb) {
        var files = $('files-box');
        var theFile = cb.parentNode.parentNode.parentNode;
        files.removeChild(theFile);
    },
    add: function (fileName) {
        var filesSpare = $('files-spare');
        var files = $('files-box');
        var filebox = filesSpare.firstChild.cloneNode(true);

        files.appendChild(filebox); // Must be appended before setting value property apparently

        if (fileName != undefined) {
            filebox.getElementsByTagName('textbox')[0].value = fileName;
        }
        else if (gExtensionShortName) {
            filebox.getElementsByTagName('textbox')[0].value = gExtensionShortName + '.jar';
        }

        return filebox;
    }
};

var Window = {
    close : function () {
        window.close();
    }
};

// EXPORTS
this.Manifest = Manifest;
this.Contributor = Contributor;
this.ChromePath = ChromePath;
this.File = File;
this.Window = Window;

}());
