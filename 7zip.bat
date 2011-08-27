@echo off
REM use: 7zip.bat path\to\7z.exe working\directory -mx0|-mx9 output\file.zip file1 file2 file3 file4
set EXE=%1
shift
set DIR=%1
cd /d %DIR%
shift
set ARGS=a -tzip -r %1
shift
set OUTZIP=%1
shift

set FILES=
:process
if "%1" == "" goto done

:: It is apparently a new requirement of 7-zip to avoid \* for filenames (or it never was working)
if "%1" == %~n1 goto isDir
else goto :isFile
:isFile
set FILES=%FILES% %1
goto endIf

:isDir
set FILES=%FILES% %1\*
goto endIf

:endIf
shift
goto process
:done
echo %EXE% %ARGS% %OUTZIP% %FILES%  -xr!.svn\ -xr!CVS\ -xr!*~
%EXE% %ARGS% %OUTZIP% %FILES%  -xr!.svn\ -xr!CVS\ -xr!*~
::pause