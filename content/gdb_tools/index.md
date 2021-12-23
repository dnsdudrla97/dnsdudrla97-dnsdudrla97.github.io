---
emoji: ⚔
title: GDB cheat sheet
author: Zer0Luck
date: '2020-06-09 14:44:44'
categories: Tools
tag: gdb
---

## GDB 명령어 및 함수 정리

### 시작

```bash
gdb -help         도움말
gdb object      	표준 디버그 
gdb object core 	core 디버그 (core 파일 지정: `object`
gdb object pid  	동작 중인 프로세스 디버그
gdb        		    파일 명령을 통해 객체 로드
gdb run           프로그램을 처음부터 실행
gdb finish        현재 함수 모두 실행
```

### 도움말

```bash
Help
(gdb) help        	     gdb 명령들의 도움말
(gdb) help running       하나 명령어 지정 도움말
(gdb) help run        	 "run" 명령에 대한 도움말
(gdb) help info          list info 명령들의 도움말
(gdb) help info line     info line 명령어의 도움말
(gdb) help show          show 명령들의 도움말
(gdb) help show commands show commands 명령어의 도움말
```

### Breakpoints

```bash
(gdb) break main                       main 함수 breakpoint 지정
(gdb) break 10                         소스 10번째 줄 breakpoint 지정
(gdb) break test.c:10                  파일 및 줄에 breakpoint 지정 (함수도 가능)
(gdb) info breakpoints                 breakpoint 정보 출력
(gdb) delete 1                         breakpoint id 를 활용한 삭제
(gdb) delete        	                 모든 breakpoint 삭제
(gdb) clear                            현재 줄에서 breakpoint 삭제
(gdb) clear function                   함수에서 breakpoint 삭제
(gdb) clear line                       줄에서 breakpoint 삭제
(gdb) disable 2                        breakpoint 비활성화 (제거 아님)
(gdb) enable 2                         breakpoint 활성화
(gdb) tbreak function|line             임시 breakpoint 설정
(gdb) commands break-no ... end        breakpoint 사용하여 gdb 명령 설정
(gdb) ignore break-no count            breakpoint ID 무시 후 활성화
(gdb) condition break-no expression    조건이 참일 경우에만 breakpoint 동작     
(gdb) condition 2 i == 20              예) 변수 i가 20일 경우 break
(gdb) watch expression                 변수에 소프트웨어 로깅 설정
(gdb) info watchpoints                 현재 로깅 정보 출력

```

### Stack Backtrace

```bash
(gdb) bt        	   현재 스택 구조 출력
(gdb) frame        	 현재 실행 위치 표시, 스택 프레임 (frame n : n을 통해 위치 이동 가능)
(gdb) up        	   스택 위로 이동
(gdb) down        	 스택 아래 이동 (메인함수와 주소가 멀어 진다.)
(gdb) info locals    현재 지역 변수 출력
(gdb) info args      매개 변수 출력
```

### 소스내부

```bash

(gdb) list 101        	             101 행 주위 10줄 나열
(gdb) list 1,10                      1 ~ 10 줄 나열
(gdb) list main  	                   메인 함수 소스 출력
(gdb) list basic.c:main              다른 파일의 메인 함수 소스 출력
(gdb) list -        	               이전 소스 10줄 출력
(gdb) list *0x22e4                   지정 주소 소스 출력
(gdb) cd dir        	               현재 디렉토리를 \fIdir\fR 로 변경
(gdb) pwd          	                 작업 공간 디렉토리 경로 출력
(gdb) search regexpr                 정규표현식을 통한 검색
(gdb) reverse-search regexpr         정규표현식을 통한 역방향 검색
(gdb) dir dirname                    소스 경로에 디렉토리 추가
(gdb) dir        	                   디렉토리 재설정 소스 경로가 따로 없다.
(gdb) show directories               디렉토리 경로 출력
```

### Data

```bash
(gdb) print expression             출력 표현식
(gdb) print/x expressionR          16진수로 출력
(gdb) print array[i]@count         출력 배열 범위 지정
(gdb) print $                  	   마지막 출력 값
(gdb) print $1        	           기록에서 $1 출력 값 1 출력
(gdb) print ::gx                   해당 범위를 전역으로 설정
(gdb) print 'basic.c'::gx          지정된 파일의 전역 범위를 출력 (>=4.6)
(gdb) print/x &main                메인 함수 주소 출력
(gdb) x/countFormatSize address    Low-Level 검사 명령
(gdb) x/x &gx        	             16진수로 gx값 출력
(gdb) x/4wx &main                  16진수로 word 타입으로 4개만큼 출력
(gdb) help x        	             x 포맷 형식

o(octal) t(binary) i(instruction)
x(hex) f(float) c(char)
d(decimal) a(address) s(string)
u(unsigned decimal) z(hex, zero padded on the left).

(gdb) info functions regexp        정규표현식을 통해 함수 정보 출력
(gdb) info variables regexp        정규표현식을 통해 변수 정보 출력
(gdb) info variables               소스 파일 순서대로 프로그램 내에 존재하는 모든 변수 출력
(gdb) info address var             변수가 어디에 저장되 있는지 알려 준다.
-- ptype (typedef 로 별칭된 유형) --
(gdb) ptype name                   출력 타입 정의 
(gdb) whatis expression            출력 표현 타입 정의
(gdb) set variable = expression    변수 표현 지정

(gdb) display expression           매 실행 시 인자로 전달괸 값 출력
(gdb) undisplay                    display 삭제
(gdb) info display                 display 정보 출력
(gdb) show values                  입력한 값에 대한 기록 출력
```

```bash
(gdb) info registers        	현재 레지스터 정보 출력
(gdb) info all-registers      전체 레지스터 정보 출력
(gdb) print/x $pc           	지정 단일 레지스터 출력
(gdb) stepi        		        단일 단계 출력 (한 줄 실행)
(gdb) si        		          단일 단계 출력 (한 줄 실행)
(gdb) nexti        		        단일 단계 출력 (함수 바깥 범위)
(gdb) ni        		          단일 단계 출력 (함수 바깥 범위)
(gdb) display/i $pc        	  display 정보에 현재 명령 출력
(gdb) x/x &gx        		      16진수로 변수 gx 출력
(gdb) info line 22        	  22 행 소스 정보 출력
(gdb) info line *0x2c4e       해당 주소의 소스 라인 출력
(gdb) x/10i main        	    \ fImain \ fR에서 처음 10 개의 명령어를 disassemble
(gdb) disassemble addr        주소 disassemble 변경
```

```toc
```