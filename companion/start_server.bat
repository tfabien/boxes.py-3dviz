@echo off
rem Starts the local Boxes.py server used by the "Generate" button of the 3D viewer
cd /d "%~dp0"
python boxes_local_server.py
pause
