var EXPORTED_SYMBOLS = [
    'getZipUtil'
];

var Cc = Components.classes, Ci = Components.interfaces, module = Components.utils['import'];

var FileUtils = {}, RegistryUtils = {};
module('resource://extensiondev/FileDirUtils.js', FileUtils);
module('resource://extensiondev/RegistryUtils.js', RegistryUtils);


var gZipUtil = null, unixZipExecutable = null;
var ED_ID = '{75739dec-72db-4020-aa9a-6afa6744759b}';

var OS = null;

function getOS () {
    if (!OS) {
        OS = Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime).OS;
    }
    return OS;
}

/*
 * ZipUtil object to contain info about an installed
 * zip utility.
 */
function ZipUtil (type, exePath, scriptPath, noComp, maxComp, extraArgs) {
    this.zipType = type;
    this.zipExe = exePath;
    this.zipScript = getFileFromExtensionDir(ED_ID, scriptPath);
    this.NO_COMPRESSION = noComp;
    this.MAX_COMPRESSION = maxComp;
    this.EXTRA_ARGS = extraArgs;
}

ZipUtil.prototype = {
    /*
     * Create zipFile by adding filesToAdd from workingDir,
     * with boolean indicating compression.
     *
     * Return true for success, false for failure.
     */
    createZip: function (workingDir, zipFile, filesToAdd, compression) {
        var compressarg = compression ?
            this.MAX_COMPRESSION : this.NO_COMPRESSION;
        var opts = compressarg;
        //var opts = this.EXTRA_ARGS || [];
        //opts = opts.push([compressarg]).join(' ');
        var args = [this.zipExe, workingDir, opts, zipFile].concat(filesToAdd);
        if (this.zipScript.exists()) {
            var proc = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            proc.init(this.zipScript);
            proc.run(true, args, args.length);
            // return whether the zip file exists
            var zf = FileUtils.fileFromPath(zipFile);
            return zf.exists();
        }
        else {
            Components.utils.reportError('extensiondev: extensionbuilder: zip script not found or not executable');
            dump('zip script not found or not executable\n');
            return false;
        }
    },
    toString: function () {
        return '[ZipUtil ' + this.zipType + ']';
    }
};

/*
 * Given an extension id, get a file from its installed directory
 */
function getFileFromExtensionDir (id, filename) {
    if ('@mozilla.org/extensions/manager;1' in Cc) {
        // Firefox 1.5+
        var em = Cc['@mozilla.org/extensions/manager;1']
                                             .getService(Ci.nsIExtensionManager);
        var il = em.getInstallLocation(id);
        if (il == null) {
            return null;
        }

        var d = il.getItemLocation(id);
        d.append(filename);
        return d;
    }
    else {
        // Possibly FF <= 1.0 or SM
        // look in profile dir
        var directoryService=Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties);
        var profD = directoryService.get('ProfD', Ci.nsILocalFile);
        var file = profD.clone();
        // try profile/extensions/id first
        file.append('extensions');
        file.append(id);
        file.append(filename);
        if (file.exists()) {
            return file;
        }
        // try the profile chrome dir
        file = profD.clone();
        file.append('chrome');
        file.append(filename);
        if (file.exists()) {
            return file;
        }

        // ok, last ditch effort, try the app dir
        file = directoryService.get('AChrom', Ci.nsILocalFile);
        file.append(filename);
        if (file.exists()) {
            return file;
        }
    }
    // ouch.
    return null;
}

/*
 * Make sure zip.sh is executable.
 */
function checkZipSH () {
    if (getOS() != 'WINNT') {
        var zipScript = getFileFromExtensionDir(ED_ID, 'zip.sh');
        if (!zipScript.isExecutable()) {
            // try user executable first
            zipScript.permissions |= 0500;
            if (!zipScript.isExecutable()) {
                // this probably won't work anyway
                // if we don't own the file
                zipScript.permissions |= 0550;
                return zipScript.isExecutable();
            }
        }
        return true;
    }
    return false;
}


/*
 * Figure out what zip program is available and where it resides.
 * Returns a ZipUtil object or null.
 */
