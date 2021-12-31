---
emoji: 🤭
title: "클라우드 서비스 취약점 분석 7 (CloudGoat: RCE Web APP)"
author: Zer0Luck
date: '2021-12-31 13:12:21'
categories: CLOUD
tags: Cloud Vulnerability Security
---
# 클라우드 서비스 취약점 분석 7

# [Scenario 6]:  RCE Web APP

```bash
Size: Medium
Difficulty: Hard
Command: $ ./cloudgoat.py create rce_web_app
```

## 시나리오 개요

### 자원

- VPC (ELB, EC2, S3*3, RDS)
- IAM user * 2

### 취약점

- IAM User (Lara)
- IAM User (McDuck)
- RCE취약점이 발생하는 웹 애플리케이션에서 원격 코드를 실행하고 VPC 내부에서 root EC2 액세스 권한 획득
- 권한 상승이 가능한 정책이 사용가능한 Instance profile에 정의

### 목표

- RDS 데이터베이스에서 비밀 저장소를 찾아야 합니다.
- IAM User Lara로 시작해서 AWS 환경을 분석을 하는 중에 로드 밸랜서, S3 Bucket을 분석하면서 취약한 웹 애플리케이션에 대한 RCE Exploit을 시도합니다.
- RCE를 통해서 RDS 데이터베이스에 접근합니다.
- 두 번째 IAM 사용자 McDuck으로 시작해서 S3 Bucket을 열거한 결과 EC2 서버와 데이터베이스에 대해 직접적인 액세스 권한을 부여하는 SSH키를 찾을 수 있습니다.

### exploit 흐름도

![32.png](./32.png)

### 시나리오 환경설정

![Untitled](./0.png)

### exploit 시나리오 흐름도

**Lara IAM 사용자를 사용하여 exploit**

- Lara 사용자, 공격자는 AWS 환경을 분석하고 Security Load Balance 뒤에 호스팅되는 웹 애플리케이션을 발견할 수 있습니다.
- 공격자는 S3 Bucket을 나열하여 로드 밸런서에 대한 로그가 포함되어진 버킷을 발견하였습니다.
- 로드 밸런서 로그의 내용을 분석하는 동안 공격자는 웹 애플리케이션에 Security Admin Page가 있음을 확인할 수 있습니다.
- Security Admin URL을 방문하면 공격자는 웹 애플리케이션상에서 Security Paramter를 통해서 RCE 공격을 수행할 수 있다는 것을 발견할 수 있습니다.
- 공격자는 해당 취약점을 이용하여 웹 애플리케이션을 호스팅하는 EC2 인스턴에 대한 쉘 권한을 획득할 수 있습니다.

**Shell 권한 획득 후 두 가지 방향**

1. EC2 메타데이터 서비스를 Exploit 해서 DB 정보를 수집합니다.
    - EC2 메타데이터 서비스를 쿼리를 통해서 RDS 데이터베이스 Credential 과 Address 정보를 수집합니다.
    - 공겨자는 발견한 Credential 을 사용해서 RDS 데이터베이스에 액세스 할 수 있고 시나리오의 목표인 RDS 데이터베이스에 저장된 정보를 확인할 수 있습니다.
2. EC2 쉘을 이용하여 S3 bucket 리스트를 확인합니다.
    - 쉘을 획득한 EC2 인스턴스를 통해서 공격자는 Private S3 Bucket에 액세스할 수 있습니다.
    - Private S3 Bucket 내에서 공격자는 RDS Database에 대한 로그인 Credential이 포함된 텍스트 파일을 찾을 수 있습니다.
    - 공격자는 EC2 인스턴스를 사용해서 Credential 파일에서 참조하는 RDS 데이터베이스를 나열 하고 분석합니다.
    - 공격자는 서버에서 발견한 Credential을 사용해서 RDS 데이터베이스에 액세스할 수 있고 시나리오의 목표인 RDS 데이터베이스에 저장된 Security Text를 획득할 수 있습니다.

**McDuck IAM 사용자를 사용하여 Exploit**

