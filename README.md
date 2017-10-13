# AFOCCERT ��������ü��

SPA(Single Page Application) �������μ� ���� ���� ���ް� ����, �ǵ���� �����ϱ� ���� ��������ü���Դϴ�.

![afoccert Page](https://user-images.githubusercontent.com/16971994/31169916-3cc72d16-a935-11e7-852e-ada8cd1ec5ea.png)

## Getting Started

�� ü��� Apache Web Server, AngularJS, Flask(Python2.7) ������� ���۵Ǿ����ϴ�.

### Prerequisites

�����ϱ� �� �ʿ��� ����Ʈ���� ��� �� ��ġ��

```
Apache HTTP Server
Python 2.7
python-pip

sudo yum -y update
sudo yum -y install httpd python27 python-pip
```

### Installing

Apache HTTP Server�� Python2.7, pip�� ��ġ�� ���� �ʿ��� ���̺귯�� ��ϰ� ��ġ

```
sudo pip install -r requirements.txt
```

## Running the tests

### ���� ���� �� IP�� �°� �ڵ� ����

* Apache ���� ���� ����

```
sudo cp apache_configuration/* /etc/httpd/conf.d/
sudo cat "WSGISocketPrefix /var/run/wsgi" >> /etc/httpd/conf/httpd.conf
sudo cp ./* /var/www/afoccert/
```

* ���� IP�� �°� Ŀ���͸���¡

/var/www/afoccert/static/js/api.js ��

```
    window.api_url ='http://{ServerIP}:9000/api/v1.0';
```

/etc/httpd/conf.d/afoccert_app.conf ��

```
    ServerName {ServerIP}
```
�� ����

### ���� ��⵿ �� �� ����

* Apache HTTP Server (httpd) ��⵿

```
sudo systemctl restart httpd
```

* ����IP:8080���� �� ����

```
http://{ServerIP}:8080
```

## Built With

* [5hark](https://github.com/5HARK) - The Flask framework used
* [Chaht01](https://github.com/chaht01) - Web Design using AngularJS

## License

This project is licensed under the MIT License

