const APP_DISPLAY_NAME = "Extension Developer";
const APP_NAME = "extensiondev";
const APP_PACKAGE = "/Ted Mielczarek/extensiondev";
const APP_VERSION = "0.3.0.20060726";

const APP_JAR_FILE = "extensiondev.jar";
const APP_CONTENT_FOLDER = "content/";
const APP_LOCALE_FOLDER  = "locale/en-US/";
const APP_SKIN_FOLDER  = "skin/";

const APP_SUCCESS_MESSAGE = "";


initInstall(APP_NAME, APP_PACKAGE, APP_VERSION);

var chromef = getFolder("Profile", "chrome");
var instFlags = PROFILE_CHROME;

addFile(APP_PACKAGE, APP_VERSION, "zip.sh", chromef, null);
addFile(APP_PACKAGE, APP_VERSION, "zip.bat", chromef, null);
addFile(APP_PACKAGE, APP_VERSION, "winzip.bat", chromef, null);
addFile(APP_PACKAGE, APP_VERSION, "cygzip.bat", chromef, null);
addFile(APP_PACKAGE, APP_VERSION, "7zip.bat", chromef, null);
addFile(APP_PACKAGE, APP_VERSION, "winrar.bat", chromef, null);
addFile(APP_PACKAGE, APP_VERSION, "wzcline.bat", chromef, null);

var err = addFile(APP_PACKAGE, APP_VERSION, "chrome/" + APP_JAR_FILE, chromef, null);

if(err >= SUCCESS) { 
	var jar = getFolder(chromef, APP_JAR_FILE);
	registerChrome(CONTENT | instFlags, jar, APP_CONTENT_FOLDER);
	registerChrome(LOCALE  | instFlags, jar, APP_LOCALE_FOLDER);
	registerChrome(SKIN  | instFlags, jar, APP_SKIN_FOLDER);
	err = performInstall();
	if(err >= SUCCESS) {
		alert(APP_NAME + " " + APP_VERSION + " has been succesfully installed.\n"
			+APP_SUCCESS_MESSAGE
			+"Please restart your browser before continuing.");
	} else { 
		alert("Install failed. Error code:" + err);
		cancelInstall(err);
	}
} else { 
	alert("Failed to create " +APP_JAR_FILE +"\n"
		+"You probably don't have appropriate permissions \n"
		+"(write access to Profile/chrome directory). \n"
		+"_____________________________\nError code:" + err);
	cancelInstall(err);
}