- AWS 환경을 분석을 통해서 AWS CLI Credential ket를 사용해서 S3 bucket을 나열하여 발견할 수 있습니다.
- 공격자는 다양한 리스트에서 S3 Bucket을 발견하지만 하나만 접근을 할 수 있고 하나의 S3 Bucket 내에서 one-pair ssh key를 찾을 수 있습니다.
- 공격자는 EC2 인스턴스를 나열하고 로드 밸런서 뒤에서 EC2 인스턴스를 찾습니다.
- 공격자는 S3 Bucket 에서 발견한 SSH 키를 통해서 공격자가 EC2 인스턴스에 로그인이 가능하다는 것을 확인할 수 있습니다.
- EC2 인스턴스를 통해서 작업하고 공격자는 Private S3 Bucket을 분석하고 접근이 가능합니다.
- Private S3 Bucket내에서 공격자는 RDS 데이터베이스에 대한 로그인 Credential이 포함된 텍스트 파일을 발견할 수 있습니다.
- 공격자는 해당 Credential 파일에서 참조하는 RDS 데이터베이스를 나열하고 검색할 수 있습니다.
- 공격자는 발견 한 자격증명을 사용하여 RDB 데이터베이스에 액세스하고 시나리오 목표인 RDS 데이터베이스에 저장된 정보를 찾을 수 있습니다.

## Exploit 시나리오

### RDS (Amazon Relational Database Service)

- 클라우드에서 관계형 데이터베이스를 간편하게 설정, 운영 및 확장할 수 있습니다.
- 하드웨어 프로비저닝, 데이터베이스 설정, 패치 등 소목적인 관리 작업을 자동화하면서 비용 효육적이고 크기 조정 가능한 용량을 제공합니다.
- 다양한 데이터베이스 인스턴스 유형으로 메모리, 성능 또는 I/O 최적화등을 제공합니다.

### IAM User: McDuck 접근 가능한 정책 나열

![Untitled](./1.png)

```python
cloudgoat_output_aws_account_id = 712987748923
cloudgoat_output_lara_access_key_id = AKIA2MALBVI5YAO7B4DO
cloudgoat_output_lara_secret_key = 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
cloudgoat_output_mcduck_access_key_id = AKIA2MALBVI5X7OK4FG5
cloudgoat_output_mcduck_secret_key = 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
```

![Untitled](./2.png)

- 유출된 McDuck 의 AWS Credential을 통해서 사용할 수 있는 서비스를 나열하였습니다. 관련 권한들을 보면 `EC2, RDS, S3` 권한이 있는 것을 확인할 수 있어 뭔가 공격할 수 있는 벡터가 많아 보입니다.

### S3 Bucket 리스트 분석및 하드 코딩된 SSH key 수집

- AWS 계정에서 S3 버킷을 나열해 보겠습니다.

![Untitled](./3.png)

- AWS 게정에서는 3개의 Cloud Goat와 관련된 버킷이 있는 것을 확인할 수 있습니다. 해당 S3 버킷을 다운로드 해보겠습니다.

```python
aws s3 sync s3://cg-keystore-s3-bucket-rce-web-app-cgid7ge6zuhcu1 ./key --profile mcduck
```

![Untitled](./4.png)

### SSH 접속전 준비 과정

- `keystore`에서 파일을 다운로드하였는데 이는 SSH key-pair 처럼 보입니다. SSH key-pari, EC2 인스턴스를 나열할 수 있는 기능이 있기 때문에 SSH로 접근이 가능한 EC2 인스턴스가 있는지 확인하였습니다.

![Untitled](./5.png)

```python
aws ec2 describe-instances --query "Reservations[*].Instances[*].Tags" --output text --profile mcduck
```

- AWS 게정에서 실행중인 EC2 인스턴스가 있는 것을 확인할 수있으며 SSH key-pair를 사용하여 EC2 인스턴스에 접근을 해보도록 하겠습니다.
- 먼저 접근을 하기전에 공용 IP를 알아야 하기 때문에 자주 사용하던 쿼리로 `PublicIpAddress` 를 조회하였습니다.

```python
aws ec2 describe-instances --query "Reservations[*].Instances[*].PublicIpAddress" --output text --profile mcduck
```

