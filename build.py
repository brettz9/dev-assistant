#!/usr/bin/env python
# build.py -- builds JAR and XPI files for mozilla extensions
#   by Ted Mielczarek <ted.mielczarek@gmail.com>
# Based on build.sh
#   by Nickolay Ponomarev <asqueella@gmail.com>
#   (original version based on Nathan Yergler's build script)

# This script assumes the following directory structure:
# ./
#   chrome.manifest
#   install.rdf
#   (other files listed in $ROOT_FILES)
#
#   content/    |
#   locale/     |} these can be named arbitrary and listed in $CHROME_PROVIDERS
#   skin/       |
#
#   defaults/   |
#   components/ |} these must be listed in $ROOT_DIRS in order to be packaged
#   ...         |
#
# Script's output is:
# ./$APP_NAME.xpi
# ./$APP_NAME.jar  (only if $KEEP_JAR=1)
#
# Note: It modifies chrome.manifest when packaging so that it points to 
#       chrome/$APP_NAME.jar!/*

#
# default configuration file is ./config_build.sh

import os.path
import sys
import re
from zipfile import ZipFile, ZIP_STORED, ZIP_DEFLATED

def ReadConfig(config_file):
    """Read key=value pairs from a config file. Treat lines starting with
    # as comments, strip quotes from around the value.
    Returns a dict of key, value pairs.
    """
    d = {}
    for line in file(config_file):
        if line.startswith("#"):
            continue
        if line.find('=') == -1:
            continue
        (var,val) = line.split('=',1)
        var = var.strip()
        val = val.strip()
        val = val.strip('\"\'')
        d[var] = val
    return d

def GetZipPath(file, dir, dirname):
    """Given an absolute file path, an absolute directory path, and the dirname
    of the directory, return a relative path to the file from the parent
    directory of the given directory, with unix-style path separators.
    """
    file = dirname + file[len(dir):]
    return file.replace("\\", "/")

def GetFiles(dir, dirname):
    """Given a directory and the dirname of the directory, recursively
    traverse the directory and return a list of tuples containing
    (filename, relative filename), where 'relative filename' is
    generated using GetZipPath.
    """
    files = []
    for (dirpath, dirnames, filenames) in os.walk(dir, True):
        # skip emacs backup files
        files.extend([os.path.join(dirpath, f) for f in filenames
                      if not f.endswith("~")])
        # skip CVS and .svn dirs
        # funky slice assignment here
        dirnames[:] = [d for d in dirnames if d != 'CVS' and d != '.svn']
    return [(f, GetZipPath(f, dir, dirname)) for f in files]

path = os.path.dirname(os.path.abspath(sys.argv[0]))
config = ReadConfig(os.path.join(path, "config_build.sh"))

if not 'APP_NAME' in config or not 'CHROME_PROVIDERS' in config:
    print >>sys.stderr, "You need a config_build.sh"
    sys.exit(1)

appname = config['APP_NAME']
jarfile = os.path.join(path, appname+'.jar')
xpifile = os.path.join(path, appname+'.xpi')
# clean up existing jar/xpi files
try:
    os.remove(jarfile)
    os.remove(xpifile)
except:
    pass

# Get list of all files in chrome provider paths
jarfiles = []
for chromedir in config['CHROME_PROVIDERS'].split():
    jarfiles.extend(GetFiles(os.path.join(path,chromedir), chromedir))

jarzip = ZipFile(jarfile, 'w', ZIP_STORED)
for j in jarfiles:
    jarzip.write(j[0], j[1])
jarzip.close()

# Necessary files: the jar and install.rdf
xpifiles = [(jarfile,'chrome/'+appname+'.jar'), ('install.rdf','install.rdf')]

# Optional directories to add to the XPI
if 'ROOT_DIRS' in config:
    for rootdir in config['ROOT_DIRS'].split():
        xpifiles.extend(GetFiles(os.path.join(path,rootdir), rootdir))

# Optional files to add to the XPI
if 'ROOT_FILES' in config:
    xpifiles.extend([(f,f) for f in config['ROOT_FILES'].split()])

xpizip = ZipFile(xpifile, 'w', ZIP_DEFLATED)
for x in xpifiles:
    xpizip.write(x[0], x[1])

# munge chrome.manifest into having jar entries
manifest = os.path.join(path, 'chrome.manifest')
if os.path.exists(manifest):
    manifest_munged = ''
    contentre = re.compile(r'^(content\s+\S*\s+)(.*)$')
    skinlocre = re.compile(r'^(skin|locale)(\s+\S*\s+\S*\s+)(.*)$')
    for line in file(manifest):
        line = line.rstrip()
        line = contentre.sub(r'\1jar:chrome/'+ appname +r'.jar!/\2', line)
        line = skinlocre.sub(r'\1\2jar:chrome/'+ appname +r'.jar!/\3', line)
        manifest_munged += line + "\n"
    xpizip.writestr('chrome.manifest', manifest_munged)
xpizip.close()

print "Done!"
