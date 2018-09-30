
var Cc = Components.classes, Ci = Components.interfaces, module = Components.utils['import'];

var ZipUtils = {}, FileUtils = {}, RDFHistory = {}, Extension = {}, Basics = {};
module('resource://extensiondev/ZipUtils.js', ZipUtils);
module('resource://extensiondev/FileDirUtils.js', FileUtils);
module('resource://extensiondev/RDFHistory.js', RDFHistory);
module('resource://extensiondev/Extension.js', Extension);
module('resource://extensiondev/BasicLanguageUtils.js', Basics);

//constants etc.
// Files that can be in the XPI
var optionalXPIFiles = ['chrome', 'install.rdf', 'install.js', 'chrome.manifest', 'components', 'defaults'];
// The filename to save extension-specific data to
const EXTENSIONBUILDER_DATA = 'extensiondev-data.rdf';
const EXTENSIONDEV_NS = "http://ted.mielczarek.org/code/mozilla/extensiondev#";


// global variables
var currentWorkingDirectory = null;


function $ (id) {
    return document.getElementById(id);
}

/*
 * Append the extensiondev namespace to x.
 */
function _ED_NS (x) {
    return EXTENSIONDEV_NS + x;
}



/*
 * Return the filename of the first XPI located in dir.
 * Return null if there is no XPI.
 */
function _findExistingXPI (dir) {
    var en = dir.directoryEntries;
    while (en.hasMoreElements()) {
        var f = en.getNext();
        f.QueryInterface(Ci.nsILocalFile);
        if (f.isFile() && f.leafName.match(/\.xpi$/i)) {
            return f.leafName;
        }
    }
    return null;
}

/*
 * Determine the proper XPI filename for this extension
 * using a few heuristics:
 *
 * 1) If a config_build.sh exists, use APP_NAME from there.
 * 2) If an XPI file exists in the directory, use that filename.
 * 3) If there's a chrome.manifest, use the chrome path from there
 * 4) If there is only one jar file, in the install.rdf,
 *        use that filename with '.jar' replaced by '.xpi'.
 * 5) Otherwise just use the directory name with '.xpi' appended.
 */
function _determineXPIFilename (wd, mf, cm, cb) {
    wd = wd || UI.getWorkingDirectory();
    mf = mf || Extension.getInstallManifestFromDir(wd);
    cm = cm || Extension.getChromeManifestFromDir(wd);
    cb = cb || _getConfigBuildFromDir(wd);

    if (cb && ('APP_NAME' in cb)) {
        return cb.APP_NAME + '.xpi';
    }

    // easy, if an xpi file exists then use that name
    var xpiFilename = _findExistingXPI(wd);
    if (!xpiFilename) {
        // see if we have a chrome.manifest
        if (cm) {
            for (var i=0; i < cm.length; i++) {
                if (cm[i].match(/^(content|locale|skin)\s+/)) {
                    var items = cm[i].split(/\s+/);
                    xpiFilename = items[1] + '.xpi';
                    break;
                }
            }
        }
        // if we only have one jar file, then use that but with .xpi
        else if (mf && mf.files && mf.files.length == 1 && mf.files[0].fileName) {
            xpiFilename = mf.files[0].fileName.replace(/jar$/i, 'xpi');
        }
        else {
            // last resort, just use the name of the working directory .xpi
            xpiFilename = wd.leafName + '.xpi';
        }
    }
    return xpiFilename;
}



/*
 * Given a directory, read the config_build.sh file from that directory
 * into an object and return it.
 */