- 다음과 같이 해당 EC2 서버의 IP 대역을 확인하고 접속할 준비를 합니다.

![Untitled](./6.png)

![Untitled](./7.png)

- 와우 키를 획득하고 접속을 시도하니 접속이 성공된 것을 확인할 수 있습니다.
- EC2 인스턴스에는 S3 Storage와 상호 작용할 수 있는 인스턴스 프로파일이 있는 것이 기본적인 패턴 입니다.

### 접근 가능한 S3 Bucket 분석

- EC2 인스턴스가 다른 두 곳의 S3 bucket에 있는 객체 에 접근할 수 있는지 확인해 보겠습니다.

```python
aws s3 sync s3://cg-secret-s3-bucket-rce-web-app-cgid7ge6zuhcu1 ./secret
```

![Untitled](./8.png)

- EC2 인스턴스에는 S3 Bucket에서 객체를 다운로드 할 수 있는 권한이 `cg-secret-s3-bucket-rce-web-app-cgid7ge6zuhcu1` 에 있습니다..
- 다운로드한 파일에는 데이터베이스 Credential 이 있지만 해당 정보를 가지고 어디에서 사용할지를 모릅니다.

### RDS Instance 나열 및 PostgreSQL 접속

- IAM 사용자 McDuck은 AWS 계정의 RDS 인스턴스를 나열한 권한이 있습니다.

```python
aws rds describe-db-instance --region us-east-1
```

![Untitled](./9.png)

- AWS 계정에 `Postgress` 을 사용하는 RDS 인스턴스가 있지만 Public으로 접근이 불가능 합니다.
- 인스턴스 설명에서 EC2 인스턴스와 RDS 인스턴스가 동일한 VPC에 있었기 때문에  EC2가 터미널을 사용하여 연결할 수있습니다.

```python
"DBInstances": [
        {
            "DBInstanceIdentifier": "cg-rds-instance-rce-web-app-cgid7ge6zuhcu1",
            "DBInstanceClass": "db.t2.micro",
            "Engine": "postgres",
            "DBInstanceStatus": "available",
            "MasterUsername": "cgadmin",
            "DBName": "cloudgoat",
            "Endpoint": {
                "Address": "cg-rds-instance-rce-web-app-cgid7ge6zuhcu1.cklw91kahwum.us-east-1.rds.amazonaws.com",
                "Port": 5432,
                "HostedZoneId": "Z2R2ITUGPM61AM"
            },
            "AllocatedStorage": 20,
            "InstanceCreateTime": "2021-08-14T04:55:48.745Z",
            "PreferredBackupWindow": "09:34-10:04",
            "BackupRetentionPeriod": 0,
            "DBSecurityGroups": [],
            "VpcSecurityGroups": [
                {
                    "VpcSecurityGroupId": "sg-0a6dd31c217ba1c3b",
                    "Status": "active"
                }
            ],
```

- `DBInstance` 에서 추려할 데이터는 `Endpoint` 값에서 Address 부분이다. 해당 주소는 rds의 인스턴스 id로 ssh상에서 postgresql에 접속할때 필요한 부분이다.

```python
psql postgresql://cgadmin:Purplepwny2029@cg-rds-instance-rce-web-app-cgid7ge6zuhcu1.cklw91kahwum.us-east-1.rds.amazonaws.com:5432/cloudgoat

psql postgresql://cgadmin:Purplepwny2029@[rds_instance]:5432/cloudgoat

```

- `psql` 클라이언트를 사용하여 RDS에 연결하고 성공적으로 로그인이 된 것을 확인할 수 있습니다.
- PostgreqSQL 명령을 통해 테이블 을 조회하고 해당 테이블의 구성 내용들을 확인해 보았습니다.

![Untitled](./10.png)

### Lara IAM User 허용가능한 정책 분석

- Lara 역시 mcduck과 마찬가지로 IAM 사용자인 Lara의 AWS Credentail로 사용하 수 있는 권한에 대해 열거를 해보았습니다.

![Untitled](./11.png)

