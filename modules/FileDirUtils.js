var EXPORTED_SYMBOLS = [
    'fileFromPath',
    'readFileToArray',
    'maybeMkDir'
];

var Cc = Components.classes, Ci = Components.interfaces;

/*
 * Given a full platform-specific path, return an nsILocalFile
 * representing that path.
 */
function fileFromPath (path) {
    try {
        var f = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
        f.initWithPath(path);
        return f;
    }
    catch(ex) {return null;}
}

/*
 * Read the entire contents of file, put each line
 * into an array.
 *
 * Taken from http://kb.mozillazine.org/index.phtml?title=Dev_:_Extensions_:_Example_Code_:_File_IO#Simple
 */
function readFileToArray (file) {
    // open an input stream from file
    var istream = Cc['@mozilla.org/network/file-input-stream;1']
        .createInstance(Ci.nsIFileInputStream);
    istream.init(file, 0x01, 0444, 0);
    istream.QueryInterface(Ci.nsILineInputStream);

    // read lines into array
    var line = {}, lines = [], hasmore;
    do {
        hasmore = istream.readLine(line);
        lines.push(line.value);
    } while (hasmore);

    istream.close();
    return lines;
}

/*
 * Given a directory, make dirname as a subdirectory if it doesn't exist.
 * Return the subdirectory as an nsILocalFile.
 */
function maybeMkDir (indir, dirname) {
    var subDir = indir.clone();
    subDir.append(dirname);
    if (!subDir.exists()) {
        subDir.create(subDir.DIRECTORY_TYPE, 0755);
    }
    return subDir;
}
