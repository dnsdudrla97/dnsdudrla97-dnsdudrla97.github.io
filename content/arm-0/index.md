---
emoji: 🍤
title: ARM hack overview
author: Zer0Luck
date: '2021-02-09 11:11:12'
categories: ARM
tags: ARM
---

# CISC (Complex Instruction Set Computer)

- 명령어가 복잡하여 명령어를 해석하는 데 시간이 오래 걸리며
- 명령어의 수가 많고 명령을 처리하는 시간이 길어 명령 처리 대기 시간이 길다.

### 명령어가 복잡하다?

```cpp
하나의 명령어가 할 수 있는 일의 양이 RISC 대비하여 많다는 것을 의미
명령어 마다 길이가 다르며 동작에 있어 사이클 수도 다르기 때문에 pipelining 설계가 어렵다.
1~100 byte 이상 되는 명령어들 도 있다.
```

# RISC (Reduced Instruction Set Computer)

- CPU 명령어의 개수를 줄여 하드웨어 구조를 좀 더 간단하게 만드는 방식
- 32비트로 명령어의 크기가 동일 하며 고정 길이를 갖는다.
- 명령어의 개수가 적다.
- 핵심적인 명령어를 기반으로 최소한의 명령어 집합을 구성하여 pipelining 기술을 도입하여 빠른 동작 속도와 하드웨어의 단순화와 효율성을 갖을 수 있으며 가격 경쟁령에서도 우위를 점하였다.

### ARM 에서 RISC 방식을 사용하는 이유

- ARM은 Berkeley RISC에서 파생되었다.

```cpp
Load-Store 방식
Fixed-Length 32bit Instruction
3-address Instruction
```

# ARM Processor Operation Mode

- ARM 프로세서에는 총 7개의 동작 모드가 있다.
- 동작 모드는 프로세서가 어떠한 권한을 가지고 어떠한 일을 처리하고 있는지 나타내는 프로세서의 동작상태를 의미한다.
- 각각의 7개의 모드는 따로 SP(Stack Point)를 갖는다.
- User,System은 같은 Stack을 사용한다.

### User Mode (US) - CPSR M[10000]

- 일반적인 어플리케이션 실행 모드
- 사용자 작업이나 Application을 수행 할 때의 동작 모드로 모든 동작 모드 중 유일하게 Non-Privileged 권한이다.
- 메모리, I/O 장치와 같은 시스템 자원을 사용하는데 제한을 두어 사용자의 실수를 방지한다.
- SVC 모드로 이동하기 위해서는 Software Interrupt를 발생시킨다.

### Fast Interrupt Mode (FIQ)  - CPSR M[10001]

- 빠른 인터럽트 처리를 위한 모드
- 2개의 인터럽트 소스 중 빠르게 인터럽트를 처리할 수 있다.
- 빠른 처리를 위해서 Exception Vector에서도 최하단에 존재하며 별도의 레지스터를 소유한다.

### Supervisor Mode (SVC)  - CPSR M[10011]

- OS 보호 모드 (SW 인터럽트)
- 시스템 자원을 자유롭게 관리 할 수 있는 동작 모드로 주로 커널, 디바이스 드라이버를 처리할 때 System Call 동작되는 모드
- Reset 신호 입력 시 및 SWI가 발생하면 SVC mode로 전환된다.

### Abort Mode (ABT) - CPSR M[10111]

- 데이터, 명령어 Prefetch 중단 시 동작
- 메모리에서 명령을 읽거나 데이터를 읽거나 쓸때 오류가 발생할 때 Abort Mode로 전환하여 오류를 처리한다.
- 커널들의 패닉시 Abort Mode로 잔환되어 스택 내용이 전달됨을 알 수 있다.

### Interrupt Mode (IRQ) - CPSR M[10010]

- 범용 인터럽트 처리 모드
- 일반적으로 사용되는 인터럽트로 외부 장치에서 요청되는 하드웨어적인 IRQ의 발생에 의해 ARM Core는 IRQ 모드로 전환하고 인터럽트를 처리한다.

### System Mode (SYS) - CPSR M[11111]

- OS 가 사용하는 특권 모드
- user mode와 동일한 Register를 사용하고 동일한 용도로 사용된다.
- 권한이 있고 없고 차이다.

### Undifined Mode (UND) - CPSR M[11011]

- 정의 되지 않은 명령어 예외 발생

### CPSR

- 5bit 데이터로 구성된 Status Register 내에 저장된 데이터이다.
- 현재 모드의 Status 값을 저장하고 있다.
- 우축 0~4bit인 총 5bit는 각 모드의 정보를 담고 있다.
- 32bit중 나머지 bit는 N, Z, C, V로 컨디션 코드 및 기타 정보로 사용된다.

### 모드 변경

- 인터럽트, 에러 또는 프로그래머로 인하여 모드가 변경된다.
- 예외에 인하여 모드가 변경된다.

- System Mode, User Mode는 동일한 Stack을 사용하여 Mode간의 차이가 없지만, User Mode에서 Device등의 자원을 사용하는데 있어 제한이 있다.
- SVC Mode는 처음으로 Reset 되었을 때 접근되는 Mode이며 시스템 자원을 자유롭게 관리가 가능하여 별도의 Stack 공간을 사용한다.
- UserMode에서 OS 단위를 사용하고자 할 때 시스템 자원이기 때문에 SVC Mode로 전환되어 사용할 권한을 얻으며 System Call이라고 부른다.

# ARM Thumb 상태

- v4T 이상은 Thumb 명령어 집합이라고 하는 16비트 명령어 집합을 정의한다.
- Thumb 명령어 집합이 기능은 32비트 ARM 명령어 집합 기능의 하위 집합이다.
- Thumb 명령어를 실행하는 프로세서는 Thumb 상태에서 작동한다.
- ARM 명령어를 실행하는 프로세서는 ARM 상태에서 작동한다.
- ARM 상태의 프로세서는 Thumb 명령어를 실행할 수 없고 Thumb 상태의 프로세서는 ARM 명령어를 실행할 수 없다.
- 각 명령어 집합에는 프로세서 상태를 변경하는 명령어가 포함되어 있다.
- ARM 프로세서는 항상 ARM 상태에서 코드 실행을 시작한다.

```toc
```