- IAM 사용자 Lara는 일부 EC2, RD3, S3 권한이 있는 것을 확인할 수 있습니다. 똑같이 AWS 계정에 S3 bucket들을 나열해 보겠습니다.

![Untitled](./12.png)

- AWS 계정에는 3개의 Cloud Goat 관련된 Bucket들이 존재하고 S3 bucket의 콘텐츠를 다운로드하였습니다.

![Untitled](./13.png)

- IAM 사용자 Lara는 `cg-logs-s3-bucket-rce-web-app-cgid7ge6zuhcu1` S3 bucket을 다운 받았으며 해당 파일은 Elastic Load Balancer(ELF) 서비스용 AWS log처럼 확인할 수있다.

### ELB 로그 수집 및 분석

**Elastic Load Balancing(ELB)**

- AWS 배포를 위한 Load Balancer Service이며 ELB는 들어오는 애플리케이션 트래픽을 자동으로 분석하고 트래픽 수요를 충족하도록 리소를 확장할 수 있습니다.
- 애플리케이션 트래픽인 AWS EC2 인스턴스, 컨테이너, IP address, Lambda 함수 등 여러 애플리케이션를 대상으로 자동 분산을 진행합니다.

![Untitled](./14.png)

- ELB 로그 분석을 진행하기 위해서 `elb-log-analyzer` 도구를 이용하였습니다. 해당 도구는 NodeJs기반으로 동작하며 웹 애플리케이션 상에서 동작한 모든 URL에 대한 카운팅을 해줍니다.

[elb-log-analyzer](https://www.npmjs.com/package/elb-log-analyzer)

![Untitled](./15.png)

- 로그 파일의 URL Access 정보들을 확인할 수 있습니다. 해당 URL로 이동을 해보면 오류가 발생하는데 실제로 실행중인 로드 밸랜서가 있는지 확인을 했습니다.

```python
aws elbv2 describe-load-balancers --profile lara
```

![Untitled](./16.png)

- load balancer가 `active` 인 상태로 있고 `DNSName` 을 통해서 웹 애플리케이션에 접속을 해보겠습니다.

### 웹 애플리케이션 접근 및 RCE 취약점 트리거

![Untitled](./17.png)

- 해당 도메인에 접속을 해보니 `Gold-Star`  를 가기위한 티켓을 팔고 있는 거 같고 해당 글을 읽어보면 티겟이 있는 경우 secret URL로 접근을 하라는 메시지가 있다.
- 아까 ELB 로그를 통해서 비밀스러운 URL 이 존재한다는 것을 알 수 있었는데

![Untitled](./18.png)

![Untitled](./19.png)

- 해당 URL 쪽으로 이동하게 되면 특정 문자열을 입력할 수있는 공간이 생깁니다.

![Untitled](./20.png)

- 오 커맨드를 입력하라는 곳에 커맨드를 입력해보면 리눅스 명령이 실행되고 이는 리눅스 서버라는 사실을 알 수 있으며 현재 돌아가는 데몬은 root권한인 것도 알 수 가 있습니다.

![Untitled](./21.png)

- 다음과 같이 리눅스 명령이 실행이 가능하기 때문에 RCE 취약점에 대해 트리거를 할 수있으며 `uname -a` 명령을 통해서 서버의 세부 정보를 확인할 수 가 있 습니다.
- EC2 인스턴스의 애플리케이션에서 RCE 를 발견한 경우 가장 가치가 있는 작업은 IMDS를 사용하여 IAM 자격 증명을 훔치는 것입니다.
- IAM Credential 외에 인스턴스 Metadata 를 사용해서 EC2 인스턴스를 시작할 때 지정된 사용자 데이터에 액세스를 할 수있습니다.

![Untitled](./22.png)

- 다음과 같이 EC2의 사용자 데이터에는 EC2 인스턴스에서 RDS 인스턴스에 연결하기 위한 명령들이 포함되어 있습니다
- 해당 명령에서는 RDS 인스턴스에 대한 Credential, Endpoint가 포함되어 있고 해당 파일은 RDS 인스턴스에 저장된 비밀정보를 확인할 수 있습니다.

```toc
```