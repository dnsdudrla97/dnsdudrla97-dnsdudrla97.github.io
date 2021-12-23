---
emoji: 🍄
title: ARM Register Address load
author: Zer0Luck
date: '2021-02-10 05:10:41'
categories: ARM
tags: ARM
---

# 레지스터에 주소 로드

- 레지스터에 주소를 로드해야 하는 경우가 종종 있다.
- 변수의 주소 값, 문자열 상수 또는 점프 테이블의 시작 위치...
- 주소는 일반적으로 현재 pc 또는 다른 레지스터의 오프셋으로 표현된다.
- 레지스터를 직접로드하려면 ADR, ADRL 을 사용한 직접로드
- 리터러 풀에서 주소 로드 (LDR, Rd, = label)

## ADR, ADRL 직접 로딩

- ADR, ADRL 의사 명령어를 사용하면 데이터 로드를 수행하지 않고 특정 범위 내에서 주소를 생성할 수 있다.
    - 선택적 오프셋이 있는 레이블 인 프로그램 기준 표현식 이며 여기서 레이블의 주소는 현재 PC에 상대적이다.
    - 선택적 오프셋이 있는 레이블 인 레지스터 기준 식 이며 여기서 레이블의 주소는 지정된 범용 레지스터에 있는 주소에 상대적이다.

### 어셈블러는 다음을 생성하여 `ADR rn, label` 의사 명령어를 변환한다.

- 주소가 범위내에 있는 경우 주소를로드하는 단일 ADD, SUB 명령어
- 단일 명령어에서 주소에 도달할 수 없는 경우 오류 메시지

```cpp
- 오프셋 범위는 word 로 정렬되지 않은 주소에 대한 오프셋의 경우 +-255 바이트이고
- word로 정렬된 주소에 대한 오프셋의 경우 +-1020 바이트 (255 word) 이다.
- Thumb 의 경우 주소는 word로 정렬되고 오프셋은 양수여야 한다.
```

### 어셈블러는 다음을 생성하여 `ADRL rn, label` 의사 명령어를 반환한다.

- 주소가 범위 내에 있는 경우 주소를 로드하는 두 개의 데이터 처러 명령어
- 두 명령어로 주소를 구성할 수 없는 경우 오류 메시지

```cpp
- ADRL 의사 명령어의 범위는 word로 정렬되지 않은 주소의 경우 ± 64KB이고
- word로 정렬 된 주소의 경우 ± 256KB이다.(Thumb 용 ADRL 의사 명령어는 없습니다.)
```

```cpp
- 만약 성공한 경우 ADLR은 두 개의 명령어로 어셈블된다.
- 어셈블러는 주소를 단일 명령어로 로드 할 수 있는 경우에도 두 개의 명령어를 생성한다.
```

### ADR, ADRL과 함께 사용되는 레이블은 동일한 코드 섹션내에 있어야 한다.

- 어셈블러 오류는 동일한 섹션에서 범위를 벗어난 레이블을 참조한다.
- 링커 오류는 다른 코드 섹션에서 범위를 벗어난 레이블을 참조한다.
- Thumb 상태에서 ADR은 워드로 정렬 된 주소만 생성할 수있다.
- Thumb 코드에서는 ADRL을 사용할 수 없다. ARM 코드에서만 사용하라

### 연습1

- ADR, ADRL 의사 명령어를 어셈블 할 때 어셈블러에서 생성 한 코드 유형이다.

```cpp
AREA    adrlabel, CODE,READONLY
            ENTRY                          ; 첫 ENTRY
Start
            BL      func                   ; 브랜치 서브 루틴 (func)
stop        MOV     r0, #0x18              ; angel_SWIreason_ReportException
            LDR     r1, =0x20026           ; ADP_Stopped_ApplicationExit
            SWI     0x123456               ; ARM semihosting SWI
            LTORG                          ; 리터럴 생성
func        ADR     r0, Start              ; => SUB r0, PC, #offset to Start
            ADR     r1, DataArea           ; => ADD r1, PC, #offset to DataArea
            ; ADR   r2, DataArea+4300      ; 오프셋 때문에 실패함, ADD의 operand2로 표현할 수 없음
            ADRL    r2, DataArea+4300      ; => ADD r2, PC, #offset1
                                           ;    ADD r2, r2, #offset2
            MOV     pc, lr                 ; Return
DataArea    SPACE   8000                   ; Starting at the current location,
                                           ; clears a 8000 byte area of memory
                                           ; to zero
            END
```

## ADR로 점프 테이블 구현

