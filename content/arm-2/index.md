---
emoji: 🍜
title: ARM Conditional Execution
author: Zer0Luck
date: '2021-02-09 12:10:11'
categories: ARM
tags: ARM
---
# ARM Conditional Execution

## Conditional Execution

- ARM 상태에서 각 데이터 처리 명령어에는 작업 결과에 따라 CPSR(Current Program State Register)의 ALU 상태 플래그를 업데이트 하는 옵션이 있다.
- ARM 데이터 처리 명령어에 S 접미사를 추가하여 CPSR에서 ALU 상태 플래그를 업데이트 한다.
- CMP, CMN, TST, TEQ에 S 접미사를 사용하면 안된다. 이러한 비교 명령어는 항상 플래그를 업데이트 하기 때문이다.

- Thumb 상태에서는 옵셥이 없다.
- MOV, ADD 명령어에서 하나 이상의 상위 레지스터가 사용되는 경우를 제외하고 모든 데이터 처리 명령어는 CPSR의 ALU 상태 플래그를 업데이트 한다.
- MOV 및 ADD는 이러한 경우 상태 플래그를 업데이트 할 수 없다.

### ARM 상태 수행

- 데이터 작업의 결과에 대해 CPSR의 ALU 상태 플래그를 업데이트 한다.
- 플래그를 업데이트 하지 않고 다른 여러 데이터 작업을 실행한다.
- 첫 번째 작업에서 업데이트 된 플래그의 상태에 따라 다음 명령을 실행하거나 실행하지 않는다.
- Thumb 상태에서 대부분의 데이터 작업은 항상 플래그를 업데이트하며 조건부 실행은 조건부 분기 명령어 (`B`) 를 사용해야 만 수행 가능 해당 명령어의 접미사는 ARM 상태와 동일하며 다른 명령은 조건부일 수 없다.

## ALU Status Flags

- CPSR에는 ALU 상태 플래그가 포함된다.
- CPSR 레지스터에 condition Flag에 정보에 맞춰서 분기
- ARM의 모든 명령은 조건 필드를 가지고 있고, 조건에 따라 실행 여부를 결정한다.

![./ARM-CPSR.png](./ARM-CPSR.png)

- N flag : 연산 결과가 음수 일때 설정
- Z Flag : 연산결과가 0 일때 설정
- C Flag : 작업 결과 캐리가 발생하면 설정된다.
    - 덧셈 결과가 2^32 이상이거나 뺄셈 결과가 양수인 경우 또는 이동 또는 논리적 명령에서 인라인 배럴 시프터 작업의 결과로 캐기 가 발생함
- V Flag : 작업으로 인해 OVerflow가 발생했을 떄 설정
    - 더하기, 빼기 또는 비교의 결고과 2^31 보다 크거나 -2^31 보다 작은 경우 오버플로우가 발생한다.
- Q Flag : ARM 아키텍처 v5E에 해당되며 고정 플래그이다.

```cpp
	접미사         	플래그              	      의미
    EQ              Z Set                       같은
    NE	            Z clear                     같지 않음
    CS/HS	          C Set                       높거나 같음 (Unsigned> =)
    CC/LO	          C clear                     낮은 (Unsigned <)
    MI	            N Set                       부정
    PL	            N clear                     양수 or 0
    VS	            V Set                       Overflow
    VC	            V clear                     No Overflow
    HI	            C set and Z clear	          더 높음 (Unsigned>)
    LS	            C clear or Z set	          낮거나 같음 (Unsigned <=)
    GE	            N and V the same	          Signed > =
    LT	            N and V differ	            Signed <
    GT	            Z clear N and V the same	  Signed >
    LE	            Z set N and V differ	      Signed <=
    AL	            Any	                        항상. 이 접미사는 일반적으로 생략됨
```

```cpp
		ADD     r0, r1, r2    ; r0 = r1 + r2, don't update flags
    ADDS    r0, r1, r2    ; r0 = r1 + r2, and update flags
    ADDCSS  r0, r1, r2    ; If C flag set then r0 = r1 + r2, and update flags
    CMP     r0, r1        ; update flags based on r0-r1.
```

### ARM 상태에서 조건부 실행

- arm 명령어의 조건부 실행을 사용하여 코드에서 분기 명령어 수를 줄 일 수 있으며 코드 밀도를 향상시킬 수 있음
- 분기 명령어는 프로세서 주기에서도 비용이 많이 든다.
- 분기 예측 하드웨어가 없는 ARM 프로세서에서는 일반적으로 분기가 수행될 때 마다 프로세서 파이프 라인을 다시 채우는 데 3개의 프로세서 주기가 필요하다.
- ARM10, StrongARM과 같은 일부 ARM 프로세서에는 분기 예측 하드웨어가 있다.
- 이러한 프로세서를 사용하는 시스템에서는 잘못된 예측이 있을 때만 파이프 라인을 flushed 하고 다시 채우면 된다.

