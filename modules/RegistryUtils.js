var EXPORTED_SYMBOLS = [
    'getRegKey'
];

var Cc = Components.classes, Ci = Components.interfaces;


/*
 * Read a registry value using the FF1.5+ API.
 */
function readRegistryValue (wrk, value) {
    switch (wrk.getValueType(value)) {
        case wrk.TYPE_STRING:
            return wrk.readStringValue(value);
        case wrk.TYPE_BINARY:
            return wrk.readBinaryValue(value);
        case wrk.TYPE_INT:
            return wrk.readIntValue(value);
        case wrk.TYPE_INT64:
            return wrk.readInt64Value(value);
    }
    // unknown type?
    return null;
}

/*
 * Get a windows registry key.    root is one of 'HKCR', 'HKLM'.
 * Key is the key name.    name is the name of the value
 * to get.    Use "" to get the default value.
 *
 * Returns the value or null.
 */
function getRegKey (root, key, name) {
    var wss;
    if ('@mozilla.org/windows-registry-key;1' in Cc) {
        // Firefox 1.5+
        try {
            var wrk = Cc['@mozilla.org/windows-registry-key;1']
                                        .createInstance(Ci.nsIWindowsRegKey);
            var introot = wrk.ROOT_KEY_CLASSES_ROOT;
            switch(root) {
            case 'HKCR':
                introot = wrk.ROOT_KEY_CLASSES_ROOT;
                break;
            case 'HKCU':
                introot = wrk.ROOT_KEY_CURRENT_USER;
                break;
            case 'HKLM':
                introot = wrk.ROOT_KEY_LOCAL_MACHINE;
                break;
            }
            wrk.open(introot,
                             key,
                             wrk.ACCESS_READ);
            var val = readRegistryValue(wrk, name);
            wrk.close();
            return val;
        }
        catch (ex) {
            return null;
        }
    }
    else if ('@mozilla.org/winhooks;1' in Cc) {
        // SeaMonkey or other older non-toolkit application
        wss = Cc['@mozilla.org/winhooks;1'].getService(Ci.nsIWindowsRegistry);
        return wss.getRegistryEntry(wss[root], key, name);
    }
    else if ('@mozilla.org/browser/shell-service;1' in Cc) {
        wss = Cc['@mozilla.org/browser/shell-service;1']
                                                .getService(Ci.nsIWindowsShellService);
        if ('getRegistryEntry' in wss) {
            // Firefox 1.0
            return wss.getRegistryEntry(wss[root], key, name);
        }
    }
    return null;
}
