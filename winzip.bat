@echo off
REM use: winzip.bat path\to\winzip32.exe working\directory -e0|-ex output\file.zip file1 file2 file3 file4
set EXE=%1
shift
cd /d %1
shift
set ARGS=-min -a -r -p %1
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
%EXE% %ARGS% %OUTZIP% %FILES%