### 조건부 실행 연습

- Euclid의 최대 공약수 (gcd) 알고리즘의 두 가지 구현을 사용한다.
- 조건부 실행을 사용하여 코드 밀도와 실행 속도를 향상 시키는 방법을 보여준다.
- 실행 속도에 대한 자세한 분석은 ARM7 프로세서에만 적용된다.

```cpp
int gcd(int a, int b)
{
	while(a != b) do
	{
		if (a > b)
			a -= b;
		b =- a;
	}
	return a;
}
```

- 분기의 조건부 실행으로 gcd 함수 구현

```cpp
gcd     CMP     r0, r1
        BEQ     end
        BLT     less
less
        SUB     r0, r0, r1
        B       gcd
end
```

- 분기 수가 많기 때문에 코드는 7개의 명령어 길이이다.
- 분기를 사용할 때마다 프로세서는 파이프 라인을 다시 채우고 새 위치에서 계속해야 한다.
- 다른 명령어와 실행되지 않은 분기는 각각 단일 사이클을 사용해야 한다.

- ARM 명령어 집합의 조건부 실행 기능을 사용하여 다음 네 개의 명령어에서만 gcd 함수를 구현할 수 있다.

```cpp
gcd
        CMP     r0, r1
        SUBGT   r0, r0, r1
        SUBLT   r1, r1, r0
        BNE     gcd
```

- 코드 크기를 개선하는 것 외에도 해당 코드는 대부분의 경우 더 빠르게 실행된다.
- 다음은 r0 : 1, r1: 2 인 경우 각 구현에서 사용된는 사이클 수를 확인할 수 있다.
- 해당 경우 분기를 모든 명령어의 조건부 실행으로 바꾸면 세 사이클이 절약된다.

```cpp
r0: a	r1: b	Instruction	Cycles (ARM7)
1	2	CMP r0, r1	1
1	2	BEQ end	1 (not executed)
1	2	BLT less	3
1	2	SUB r1, r1, r0	1
1	2	B gcd	3
1	1	CMP r0, r1	1
1	1	BEQ end	3
Total = 13

r0: a	r1: b	Instruction	Cycles (ARM7)
1	2	CMP r0, r1	1
1	2	SUBGT r0,r0,r1	1 (not executed)
1	1	SUBLT r1,r1,r0	1
1	1	BNE gcd	3
1	1	CMP r0,r1	1
1	1	SUBGT r0,r0,r1	1 (not executed)
1	1	SUBLT r1,r1,r0	1 (not executed)
1	1	BNE gcd	1 (not executed)
Total = 10
```

- 연습 2

```cpp
loop
	...
	SUBS         r1, r1, #1
	BNE          loop
```

- SUB 명령을 실행한 결과 Z flag가 SET 되면 명령 실행 suffix가 S 로 설정되어 있기떄문에 명령 실행결과를 CPSR 에 반영

- 연습 3

```cpp
if (a1 == 0) func(1);

CMP     r0, #0
MOVEQ   r0, #1
BLEQ     func

```

- 연습 4

```cpp
if (a2 == 0) x = 0;
if (a2 > 0)  x = 1;

CMP     r0, #0
MOVEQ   r1, #0
MOVGT   r2, #1
```

- 연습 5

```cpp
if (a==4 || a==10) x=0;

CMP     r0, #4
CMPNE   r0, #10
MOVEQ   r1, #0
```

## Calling Convention
- r0~r3 순서대로 인자를 저장
- 인자가 4개 이상이면 스택을 사용한다.
- BL 명령으로 호출할 시 리턴주소는 LR 레지스터에 저장
- 함수 리턴 값 반환은 r0 레지스터를 사용한다.


### Thumb Converting

- Thumb로 변환
- `B`는 조건부로 실행할 수 있는 유일한 Thumb 명령어이다. gcd 알고리즘은 Thumb 코드의 조건부 분기로 작성되어야 한다.
- ARM 조건부 분기 구현과 마찬가지로 Thumb 코드에는 7개의 명령어가 필요하다.
- 그러나 Thumb 명령어의 길이는 16비트에 불과하기 때문에 전체 코드 크기는 14바이트이다.
- 16비트 메모리를 사용하는 시스템에서는 각 Thumb 명령어에 대해 하나의 메모리 액세스 만 필요하지만 각 ARM 명령어에는 두 번의 fetch가 필요하다.
- Thumb 버전이 두 번째 ARM 구현보다 빠르게 실행된다.

``` toc
```