REM @echo off
REM use: zip.bat path\to\zipprog.exe working\directory <args> output\file.zip <files>
REM c:\code\extensiondev\zip.bat "c:\program files\winzip\winzip32.exe" c:\code\extensiondev  -min -a -r -p -e0 c:\code\extensiondev\chrome\extensiondev.jar content locale skin
set EXE=%1
shift
cd /d %1
shift
set REST=
:process
if "%1" == "" goto done
set REST=%REST% %1
shift
goto process
:done
%EXE% %REST%