function determineZipUtil () {
    var zfile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
    var zpath;
    /*
     * For Windows, we look for various zip programs
     * by looking in the Windows registry.
     */

    // Returns "WINNT" on Windows Vista, XP, 2000, and NT systems;
    // "Linux" on GNU/Linux; and "Darwin" on Mac OS X.

    if (getOS() == 'WINNT') {
        // look for cygwin zip
        zpath = RegistryUtils.getRegKey('HKCU', 'Software\\Cygnus Solutions\\Cygwin\\mounts v2\\/', 'native') ||
                        RegistryUtils.getRegKey('HKLM', 'Software\\Cygnus Solutions\\Cygwin\\mounts v2\\/', 'native');

        if (zpath) {
            zfile.initWithPath(zpath);
            zfile.append('bin');
            zfile.append('zip.exe');

            if (zfile.exists()) {
                dump('found cygwin zip: ' + zfile.path + '\n');
                return new ZipUtil('Cygwin Zip',
                                                     zfile.path,
                                                     'cygzip.bat',
                                                     '-0',
                                                     '-9');
            }
        }

        // look for winzip command line addon
        zpath = RegistryUtils.getRegKey('HKCU', 'Software\\Nico Mak Computing\\WinZip\\Add-Ons\\WZCLINE');
        if (zpath) {
            zfile = FileUtils.fileFromPath(zpath).parent;
            zfile.append('wzzip.exe');
            if (zfile.exists()) {
                dump('found WinZip: ' + zfile.path + '\n');
                return new ZipUtil('WinZip Commandline Addon',
                                                     zfile.path,
                                                     'wzcline.bat',
                                                     '-e0',
                                                     '-ex');
            }
        }

        // look for WinRAR
        zpath = RegistryUtils.getRegKey('HKCR', 'WinRAR\\shell\\open\\command', '');
        if (zpath) {
            zpath = zpath.replace(/ +"%1" *$/, '').replace(/\"/g, '');
            zfile.initWithPath(zpath);
            if (zfile.exists()) {
                dump('found WinRAR: ' + zpath + '\n');
                return new ZipUtil('WinRAR',
                                                     zpath,
                                                     'winrar.bat',
                                                     '-m0',
                                                     '-m5');
            }
        }

        // look for winzip
        zpath = RegistryUtils.getRegKey('HKCR', 'Applications\\winzip32.exe\\shell\\open\\command\\', '') ||
                        RegistryUtils.getRegKey('HKCR', 'WinZip\\shell\\open\\command\\', '');
        if (zpath) {
            zpath = zpath.replace(/ +"%1" *$/, '');
            zfile.initWithPath(zpath);
            if (zfile.exists()) {
                dump('found WinZip: ' + zpath + '\n');
                return new ZipUtil('WinZip',
                                                     zpath,
                                                     'winzip.bat',
                                                     '-e0',
                                                     '-ex');
            }
        }

        // look for 7-Zip
        zpath = RegistryUtils.getRegKey('HKLM', 'SOFTWARE\\7-Zip', 'Path');
        if (zpath) {
            zfile.initWithPath(zpath);
            zfile.append('7z.exe');
            if (zfile.exists()) {
                dump('found 7-Zip: ' + zpath + '\n');
                return new ZipUtil('7-Zip',
                                                     zfile.path,
                                                     '7zip.bat',
                                                     '-mx0',
                                                     '-mx9');
            }
        }

        // win32, but no supported zip program
        return null;
    }

    if (typeof unixZipExecutable !== 'boolean') {
        unixZipExecutable = checkZipSH();
    }

    if (!unixZipExecutable) {
        return null;
    }

    // see if we have zip in our path
    var env = Cc['@mozilla.org/process/environment;1'].getService(Ci.nsIEnvironment);
    var paths = env.get('PATH').split(':');
    for (var i=0;i < paths.length; i++) {
        try {
            zfile.initWithPath(paths[i]);
            zfile.append('zip');
            if (zfile.exists()) {
                // NOTE: don't add isExecutable check here, it's broken:
                // https://bugzilla.mozilla.org/show_bug.cgi?id=322865
                return new ZipUtil('Unix Zip',
                    zfile.path,
                    'zip.sh',
                    '-0',
                    '-9');
            }
        }
        catch(ex) {}
    }

    //FIXME: handle other platforms gracefully?
    return null;
}


/*
 * Return a usable ZipUtil.    Save the result
 * if we have to call determineZipUtil
 */
function getZipUtil () {
    if (gZipUtil) {
        return gZipUtil;
    }

    gZipUtil = determineZipUtil();
    return gZipUtil;
}
