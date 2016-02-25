# python 가상 환경 구축
## WINDOWS
python(2.7) 설치

    pip install virtualenv
    virtualenv <환경이름>
    <환경이름>\Script\activate.bat
    pip install -r requirement.txt
    cd <환경이름>\Script\
    
activate.bat 파일에서 두번째 줄을 set "VIRTUAL_ENV=your:\virtualevn\directory"으로 수정

# DB 생성
## WINDOWS
    
    <환경이름>\Script\activate.bat
    python manage.py db init
    python manage.py db migrate
    python manage.py db upgrade