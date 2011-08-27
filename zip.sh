#!/bin/bash
# use: zip.sh <zip prog name> <working dir> -0|-9 <output zip file> <input files>
ZPROG=$1
pushd $2 > /dev/null
ARGS="-r -q $3"
OUTZIP=$4
shift 4
$ZPROG $ARGS $OUTZIP $@ -x \*~ -x \*.svn\* -x \*CVS\*
popd > /dev/null