- 다음 연습2는 점프 테이블을 구현하는 ARM 코드를 보여준다.
- ADR의사 명령어는 점프 테이블의 주소를 로드한다.
- 해당 연습2에서 함수 arithfunc는 세 개의 인수를 사용하여 r0에 결과를 반환한다.
- 첫 번째 인수는 두 번째 및 세 번째 인수에 대해 수행되는 작업을 결정한다.

```cpp
arg1=0
	Result = arg2 + arg3
arg1=1
	Result = arg2 - arg3
```

- 점프 테이블은 다음 명령어와 어셈블러 지시문으로 구현된다.

### EQU

- 어셈블러 지시문
- 기호에 값을 부여하는 데 사용한다.
- 해당 연습 2에서는 값 2를 num에 할당한다.
- num이 코드의 다른 곳에서 사용되면 값 2가 대체된다.
- 이런 방식으로 EQU를 사용하는 것은 C에서 상수를 정의하기 위해 `#define`과 유사하다.

### DCD

- 하나 이상의 STORE words를 선언한다
- 해당 연습2에서 각 DCD는 점프 테이블의 특정 문맥을 처리하는 루튼의 주소를 저장한다.

### LDR

- `LDR pc, [r3, r0, LSL #2]` 명령어는 점프 테이블의 필수 절 주소를 pc로 로드 한다.
- word offset을 제공하기 위해 r0의 line 번호에 4를 곱한다.
- 점프 테이블이 주소에 결과를 추가한다.
- 결합 된 주소의 내용을 프로그램 카운터에 로드한다.

```cpp
AREA    Jump, CODE, READONLY     
        CODE32                           
num     EQU     2                        ; jump table의 항목수 
        ENTRY                            
start                                    
        MOV     r0, #0                   
        MOV     r1, #3
        MOV     r2, #2
        BL      arithfunc                
stop    MOV     r0, #0x18                ; angel_SWIreason_ReportException
        LDR     r1, =0x20026             ; ADP_Stopped_ApplicationExit
        SWI     0x123456                 ; ARM semihosting SWI
arithfunc                                ; Label the function
        CMP     r0, #num                 ; function code를 unsigned integer 취급
        MOVHS   pc, lr                   ; If code is >= num then simply return
        ADR     r3, JumpTable            ; JumpTable 을 r3 레지스트로 로드
        LDR     pc, [r3,r0,LSL#2]        ; 적절할 루틴으로 jump
JumpTable
        DCD     DoAdd
        DCD     DoSub
DoAdd   ADD     r0, r1, r2               ; Operation 0
        MOV     pc, lr                   ; Return
DoSub   SUB     r0, r1, r2               ; Operation 1
        MOV     pc, lr                   ; Return
        END                              ; Mark the end of this file
```

### Thumb 로 변환하기

- Thumb 코드로 변환 된 점프 테이블 구현
- Thumb 버전은 ARM 코드와 동일하며 차이점은 Thumb version
- Thumb 상태에서는 다음을 수행 할 수 없다.
    - LDR, STR 명령어의 기본 레지스터 증가
    - LDR 명령어를 사용하여 값을  PC에 로드
    - 레지스터에 있는 값이 인라인 시프트를 수행

```cpp
AREA    Jump, CODE, READONLY
        CODE16                          
num     EQU     2
        ENTRY
start
        MOV     r0, #0
        MOV     r1, #3
        MOV     r2, #2
        BL      arithfunc
stop    MOV     r0, #0x18
        LDR     r1, =0x20026
        SWI     0xAB                     ; Thumb semihosting SWI
arithfunc
        CMP     r0, #num
        BHS     exit                     ; MOV pc, lr cannot be conditional
        ADR     r3, JumpTable
        LSL     r0, r0, #2               ; 3 instructions needed to replace
        LDR     r0, [r3,r0]              ; LDR pc, [r3,r0,LSL#2]
        MOV     pc, r0
        ALIGN                            ; Ensure that the table is aligned on a
                                         ; 4-byte boundary
JumpTable
        DCD     DoAdd
        DCD     DoSub
DoAdd   ADD     r0, r1, r2
exit    MOV     pc, lr
DoSub   SUB     r0, r1, r2
        MOV     pc, lr
        END
```

## LDR Rd, =label 주소 로딩

- `LDR Rd, =` pseudo-instruction 는 32bit 상수를 레지스터로 로드 할 수 있다.
- 또한 레이블 및 오프셋이 있는 레이블과 같은 프로그램 기준 표현식을 사용한다.

