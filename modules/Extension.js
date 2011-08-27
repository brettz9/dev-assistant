var EXPORTED_SYMBOLS = [
    'getInstalledDir',
    'EM_NS',
    'readInstallManifest',
    'isInstalled',
    // May be less useful external to this app
    'getInstallManifestFromDir',
    'getChromeManifestFromDir'
];


var Cc = Components.classes, Ci = Components.interfaces, module = Components.utils['import'];
var Basics = {}, FileUtils = {};
module('resource://extensiondev/BasicLanguageUtils.js', Basics);
module('resource://extensiondev/FileDirUtils.js', FileUtils);

const EM_NS_PREFIX = 'http://www.mozilla.org/2004/em-rdf#';

/**
 * @private
 * @constant
 */
function _stringData (aLiteralOrResource) {
    try {
        var obj = aLiteralOrResource.QueryInterface(Components.interfaces.nsIRDFLiteral);
        return obj.Value;
    }
    catch (e) {
        try {
            obj = aLiteralOrResource.QueryInterface(Components.interfaces.nsIRDFResource);
            return obj.Value;
        }
        catch (e) {}
    }
    return '--';
}

function EM_NS (aProperty) {
    return EM_NS_PREFIX + aProperty;
}


function readInstallManifest (manifest) {
    var gRDF;
    var obj = {toString: Basics.properties_all};
    try {
        gRDF = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(Components.interfaces.nsIRDFService);
        var ds = gRDF.GetDataSourceBlocking(manifest);

        var manifestRoot = gRDF.GetResource('urn:mozilla:install-manifest');
        // simple props
        var props = ['id', 'name', 'version', 'creator', 'description', 'homepageURL',
                                'updateURL', 'iconURL', 'optionsURL', 'aboutURL'];

        for (var i=0; i < props.length; i++) {
            var prop = gRDF.GetResource(EM_NS(props[i]));
            var res = ds.GetTarget(manifestRoot, prop, true);
            if(res) {
                obj[props[i]] = _stringData(res);
            }
        }

        // contributors
        var contributors = ds.GetTargets(manifestRoot,
				         gRDF.GetResource(EM_NS('contributor')),
				         true);
        var c = [];
        while (contributors.hasMoreElements()) {
            var literal = contributors.getNext().QueryInterface(Components.interfaces.nsIRDFNode);
            if (literal) {
                c.push(_stringData(literal));
            }
        }
        if(c.length > 0) {
            obj.contributors = c;
        }

        // Version/Dependency
        var versionProps = ['targetApplication', 'requires'];
        var id = gRDF.GetResource(EM_NS('id')),
            minVer = gRDF.GetResource(EM_NS('minVersion')),
            maxVer = gRDF.GetResource(EM_NS('maxVersion'));

        for (i=0; i < versionProps.length; i++) {
            prop = gRDF.GetResource(EM_NS(versionProps[i]));
            var infos = ds.GetTargets(manifestRoot, prop, true);
            var list = [];

            while (infos.hasMoreElements()) {
                var verInfo = infos.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
                var verObj = {toString: Basics.properties_all};

                res = ds.GetTarget(verInfo, id, true);
                if (res) {
                    verObj.id = _stringData(res);
                }
                res = ds.GetTarget(verInfo, minVer, true);
                if (res) {
                    verObj.minVersion = _stringData(res);
                }
                res = ds.GetTarget(verInfo, maxVer, true);
                if (res) {
                    verObj.maxVersion = _stringData(res);
                }
                list.push(verObj);
            }
            if (list.length > 0) {
                obj[versionProps[i]] = list;
            }
        }

        // Files
        var fileProp = gRDF.GetResource(EM_NS('file'));
        var files = ds.GetTargets(manifestRoot, fileProp, true);
        var fileList = [];
        while (files.hasMoreElements()) {
            var fileObj = {toString: Basics.properties_all};
            var file = files.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
            fileObj.fileName = file.Value.substr('urn:mozilla:extension:file:'.length, file.Value.length);
            
            var providers = ['package', 'skin', 'locale'];
            for (i=0; i < providers.length; i++) {
                list = [];
                var provProp = gRDF.GetResource(EM_NS(providers[i]));
                var items = ds.GetTargets(file, provProp, true);
                while (items.hasMoreElements()) {
                    var item = items.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral);
                    list.push(item.Value);
                }
                if (list.length > 0) {
                    fileObj[providers[i]] = list;
                }
            }
            fileList.push(fileObj);
        }

        if (fileList.length > 0) {
            obj.files = fileList;
        }
    }
    catch(e) {dump(e + '\n'); obj = null;}

    // must release this
    gRDF = null;

    return obj;
}


/*
 * Given a directory, read the install.rdf file from that directory
 * into an object and return it.
 * @uses readInstallManifest
 */
function getInstallManifestFromDir (wd) {
    var f = wd.clone();
    f.append('install.rdf');
    var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
    var mffileuri = ios.newFileURI(f);
    return readInstallManifest(mffileuri.spec);
}

/*
 * Get the directory this extension is installed in.
 * Will use the new (temporary) install manifest to determine the installed ID (to see whether
 *    the targeted ID is installed already)
 */
function getInstalledDir (dir) {
    var mf = getInstallManifestFromDir(dir);
    if (!mf || !mf.id) {
        return null;
    }

    var id = mf.id;
    if ('@mozilla.org/extensions/manager;1' in Cc) {
        // Firefox 1.5+ or similar
        var em = Cc['@mozilla.org/extensions/manager;1'].getService(Ci.nsIExtensionManager);
        var il = em.getInstallLocation(id);
        if (il == null) {
            return null;
        }

        return il.getItemLocation(id);
    }
    // FF1.0 or something similar
    var directoryService=Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties);
    var profDir = directoryService.get('ProfD', Ci.nsILocalFile);
    var extDir = profDir.clone();
    extDir.append('extensions');

    if (extDir.exists()) {
        extDir.append(id);
        return extDir;
    }
    // probably SeaMonkey or something
    extDir = profDir.clone();
    extDir.append('chrome');
    return extDir;
}

/*
 * Determine if an extension is installed (by id)
 */
function isInstalled (id) {
    if ('@mozilla.org/extensions/manager;1' in Cc) {
        // Firefox 1.5+
        var em = Cc['@mozilla.org/extensions/manager;1']
                                             .getService(Ci.nsIExtensionManager);
        var it = em.getItemForID(id);
        if (it && it.type != 0) {
            return true;
        }
    }

    return false;
}

/*
 * Given a directory, read the chrome.manifest file from that directory
 * into an array and return it.
 */
function getChromeManifestFromDir (wd) {
    var f = wd.clone();
    f.append('chrome.manifest');
    return f.exists() ? FileUtils.readFileToArray(f): null;
}
