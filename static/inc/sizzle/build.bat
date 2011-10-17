@echo off
if "%1" == "-min" (
ant -Dcompress=yes > build.log
pause
exit
)
ant > build.log
pause
exit