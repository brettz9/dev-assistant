@echo off
REM use: cygzip.bat path\to\zip.exe working\directory -0|-e9 output\file.zip file1 file2 file3 file4

set EXE=%1
shift
cd /d %1
shift
set ARGS=-q -r %1
shift
set OUTZIP=%1
shift
set FILES=
:process
if "%1" == "" goto done
set FILES=%FILES% %1
shift
goto process
:done

%EXE% %ARGS% %OUTZIP% %FILES% -x \*~ -x \*.svn\* -x \*CVS\*

