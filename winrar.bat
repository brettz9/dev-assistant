@echo off
REM use: winrar.bat path\to\WinRAR.exe working\directory -m0|-m5 output\file.zip file1 file2 file3 file4
set EXE=%1
shift
cd /d %1
shift
set ARGS=a -afzip -ibck -r %1 -eH -x*\.svn\* -x*\CVS\* -x*~
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
