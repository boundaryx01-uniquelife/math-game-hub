@echo off
chcp 65001 > null
echo ===================================================
echo  수학탐정단: 암호 연구소 탈출 v2 - Netlify 배포 도우미
echo ===================================================
echo.
echo 이 스크립트는 Netlify CLI를 이용해 웹앱을 배포합니다.
echo 먼저 Netlify 로그인을 진행한 뒤, 바로 배포를 시도합니다.
echo.
echo [안내] 브라우저 창이 열리면 Netlify 로그인을 승인해 주세요.
echo.
pause
echo.
echo [1/2] Netlify 로그인 상태를 확인하고 로그인을 진행합니다...
call npx netlify login
echo.
echo [2/2] 현재 폴더를 Netlify 프로덕션(실제 배포) 사이트로 업로드합니다...
call npx netlify deploy --dir=. --prod
echo.
echo ===================================================
echo  배포가 완료되었습니다! 위의 Website URL로 접속해 보세요.
echo ===================================================
pause