- 레이블 주소를 리터럴 풀(상수 값을 유지하기 위해 코드에 포함된 메모리의 일부)에 배치한다.
- 리터럴 풀에서 주소를 읽는 프로그램 기준 LDR 명령어를 생성한다.

```cpp
LDR      rn [pc, #offset to literal pool] 	; load register n with one word
												; from the address [pc + offset]
```

- ADR, ADRL 의사 명령어와 달리 현재 섹션 외부에 있는 레이블과 함께 LDR을 사용할 수 있다.
- 레이블이 현재 섹션 외부에 있는 경우 어셈블러는 소스 파일이 어셈블 될 때 개체 코드에 재배치 지시문을 배치한다.
- 재배치 지시문은 링크 타임에 주소를 확인하도록 링커에 지시한다.
- 링커가 LDR 및 리터럴 풀을 포함하는 섹션을 배치할 때마다 주소는 유효하다.

- 연습 3

```cpp
AREA    LDRlabel, CODE,READONLY
        ENTRY                              
start
        BL      func1                      
        BL      func2                      
stop    MOV     r0, #0x18                  ; angel_SWIreason_ReportException
        LDR     r1, =0x20026               ; ADP_Stopped_ApplicationExit
        SWI     0x123456                   ; ARM semihosting SWI
func1
        LDR     r0, =start                 ; => LDR R0,[PC, 리터럴 풀1 오프셋]
        LDR     r1, =Darea + 12            ; => LDR R1,[PC, 리터럴 풀1 오프셋]
        LDR     r2, =Darea + 6000          ; => LDR R2, [PC, 리터럴 풀1 오프셋]
        MOV     pc,lr                      ; Return
        LTORG                              ; Literal Pool 1
func2
        LDR     r3, =Darea + 6000          ; => LDR r3, [PC, 리터럴 풀1 오프셋]
                                           ; 이전 리터럴과 공유 한다.
        ; LDR   r4, =Darea + 6004          ; 만약 주석이 해제된다면 에러가 발생한다.
                                           ; 리터럴 풀 2가 범위를 벗어났기 때문
        MOV     pc, lr                     ; Return
Darea   SPACE   8000                       ; 현재 위치에서 시작
                                           ; 8000 바이트 메모리 영역을 지운다.
        END                                ; 리터럴 풀2가 범위를 벗어났다.
                                           ; the LDR instructions above
```

### LDR Rd, =label 문자열 복사 연습

- 한 문자열을 다른 문자열로 덮어 쓰는 ARM 코드 루틴
- LDR 의사 명령어를 사용하여 데이터 섹션에서 두 문자열의 주소를 로드한다.

### DCB

- DCB 명령은 하나 이상의 저장소 바이트를 정의한다.
- 정수 값 외에도 DCB는 인용된 문자열을 허용한다.
- 문자열의 각 문자는 연속 바이트에 배치된다.

### LDR/STR

- LDR 및 STR 명령어는 post-indexed 주소 지정을 사용하여 주소 레지스터를 업데이트 한다.

```cpp
LDRB    r2,[r1],#1
```

- r1이 가리키는 주소의 내용으로 r2를 로드 한다음 r1을 1씩 증가시킨다.

```cpp
AREA    strCopy, CODE, READONLY
        ENTRY                             
start   LDR     r1, =srcstr               ; 첫 번째 문자열에 대한 포인터
        LDR     r0, =dststr               ; 두 번째 문자열에 대한 포인터
        BL      strCopy                   ; 복사를 위해 서브 루틴 호출
stop    MOV     r0, #0x18                 ; angel_SWIreason_ReportException
        LDR     r1, =0x20026              ; ADP_Stopped_ApplicationExit
        SWI     0x123456                  ; ARM semihosting SWI
strCopy
        LDRB    r2, [r1],#1               ; 바이트 로드 및 주소 업데이트
        STRB    r2, [r0],#1               ; 바이트 저장 및 주소 업데이트
        CMP     r2, #0                    ; Check for zero terminator
        BNE     strCopy                   ; Keep going if not
        MOV     pc,lr                     ; Return
        AREA    Strings, DATA, READWRITE
srcstr  DCB     "First string - source",0
dststr  DCB     "Second string - destination",0
        END
```

### Thumb로 변환

- Thumb LDR, STR 명령어에 대해서는 post-indexed 주소 지정 모드가 없다.
- 따라서 ADD 명령어를 사용하여 LDR, STR 명령어 다음에 주소 레지스터를 증가시켜야 한다.

```cpp
LDRB  r2, [r1]        ; load register 2
ADD   r1, #1          ; increment the address in
                      ; register 1.
```


```toc
```