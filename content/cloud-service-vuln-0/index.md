---
emoji: 🤭
title: 클라우드 서비스 취약점 분석 0 (클라우드 서비스 취약점 개요)
author: Zer0Luck
date: '2021-12-31 13:12:21'
categories: CLOUD
tags: Cloud Vulnerability Security
---

# 클라우드 서비스 취약점 분석 0

# 클라우드 컴퓨팅 보안

- 기업, 조직 내의 데이터, 애플리케이션, 워크로드를 클라우드 컴퓨팅에 저장하고 다양한 서비스로 활용하며 서로가 공유하면서 지속적으로 변화가 발생합니다. 이와 동시에 새로운 보안 위협과 과제도 생겨나며 많은 양의 데이터가 퍼블릭 클라우드 서비스에 저장되면서 해커들의 공격 목표가 됐습니다.

# Public Cloud &  Private Cloud

### Public Cloud

- Azure, AWS, GCP, Alibaba, NCP 등 다양한 클라우드 서비스
- LasS, PasS, SaaS 등 다양한 스펙트럼의 서비스 제공

### Private Cloud

- 조직 내 클라우드, 개인정보 관리 등 직접 구축할 이유가 있을 때 사용
- Public Cloud 사업자 시작 이전 단계가 필요한 경우 사용
- OpenStack을 주로 많이 이용

### OpenStack

- Rackspace, NASA가 공동개발로 2010년에 Release한 오픈 소스 클라우드 컴퓨팅 플랫폼입니다.
- 이미징, 네트워킹, 컴퓨팅, 볼륨 관리 및 인증 관리 등 클라우드 서비스를 제공하기 위해 각각의 자원관리 지능을 프로젝트 단위로 관리합니다.
- 실제로는 EC2, VCP, ... 각 역활에 대해서 호환되는 정도가 많습니다.
- 클라우드 시스템을 구축할 때는 가상화가 필수 이며 이미지, 볼륨을 관리할 시스템이 필요합니다.

![[https://www.openstack.org/](https://www.openstack.org/)](./overview-diagram-new.svg)

[https://www.openstack.org/](https://www.openstack.org/)

### Nova Compute Service

- OpenStack 에서 가장 중요한 서비스에 해당되며, Hyper-V를 호출해서 각 인스터를 생성하고 관리하는 역활을 수행합니다.
- 대시보드 등에서 RESETful API 형태인 nova-api를 통해서 인스턴스 생성 등의 명령을 전달합니다.
- Nova-Computer 를 거쳐서 Hyper-V에 명령을 전달하고,최종적으로 명령을 수행합니다.
- 생성된 인스턴스는 nova-console을 통해 통신이 가능합니다.

![[https://docs.openstack.org/nova/pike/user/architecture.html](https://docs.openstack.org/nova/pike/user/architecture.html)](./nova-arch.png))

[https://docs.openstack.org/nova/pike/user/architecture.html](https://docs.openstack.org/nova/pike/user/architecture.html)

# AWS IAM

- AWS 리소스에 대한 권한 및 접근 제어를 리소스별로 세분화하여 제어할 수 있는 서비스 입니다.
- Group, User, Role, Policy로 설정이 가능합니다.
- 권한 상승, 유출 문제 등 취약저 분석 과정에서 가장 눈여겨봐야 하는 부분중 하나입니다.
- 주로 구축했던 시기에 취약점이 발생되어 노출이 되는 경우 입니다.

### PBAC 설명

```
[사용자]
피터 - 기사     <그룹: 공격대1>
케빈 - 마법사   <그룹: 공격대1>
레이 - 힐러     <그룹: 공격대1>

[그룹]
공격대1         <역활: ['몬스터 잡기']>

[역활]
몬스터 잡기     <정책:  [일반 공격]>

[정책]
Allow 일반 공격 if 사용자.마법사? == True (MP Object 사용)
Allow 일반 공격 if 사용자.전사? == True (HP Object 사용)
Allow 일반 공격 if 사용자.힐러? == True (GP Object 사용)
```

- 관리의 용이성을 위해 동일한 그룹내에 사용자를 편성 합니다.
- 편성된 그룹에 한하여 수행할 수있는 역활을 부여합니다.
- 역활 수행시 그룹 내 정해진 사용자에 한하여 수행하도록 정책을 설정합니다.
- 역활 수행시 정해진 객체에 한해서 접근하여 수행하도록 정책을 설정합니다.

### IAM 정책

- JSON 포맷을 사용하며 각 데이터를 세분화해서 관리를 진행합니다.

[IAM JSON 정책 언어의 문법](https://docs.aws.amazon.com/ko_kr/IAM/latest/UserGuide/reference_policies_grammar.html)

# EC2

- virtualization Compute Instance, 가장 일반적으로 생성해서 사용하는 서비스입니다.
- AMI (Image), EBS(Volume)을 이용해서 인스턴스 백업이 가능합니다.
- 외부에서 Exploit 진행시 비중이 가장 높은 인스턴스 입니다.

# S3

- 업로드, 다운로드 등의 행위로만 구성된 Storage Instance 입니다.
- 정적 웹 서비스 요소로 구축이 가능합니다.
- 보안사고에서 자주 언급된는 S3 data breach가 이 곳의 데이터 유출을 말합니다.

```
https://s3.console.aws.amazon.com/s3/home?region=ap-northeast-2
```

# Lambda

- 이벤트 기반의 서버리스 서비스 인스턴스 (Python, nodeJS, Go, .NET, Ruby 지원) 입니다.
- 내부적으로 Amazon Linux AMI에서 생성되는 컨테이너, +egress controller
- API Gateway, S3, SQ3, SNS 등과의 다양한 조합으로 사용가능한 서버리스 구조입니다.

```
https://console.aws.amazon.com/lambda/home?region=ap-northeast-2
```

# AWS 공격 벡터

- IAM 의 권한 문제로 인해 많은 보안 문제가 야기됩니다.
- IAM Leak  (환경 변수, Instance Post Exploitation, SSRF...)
- IAM Privilege Escalation
- S3 Data Breach
- 개발 구축 환경에서 발생 가능한 취약점 (CI/CD, Code Deploy, Terraform, ...)


```toc
```