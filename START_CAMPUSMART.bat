@echo off
echo ============================================================
echo   CampusMart - Persistent Server Launcher
echo   Backend (FastAPI) + Frontend (Vite)
echo   These windows persist even if Antigravity is closed.
echo ============================================================

REM ---------- Backend ----------
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "CampusMart - Backend (FastAPI)" cmd /k "cd /d c:\Users\maria\OneDrive\Desktop\Full_stack\campus-marketplace\backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait for backend to bind the port
timeout /t 4 /nobreak > nul

REM ---------- Frontend ----------
echo [2/2] Starting React/Vite Frontend on http://localhost:5173 ...
start "CampusMart - Frontend (Vite)" cmd /k "cd /d c:\Users\maria\OneDrive\Desktop\Full_stack\campus-marketplace\frontend && npm run dev"

echo.
echo ============================================================
echo   Both servers are running in their own persistent windows.
echo   They will keep running after you close Antigravity.
echo.
echo     Marketplace  ->  http://localhost:5173
echo     API Docs     ->  http://localhost:8000/docs
echo     Health Check ->  http://localhost:8000/health
echo.
echo   To STOP servers: close the "CampusMart - Backend" and
echo   "CampusMart - Frontend" windows.
echo ============================================================
echo.
echo Press any key to open the marketplace in your browser...
pause > nul
start "" "http://localhost:5173"