function _getConfigBuildFromDir (wd) {
    var f = wd.clone();
    f.append('config_build.sh');

    if (f.exists()) {
        var arr = FileUtils.readFileToArray(f);
        var obj = {};
        for (var i=0; i < arr.length; i++) {
            if (arr[i].match(/^\s*#/)) {
                continue;
            }
            var l = arr[i].split(/=/);
            var val = l[1];
            if (!val) {
                continue;
            }
            val = val.replace(/\"/g, '');
            obj[l[0]] = val.split(/\s+/);
        }
        return obj;
    }
    return null;
}



/*
 * Given an install manifest object mf, and/or a chrome.manifest
 * object cm, get a list of jar files and chrome
 * provider directories.    If copyCMTo is an nsIFile, then
 * copy the chrome.manifest to it with fixup.
 */
function _getJarFilesAndChromeDirs (mf, cm, jarfiles, jardirs, copyCMTo) {
    if (!mf && !cm) {
        return;
    }

    // check chrome.manifest first
    if (cm) {
        dump('checking chrome.manifest for jars/providers\n');
        // collect jar file references from chrome.manifest
        // also copy it to buildDir, with fixup if needed
        var ostream;
        if (copyCMTo) {
            ostream = Cc['@mozilla.org/network/file-output-stream;1']
                .createInstance(Ci.nsIFileOutputStream);
            // write, create, truncate
            ostream.init(copyCMTo, 0x02 | 0x08 | 0x20, 0664, 0);
        }
        var jarFile, provider, data;
        for (var i=0; i < cm.length; i++) {
            if (cm[i].match(/^(content|locale|skin)\s+/)) {
                var items = cm[i].split(/\s+/);
                var dir;
                dir = items[0] == 'content' ? items[2] : items[3];

                //TODO: handle intentional flat chrome with file:?
                if (dir.match(/^jar:/)) {
                    // grab jar file name and provider
                    // we just want the jar file name
                    var sl = dir.indexOf('/', 4);
                    var pt = dir.indexOf('!');
                    sl = (sl < 0 || sl > pt) ? 4 : sl + 1;
                    jarFile = dir.substring(sl, pt);
                    provider = dir.substring(pt + 1);
                    provider = provider.replace(/^\//, '');
                    provider = provider.replace(/\/.*/, '');
                    if (!Basics.inArray(jarFile, jarfiles)) {
                        jarfiles.push(jarFile);
                    }
                    if (jarFile in jardirs) {
                        if (!Basics.inArray(provider, jardirs[jarFile])) {
                            jardirs[jarFile].push(provider);
                        }
                    }
                    else {
                        jardirs[jarFile] = [provider];
                    }

                    // write to output file unchanged
                    if (ostream) {
                        data = cm[i] + '\n';
                        ostream.write(data, data.length);
                    }
                }
                else {
                    // fixup line, make jar file name
                    jarFile = items[1] + '.jar';
                    provider = dir;
                    provider = provider.replace(/^\//, '');
                    provider = provider.replace(/\/.*/, '');

                    if (dir[0] != '/') {
                        dir = '/' + dir;
                    }
                    var fixedprovider = 'jar:chrome/' + jarFile + '!' + dir;
                    if (!Basics.inArray(jarFile, jarfiles)) {
                        jarfiles.push(jarFile);
                    }
                    if (jarFile in jardirs) {
                        if (!Basics.inArray(provider, jardirs[jarFile])) {
                            jardirs[jarFile].push(provider);
                        }
                    }
                    else {
                        jardirs[jarFile] = [provider];
                    }

                    if (ostream) {
                        if (items[0] == 'content') {
                            items[2] = fixedprovider;
                        }
                        else {
                            items[3] = fixedprovider;
                        }

                        // write out changed version
                        data = items.join(' ') + '\n';
                        ostream.write(data, data.length);
                    }
                }
            }
            else {
                if (ostream) {
                    // not a chrome provider, just echo it
                    data = cm[i] + '\n';
                    ostream.write(data, data.length);
                }
            }
        }
        if (ostream) {
            ostream.close();
        }
    }
    // otherwise use install.rdf
    else if (mf.files) {
        var providers = ['package', 'locale', 'skin'];
        for (i = 0; i < mf.files.length; i++) {
            // save jar file, make entry in chromeDirs
            jarfiles.push(mf.files[i]);
            jardirs[mf.files[i]] = [];

            for (var j = 0; j < providers.length; j++) {
                if (mf.files[i][providers[j]]) {
                    for (var k = 0; k < mf.files[i][providers[j]].length; k++) {
                        // we just want the top level directory
                        provider = mf.files[i][providers[j]][k].split('/')[0];
                        if (!Basics.inArray(provider, jardirs[mf.files[i]])) {
                            jardirs[mf.files[i]].push(provider);
                        }
                    }
                }
            }
        }
    }
}


/*
 * Install the extension xpi from the current directory.
 * NOT IN USE
 */
function _installExtension () {
    dump('installExtension\n');
    var file = UI.getWorkingDirectory();
    var xpifilename = UI.getXPIFilename(file);
    file.append(xpifilename);

    try {
        var extensionManager = Cc['@mozilla.org/extensions/manager;1'].getService(Ci.nsIExtensionManager);
        extensionManager.installExtension(file, Ci.nsIExtensionManager.FLAG_INSTALL_PROFILE);
        UI.setStatus('Finished installing ' + xpifilename + '.    Please restart your browser.');
    }
    catch(ex) {
        UI.setStatus('Error installing ' + xpifilename);
    }
}

/*
 * Uninstall the extension from the current directory.
 * NOT IN USE
 */
function _unInstallExtension () {
}


// Probably can remove
function _haveExtensionManager () {
    return '@mozilla.org/extensions/manager;1' in Cc;
}

/*
 * Given a working directory, and an extension id, determine
 * if it has been installed with flat chrome
 * from the working directory.
 */
function _isDevInstalled (wd, id) {
    if (!wd) {
        return false;
    }

    if ('@mozilla.org/extensions/manager;1' in Cc) {
        // Firefox 1.5+
        var em = Cc['@mozilla.org/extensions/manager;1']
                                             .getService(Ci.nsIExtensionManager);
        var il = em.getInstallLocation(id);
        if (il == null) {
            return null;
        }

        var d = il.getItemLocation(id);
        if (d.equals(wd)) {
            return true;
        }
    }
    return false;
}


/*
 * Get the extension data datasource from dir.
 * If create is true, create it if it doesn't exist.
 * Otherwise, return null if it doesn't exist.
 * NOT IN USE (though see _loadExtensionData and _saveExtensionData)
 */
function _getExtensionDataDS (dir, create) {
    var f = dir.clone();
    f.append(EXTENSIONBUILDER_DATA);
    if (create || f.exists()) {
        // var rdfContainerUtils = Cc['@mozilla.org/rdf/container-utils;1'].getService(Ci.nsIRDFContainerUtils);
        var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
        var fileURI = ios.newFileURI(f);
        return gRDF.GetDataSourceBlocking(fileURI.spec);
    }
    return null;
}

/*
 * Save extension data.
 */
function _saveExtensionData () {
    /*
    if (currentWorkingDirectory) {
        var ds = _getExtensionDataDS(currentWorkingDirectory,true);
    }
    */
}

/*
 * Load extension data
 */
function _loadExtensionData (wd) {
    /*
    var ds = _getExtensionDataDS(wd);
    if (ds) {
        dump('loading extension data...\n');
    }
    */
}

/*
 * Working directory has changed, set all data accordingly.
 */
function _setWorkingDirectory (folder) {
    currentWorkingDirectory = folder;

    // clear extra files list
    var ef = $('extra-files');
    while (ef.firstChild) {
        ef.removeChild(ef.firstChild);
    }

    // load extension data if it exists
    _loadExtensionData(folder);

    // enable/disable buttons
    var mf = Extension.getInstallManifestFromDir(folder);
    var cb = _getConfigBuildFromDir(folder);

    // we need a working dir to use these buttons
    ButtonActions.enableDisable(['edit-install'], !folder);
    // we need a working dir and an install manifest to use these buttons
    ButtonActions.enableDisable(['build'], !folder || !mf || !mf.id);

    // we need a working dir, an install manifest to use these buttons
    ButtonActions.enableDisable(['install-dev'], !folder || !mf || !mf.id || !_haveExtensionManager() || _isDevInstalled(folder, mf.id) || Extension.isInstalled(mf.id));
    ButtonActions.enableDisable(['uninstall-dev'], !folder || !mf || !mf.id || !_haveExtensionManager() || !_isDevInstalled(folder, mf.id));
    // determine XPI filename
    $('xpi-filename').value = _determineXPIFilename(folder, mf, null, cb);
    // add extra files to list
    UI.initExtraFiles(folder, mf, cb);
    UI.setStatus('Loaded ' + folder.leafName);
}


/*
 * Given a working directory, zip file name, files to add
 * (relative to working directory)
 * and boolean indicating whether to use compression,
 * create the zip file.
 */
function _createZip (extDir, zipfile, addDirs, compress) {
    //alert(addDirs + '::'+ addDirs.length);
    var zu = ZipUtils.getZipUtil();

    if (!zu) {
        UI.setStatus('No suitable zip program found.');
        return false;
    }

    dump('_createZip: ' + extDir + ', ' + zipfile + ', [' + addDirs.join(',') + '], ' + compress + '\n');
    if (zu.createZip(extDir, zipfile, addDirs, compress)) {
        return true;
    }

    UI.setStatus('Zip failed');
    return false;
}



var UI = {
    palert : function (title, message) {
        var ps = Cc['@mozilla.org/embedcomp/prompt-service;1']
            .getService(Ci.nsIPromptService);
        ps.alert(window, title, message, ps.BUTTON_TITLE_OK);
    },
    /*
     * Set the statusbar text
     */
    setStatus : function (s) {
        var st = $('status');
        st.label = s;
    },
    /*
     * Enable/disable buttons according to whether the directories exist
    */
    makeDirectoryButtonsOpenable : function () {
        var f = UI.getWorkingDirectory();
        var idir;
        if (f) {
            idir = Extension.getInstalledDir(UI.getWorkingDirectory());
        }
        ButtonActions.enableDisable(['installed-dir'], !idir || !idir.exists());
        ButtonActions.enableDisable(['working-dir'], !f || !f.exists());
    },
    /*
     * Get the XPI filename for this extension, either from
     * the textbox or by using the heuristics. If the latter,
     * set the textbox value to the determined filename.
     */
    getXPIFilename : function (wd, mf, cm, cb) {
        var xf = $('xpi-filename');
        if (xf.value === '') {
            xf.value = _determineXPIFilename(wd, mf, cm, cb);
        }
        return xf.value;
    },
    /*
     * Get the current working directory as an nsILocalFile
     */
    getWorkingDirectory : function () {
        try {
            var s = $('workingdir').selectedItem;
            if (s) {
                var f = FileUtils.fileFromPath(s.getAttribute('label'));
                if (f) {
                    return f;
                }
            }
        }
        catch(ex) {
            dump(ex);
        }
        return null;
    },
    /*
     * Handle changing the current working directory.
     */
    dirSelectionChanged : function () {
        // save extension data
        _saveExtensionData();
        var f = UI.getWorkingDirectory();
        UI.makeDirectoryButtonsOpenable();
        if (f) {
            _setWorkingDirectory(f);
        }
    },
    /*
     * Load the recently used paths from the extensiondev RDF store.
     */
    loadPaths : function () {
        var items = RDFHistory.loadHistoryItems(_ED_NS('extensionbuilder_paths'), _ED_NS('extensionbuilder_pathitem'));
        var ml = $('workingdir');
        for (var i=0; i < items.length; i++) {
            ml.appendItem(items[i]);
        }
        var lastSel = RDFHistory.loadSingleItem('lastworkingdir');
        ml.selectedIndex = (lastSel == null) ? -1 : lastSel;
        UI.dirSelectionChanged();
    },
    /*
     * Save the recently used paths to the extensiondev RDF store.
     */
    savePaths : function () {
        var ml = $('workingdir');
        var mi = ml.getElementsByTagName('menuitem');
        var num = Basics.min(mi.length, 10);
        var list = [];
        for (var i=0; i < num; i++) {
            list.push(mi[i].getAttribute('label'));
        }
        RDFHistory.saveHistoryItems(list, _ED_NS('extensionbuilder_paths'), _ED_NS('extensionbuilder_pathitem'));
        RDFHistory.saveSingleItem('lastworkingdir', ml.selectedIndex);
    },
    /*
     * Find all files in folder that are not required or optional
     * parts of the extension, and add them to a list so they can
     * be optionally packaged into the XPI.
     */
    initExtraFiles : function (folder, mf, cb) {
        var ef = $('extra-files');
        var it = folder.directoryEntries;
        mf = mf || Extension.getInstallManifestFromDir(folder);
        var jarDirs = {};
        var jarFiles = [];
        var ignoreFiles = ['build.sh', 'config_build.sh'].concat(optionalXPIFiles);
        var rootFiles = [];
        if (cb) {
            if (cb.ROOT_FILES) {
                rootFiles = rootFiles.concat(cb.ROOT_FILES);
            }
            if (cb.ROOT_DIRS) {
                rootFiles = rootFiles.concat(cb.ROOT_DIRS);
            }
        }
        // grab chrome dirs out of install.rdf or chrome.manifest
        _getJarFilesAndChromeDirs(mf,
                                                         Extension.getChromeManifestFromDir(folder),
                                                         jarFiles,
                                                         jarDirs);
        for (var i=0; i < jarFiles.length; i++) {
            ignoreFiles = ignoreFiles.concat(jarDirs[jarFiles[i]]);
        }
        if (mf && mf.id) {
            ignoreFiles.push(mf.id);
        }
        ignoreFiles.push(UI.getXPIFilename(folder));
        ignoreFiles.push(EXTENSIONBUILDER_DATA);
        while (it.hasMoreElements()) {
            var f = it.getNext();
            if (f instanceof Ci.nsILocalFile) {
                // ignore hidden files, emacs backup saves, and the specific ignore files
                if (!f.isHidden() && !f.leafName.match(/~$/) &&
                     !Basics.inArray(f.leafName, ignoreFiles)) {
                    var chk = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'checkbox');
                    var name = f.leafName;
                    if (f.isDirectory()) {
                        name += '/';
                    }
                    chk.setAttribute('label', name);
                    chk.value = f.leafName;
                    if (Basics.inArray(f.leafName, rootFiles)) {
                        chk.setAttribute('checked', 'true');
                    }
                    ef.appendChild(chk);
                }
            }
        }
    }
};

var ButtonActions = {
    enableDisable : function (buttons, disabled) {
        for (var i=0; i < buttons.length; i++) {
            var btn = $(buttons[i]);
            btn.disabled = disabled;
        }
    },
    /*
     * Reveal the current working directory in the system file browser.
     */
    showWorkingDir : function () {
        var extDir = UI.getWorkingDirectory();

        if (extDir && extDir.exists()) {
            try {
                extDir.reveal();
            } catch(ex) { alert('Reveal not supported on this platform\n'); }
        }
    },
    /*
     * Reveal the installed directory in the system file browser.
     */
    showInstalledDir : function () {
        var extDir = Extension.getInstalledDir(UI.getWorkingDirectory());
        if (extDir && extDir.exists()) {
            try {
                extDir.reveal();
            }
            catch(ex) {
                alert('Reveal not supported on this platform\n');
            }
        }
    },
    /*
     * Edit install.rdf from the current working directory in the
     * install.rdf editor window.
     */
    editInstallManifest : function () {
        var f = UI.getWorkingDirectory();
        if (f) {
            f.append('install.rdf');
            /* var w = */ window.openDialog('chrome://extensiondev/content/install-edit.xul', 'installedit',
                                                                    "all=no,dialog=yes,scrollbars=yes,resizable=yes", f.path);
        }
    },
    /*
     * Install the extension in the working directory
     * for development.
     */
    installDevChrome : function () {
        var wd = UI.getWorkingDirectory();
        var mf = Extension.getInstallManifestFromDir(wd);
        var directoryService=Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties);
        var file = directoryService.get('ProfD', Ci.nsILocalFile);
        file.append('extensions');
        file.append(mf.id);
        if (!file.exists()) {
            var ostream = Cc['@mozilla.org/network/file-output-stream;1']
                .createInstance(Ci.nsIFileOutputStream);
            // write, create, truncate
            ostream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
            var data = wd.path + '\n';
            ostream.write(data, data.length);
            ostream.close();
            ButtonActions.enableDisable(['install-dev'], true);
            UI.palert('Installed', 'Extension installed for development.  Restart your browser.');
        }
    },
    /*
     * Uninstall the extension in the working directory
     * from development.
     */
    unInstallDevChrome : function () {
        var wd = UI.getWorkingDirectory();
        var mf = Extension.getInstallManifestFromDir(wd);
        var directoryService=Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties);
        var file = directoryService.get('ProfD', Ci.nsILocalFile);
        file.append('extensions');
        file.append(mf.id);
        if (file.exists() && !file.isDirectory()) {
            file.remove(false);
            ButtonActions.enableDisable(['uninstall-dev'], true);
            UI.palert('Uninstalled', 'Extension uninstalled.  Restart your browser.');
        }
    },
    /*
     * Open a "browse for folder" dialog to locate an extension directory
     * Add the the selected directory to the dropdown list and set it as
     * the current working directory.
     */
    browseForExtension : function () {
        var nsIFilePicker = Ci.nsIFilePicker;
        var fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
        fp.init(window, 'Choose Extension Directory', nsIFilePicker.modeGetFolder);
        if (fp.show() == nsIFilePicker.returnOK) {
            var wd = $('workingdir');
            var item = wd.insertItemAt(0,fp.file.path);
            wd.selectedItem = item;
            UI.dirSelectionChanged();
        }
    },
    /*
     * Build the XPI in the current working directory.
     * This will package all required jar files first, then
     * package the XPI.
     */
    buildPackage : function () {
        // determine what to package (read install.rdf, etc.)
        var chromeDir, jarfiles = [], jardirs = {};
        var wd = UI.getWorkingDirectory();
        var buildDir = FileUtils.maybeMkDir(wd, 'build');
        var cm = Extension.getChromeManifestFromDir(wd);
        var mf = Extension.getInstallManifestFromDir(wd);

        if (!mf && !cm) {
            return;
        }

        // copy optional xpi files to temp dir
        var xpifiles = [];
        // extra files user has selected
        var ef = $('extra-files').childNodes;
        for (var i=0; i < ef.length; i++) {
            if (ef[i].checked) {
                xpifiles.push(ef[i].value);
            }
        }
        xpifiles = xpifiles.concat(optionalXPIFiles);
        for (i=0; i < xpifiles.length; i++) {
            var xd = wd.clone();
            xd.append(xpifiles[i]);
            if (xd.exists()) {
                xd.copyTo(buildDir, '');
            }
        }

        var newCM;
        if (cm) {
            // destination to copy chrome.manifest to
            newCM = buildDir.clone();
            newCM.append('chrome.manifest');
        }
        _getJarFilesAndChromeDirs(mf, cm, jarfiles, jardirs, newCM);

        var xpiFilename, xpiFile;
        xpiFilename = UI.getXPIFilename(wd, mf, cm);

        if (jarfiles.length) {
            // now get or create chrome dir
            chromeDir = FileUtils.maybeMkDir(buildDir, 'chrome'); // Fix: make optional? (e.g., if wish content/locale/skin at root instead)
            // create each jarFile with no compression
            for (i=0; i < jarfiles.length; i++) {
                var jf = chromeDir.clone();
                jf.append(jarfiles[i].fileName === '' ? xpiFilename.replace(/\.xpi$/, '.jar') : jarfiles[i].fileName.replace(/\.jar$/, '') + '.jar');
                //jf.append(jarfiles[i].fileName === '' ? 'ext.jar' : jarfiles[i].fileName);
                if (!_createZip(wd.path, jf.path, jardirs[jarfiles[i]], false)) {
                    UI.setStatus('Error creating ' + jarfiles[i]);
                    return;
                }
            }
        }

        // zip up the xpi

        xpiFile = wd.clone();
        xpiFile.append(xpiFilename);

        // we grab everything out of the temp build dir and put it in the xpi
        xpifiles = [];
        var it = buildDir.directoryEntries;
        while (it.hasMoreElements()) {
            var f = it.getNext();
            if (f instanceof Ci.nsILocalFile) {
                xpifiles.push(f.leafName);
            }
        }

        // remove existing xpi
        if (xpiFile.exists()) {
            xpiFile.remove(false);
        }
        // zip files into xpi with compression
/**/
        if (!_createZip(buildDir.path, xpiFile.path, xpifiles, true)) {
            return;
        }
        // now remove build dir
        buildDir.remove(true);
//*/
        UI.setStatus('Built ' + xpiFilename);
    }
};

var ExtensionBuilder = {
    /*
     * Perform initialization
     */
    onLoad : function () {
        UI.makeDirectoryButtonsOpenable();
        RDFHistory.getRDFService();
        UI.loadPaths();
        UI.setStatus('Ready');
    },

    /*
     * Perform cleanup/shutdown.
     */
    onUnload : function () {
        UI.savePaths();
        RDFHistory.releaseRDFService();
    }
};


window.addEventListener('load', ExtensionBuilder.onLoad, true);
window.addEventListener('unload', ExtensionBuilder.onUnload, true);
