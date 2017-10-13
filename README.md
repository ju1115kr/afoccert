# AFOCCERT 업무협업체계

SPA(Single Page Application) 형식으로서 업무 내용 전달과 공유, 피드백을 제공하기 위한 업무협업체계입니다.

![afoccert Page](https://user-images.githubusercontent.com/16971994/31169916-3cc72d16-a935-11e7-852e-ada8cd1ec5ea.png)

## Getting Started

본 체계는 Apache Web Server, AngularJS, Flask(Python2.7) 기반으로 제작되었습니다.

### Prerequisites

실행하기 전 필요한 소프트웨어 목록 및 설치법

```
Apache HTTP Server
Python 2.7
python-pip

sudo yum -y update
sudo yum -y install httpd python27 python-pip
```

### Installing

Apache HTTP Server와 Python2.7, pip를 설치한 이후 필요한 라이브러리 목록과 설치

```
sudo pip install -r requirements.txt
```

## Running the tests

### 파일 세팅 및 IP에 맞게 코드 수정

* Apache 설정 파일 복사

```
sudo cp apache_configuration/* /etc/httpd/conf.d/
sudo cat "WSGISocketPrefix /var/run/wsgi" >> /etc/httpd/conf/httpd.conf
sudo cp ./* /var/www/afoccert/
```

* 서버 IP에 맞게 커스터마이징

/var/www/afoccert/static/js/api.js 내

```
    window.api_url ='http://{ServerIP}:9000/api/v1.0';
```

/etc/httpd/conf.d/afoccert_app.conf 내

```
    ServerName {ServerIP}
```
로 변경

### 서비스 재기동 및 웹 접속

* Apache HTTP Server (httpd) 재기동

```
sudo systemctl restart httpd
```

* 서버IP:8080으로 웹 접속

```
http://{ServerIP}:8080
```

## Built With

* [5hark](https://github.com/5HARK) - The Flask framework used
* [Chaht01](https://github.com/chaht01) - Web Design using AngularJS

## License

This project is licensed under the MIT License

