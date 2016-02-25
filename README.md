# python 가상 환경 구축
## WINDOWS
python(2.7) 설치

    pip install virtualenv
    virtualenv <환경이름>
    <환경이름>\Script\activate.bat
    pip install -r requirement.txt


# DB 생성
## WINDOWS
    python manage.py db init
    python manage.py db migrate
    python manage.py db upgrade