var extDevExt = {};

window.addEventListener("load", function() {

  // prefs for debugging.  true should mean enabled.
  var debuggingPrefs = ["nglayout.debug.disable_xul_cache", "javascript.options.showInConsole", "browser.dom.window.dump.enabled"];
  
  /*
   * Open this tool in a new window (uses a little xul file to work
   * with Thunderbird)
   */
  function doOpenTool_newWin(url)
  {
    var w = window.openDialog(url, "_blank", "all=no,scrollbars=yes,resizable=yes,dialog=no");
  }
  
  /*
   * Open this tool in a new tab
   */
  function doOpenTool_newTab(url)
  {
    var br = getBrowser();
    br.selectedTab = br.addTab(url);
  }
  
  /*
   * Open one of the tools.  The click modifiers determine whether
   * to use current window, new tab, or new window.
   */
  function doOpenTool(ev, title, url)
  {
    // ev.button appears to be undefined in trunk builds...
    // it comes out as 65535
    if(ev.ctrlKey) { // new tab
      doOpenTool_newTab(url);
    }
    else if(ev.shiftKey) { // open in current window
      getBrowser().loadURI(url);
    }
    else { // new window (default)
      doOpenTool_newWin(url);
    }
  }
  
  function doLoadExtensionBuilder(url)
  {
    doOpenTool_newWin(url);
  }
  
  function doLoadJSInjector(url)
  {
    window.openDialog(url, "_blank", "all=no,scrollbars=no,resizable=yes,dialog=no");
  }
  
  function doToggleExtensionDevPrefs(menuitem)
  {
    var chk = menuitem.getAttribute("checked");
    if(chk == "" || chk == "false")
     doSetDebuggingPrefs(false);
    else
     doSetDebuggingPrefs(true);
  }
  
  function doSetDebuggingPrefs(v)
  {
    try {
      var mPrefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
      for(var i=0; i<debuggingPrefs.length; i++)
	mPrefs.setBoolPref(debuggingPrefs[i], v);    
    }
    catch(e) {}
  }
  
  function doReloadAllChrome()
  {
    try {
      // assuming bug 256504 makes it in, this should work with jar files
      Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService(Components.interfaces.nsIXULChromeRegistry).reloadChrome();
    } catch(e) { alert(e) }
  }

  function doReopenWindow(app)
  {
    if (app == "Firefox") {
      window.close();
      window.open();
    } else if (app == "Thunderbird") {
      var w = window.open("chrome://messenger/content/messenger.xul",
                           "_blank", "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");
      // thunderbird needs this window alive during its load handler
      w.addEventListener("load", function() {
          setTimeout(function() { window.close(); }, 0);
        }, false);
    } else {
      alert("Extensiondev: 'Reopen this window' not implemented for this application.");
    }
  }

  function doRestart() {
    var appStartup = Components.interfaces.nsIAppStartup;
    Components.classes["@mozilla.org/toolkit/app-startup;1"]
              .getService(appStartup).quit(appStartup.eRestart |
                                           appStartup.eAttemptQuit);
  }

  function extensiondev_init()
  {
    var rv = false;
    // set the "debugging prefs" menuitem
    var mPrefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    try {
      for(var i=0; i<debuggingPrefs.length; i++)
	rv = rv || mPrefs.getBoolPref(debuggingPrefs[i]);
    }
    catch(e){}
  
    doSetDebuggingPrefs(rv);
    document.getElementById("extensiondev_toggleprefs").setAttribute("checked", rv);
  
    // dump js console errors to stdout
    /*FIXME: This appears to be buggy.
    var consoleObserver = {
      observe : function(msg) {
	try {
	var si = msg.QueryInterface(Components.interfaces.nsIScriptError);
	if(si) {
	  var ise = Components.interfaces.nsIScriptError;
	  var type = "Error";
	  if(si.flags & ise.warningFlag)
	    type = "Warning";
	  dump(type + ": " + si.message + "\n");
	}
	else {
	  dump(msg.message + "\n");
	}
	}
	catch(e) {
	  dump("Error reporting error!\n");
	}
      },
      QueryInterface: function (iid) {
	  if (!iid.equals(Components.interfaces.nsIConsoleListener) &&
	      !iid.equals(Components.interfaces.nsISupports)) {
		  throw Components.results.NS_ERROR_NO_INTERFACE;
	      }
	  return this;
      }
    };
    var cs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    cs.registerListener(consoleObserver);
    */
  }

  extensiondev_init();

  extDevExt.doOpenTool = doOpenTool;
  extDevExt.doOpenTool_newWin = doOpenTool_newWin;
  extDevExt.doLoadJSInjector = doLoadJSInjector;
  extDevExt.doReloadAllChrome = doReloadAllChrome;
  extDevExt.doReopenWindow = doReopenWindow;
  extDevExt.doRestart = doRestart;
  extDevExt.doLoadExtensionBuilder = doLoadExtensionBuilder;
  extDevExt.doToggleExtensionDevPrefs = doToggleExtensionDevPrefs;

}, false);
