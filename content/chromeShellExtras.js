var RDFHistory = {}, Basics = {};
var module = Components.utils['import'];
module('resource://extensiondev/RDFHistory.js', RDFHistory);
module('resource://extensiondev/BasicLanguageUtils.js', Basics);

var chromeShellExtras = {
    /**
     * Switch the given <a> element from using href="javascript:xxx" to onclick="xxx".
     * This is needed because in Thunderbird (as of 2.0-3.0b) javascript: hrefs don't
     * work (see issue 7).
     * @param {HTMLAnchorElement} a
     */
    fixContentLinkForTB: function(a) {
        if (arguments.callee._needsContentLinkFixing === undefined) {
            const THUNDERBIRD_ID = '{3550f703-e582-4d05-9a08-453d09bdfdc6}';
            arguments.callee._needsContentLinkFixing =
                Components.classes['@mozilla.org/xre/app-info;1']
                                    .getService(Components.interfaces.nsIXULAppInfo)
                                    .ID == THUNDERBIRD_ID;
        }
        
        if (arguments.callee._needsContentLinkFixing) {
            var match = a.href.match(/^javascript:(.*)$/);
            if(match) {
                a.setAttribute('onclick', match[1] + ';return false;');
                a.href = '';
            }
        }
    }
};


function printDoScope (s, scopeObjText) {
    var newdiv = document.createElement('div');
    var a = document.createElement('a');
    a.href = "javascript:go('scope(" + scopeObjText + ")')";
    a.appendChild(document.createTextNode(s));
    chromeShellExtras.fixContentLinkForTB(a);
    newdiv.appendChild(a);
    newdiv.className = 'normalOutput';
    _out.appendChild(newdiv);
    return newdiv;
}

shellCommands.enumerateWindows = function enumerateWindows(search) {
    var wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
    var en = wm.getEnumerator('');

    var n = 0;
    Shell.enumWins = [];
    function printScopeLink (obj) {
        var isWindow = obj instanceof Window;
        var url = isWindow ? obj.location.href : obj.currentURI.spec;
        if (search && url.match(search) == null) {
            return; // doesn't match the specified search string.
        }

        if (isWindow) {
            // Top-level window object
            Shell.enumWins[n] = obj;
        } else if (obj.isRemoteBrowser) {
            // <xul:browser> object which will get special treatment
            Shell.enumWins[n] = { __specialE10sScope__: obj };
        } else {
            // direct content window
            Shell.enumWins[n] = obj.contentWindow;
        }

        var newdiv = printDoScope(url, 'Shell.enumWins[' + n + ']');
        n++;

        if (!isWindow && obj.isRemoteBrowser) {
            newdiv.classList.add("e10sScope");
        }
    }

    while (en.hasMoreElements()) {
        var w = en.getNext();
        if (w.document.getElementById('content') && w.document.getElementById('content').tagName == 'tabbrowser') {
            var b = w.document.getElementById('content');
            var ntabs = b.mPanelContainer.childNodes.length;
            for(var i=0; i<ntabs; i++) {
                var tb = b.getBrowserAtIndex(i);
                printScopeLink(tb);
            }
        }
        printScopeLink(w);
    }
};

function loadHistory () {
    var items = RDFHistory.loadHistoryItems('http://ted.mielczarek.org/code/mozilla/extensiondev#jsshell_history', 'http://ted.mielczarek.org/code/mozilla/extensiondev#jsshell_historyitem');
    histList = items;
    if (histList[histList.length-1] != '') {
        histList.push('');
    }
    histPos = (histList.length > 0) ? histList.length-1 : 0;
}

function onChromeShellExtrasLoad () {
    var a = document.createElement('a');
    a.appendChild(document.createTextNode('enumerateWindows()'));
    a.href = "javascript:go('enumerateWindows()')";
    a.setAttribute('accesskey', 'E');
    var odiv = document.getElementById('output').getElementsByTagName('div')[0];
    odiv.appendChild(document.createTextNode(' '));
    odiv.appendChild(a);
    odiv.appendChild(document.createTextNode(' (with an optional string parameter to filter enumerated windows/tabs)'));

    var links = document.getElementsByTagName('a');
    for(var i = 0; i < links.length; i++) {
        chromeShellExtras.fixContentLinkForTB(links[i]);
    }

    loadHistory();
}

function saveHistory () {
    var num = Basics.min(histList.length, 20 + 1);
    var start = histList.length - num;

    RDFHistory.saveHistoryItems(histList.slice(start, histList.length), 'http://ted.mielczarek.org/code/mozilla/extensiondev#jsshell_history', 'http://ted.mielczarek.org/code/mozilla/extensiondev#jsshell_historyitem');
}

function onChromeShellExtrasUnload () {
    saveHistory();
    RDFHistory.releaseRDFService();
}

shellCommands.propsPlus = function (o) {
    for (var x in o) {
        try {
            var v = o[x];
            if(v instanceof Function) {
                println(x + ': Function');
            }
            else {
                println(x + ': ' + v);
            }
        }
        catch(ex) {}
    }
};

window.addEventListener('load', onChromeShellExtrasLoad, true);
window.addEventListener('unload', onChromeShellExtrasUnload, true);
