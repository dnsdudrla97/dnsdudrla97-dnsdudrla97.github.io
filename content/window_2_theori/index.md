---
emoji: 🥖
title: Windows SEH (Structured Exception Handler) 1
author: Zer0Luck
date: '2021-01-03 10:10:10'
categories: Windows
tags: Windows Exploit
---

## SEH

- `exception handlers` 는 각 Thread와 관련된 `Singly-linked list` 구성된다.
- 원칙적으로 해당 목록의 노드는 stack에 할당된다.
- 목록의 Head는 TEB(Thred Environment Block)의 시작 부분에 있는 포인터로 가리키므로 코드가 새 예외처리기를 추가하려는 경우 새 노드가 목록의 헤드와 포인터에 추가된다.
- TEB에서 새 노드를 가리키도록 변경된다.
- 각 노드는 `_EXCEPTION_REGISTRATION_RECORD` 유형이며 핸들러의 주소와 목록의 다음 노드에 대한 포인터를 저장한다.
- 이상하게도 목록의 마지막 노드의 "next pointer" 는 NULL이 아니지만 `0xFFFFFFFF` 와 같다.


```cpp
0:000> dt _EXCEPTION_REGISTRATION_RECORD
ntdll!_EXCEPTION_REGISTRATION_RECORD
+0x000 Next : Ptr32 _EXCEPTION_REGISTRATION_RECORD
+0x004 Handler : Ptr32 _EXCEPTION_DISPOSITION

0:005> dt _EXCEPTION_REGISTRATION_RECORD
combase!_EXCEPTION_REGISTRATION_RECORD
   +0x000 Next             : Ptr32 _EXCEPTION_REGISTRATION_RECORD
   +0x004 Handler          : Ptr32     _EXCEPTION_DISPOSITION
```

- TEB는 FS:[0] 부터 시작하는 `selector` FS를 통해서도 액세스 할 수 있으므로 다음과 같은 코드르 보는 것이 일반적이다.


```cpp
mov eax, dword ptr fs:[00000000h] ; retrieve the head
push eax ; save the old head
lea eax, [ebp-10h]
mov dword ptr fs:[00000000h], eax ; set the new head
mov ecx, dword ptr [ebp-10h] ; get the old head (NEXT field of the current head)
mov dword ptr fs:[00000000h], ecx ; restore the old head
```

- 컴파일러는 일반적으로 프로그램의 어느 영역이 실행되고 있는지 (전역 변수에 의존) 알고 호출될 될 때 그에 따라 동작하는 단일 전역 처리기를 등록한다.
- 각 스레드에는 다른 `TEB` 가 있으므로 운영 체제는 `FS` 에 의해 선택된 세그먼트가 항상 올바른 TEB(즉, 현재 스레드 중 하나)를 참조하는지 확인한다.
- TEB의 주소를 얻을려면 TEB의 Self 필드에 해당하는 `FS:[18h]`를 읽어야 한다.

- TEB를 확인해 보자


```cpp
0:003> !teb
TEB at 00b95000
    ExceptionList:        032af770
    StackBase:            032b0000
    StackLimit:           032ac000
    SubSystemTib:         00000000
    FiberData:            00001e00
    ArbitraryUserPointer: 00000000
    Self:                 00b95000
    EnvironmentPointer:   00000000
    ClientId:             0000351c . 00004360
    RpcHandle:            00000000
    Tls Storage:          00000000
    PEB Address:          00b50000
    LastErrorValue:       0
    LastStatusValue:      0
    Count Owned Locks:    0
    HardErrorMode:        0
```

FS 세그먼트가 TEB를 참조하는 지 확인해보자

```cpp
0:003> dg fs
                                  P Si Gr Pr Lo
Sel    Base     Limit     Type    l ze an es ng Flags
---- -------- -------- ---------- - -- -- -- -- --------
0053 00b95000 00000fff Data RW Ac 3 Bg By P  Nl 000004f3
```

- FS:[18h] 에는 TEB의 주소가 포함되어 있다.

```cpp
0:003> ?poi(fs:[18])
Evaluate expression: 12144640 = 00b95000
```

- ExceptionList가 가리키는 Structure를 확인해보도록 하겠다.

```cpp
0:003> dt nt!_NT_TIB ExceptionList
ntdll!_NT_TIB
   +0x000 ExceptionList : Ptr32 _EXCEPTION_REGISTRATION_RECORD
```

- 각 노드는 _EXCPETION_REGISTRATION_RECORD의 Instance이다. 전체 목록을 확인하고 싶으면 `!slist` 를 사용하자

```cpp
0:003> !slist $teb _EXCEPTION_REGISTRATION_RECORD
SLIST HEADER:
   +0x000 Alignment          : 32b0000032af770
   +0x000 Next               : 32af770
   +0x004 Depth              : 0
   +0x000 Sequence           : 0

SLIST CONTENTS:
032af770
   +0x000 Next             : 0x032af7dc _EXCEPTION_REGISTRATION_RECORD
   +0x004 Handler          : 0x77759990     _EXCEPTION_DISPOSITION  ntdll!_except_handler4+0
032af7dc
   +0x000 Next             : 0x032af7f4 _EXCEPTION_REGISTRATION_RECORD
   +0x004 Handler          : 0x77759990     _EXCEPTION_DISPOSITION  ntdll!_except_handler4+0
032af7f4
   +0x000 Next             : 0xffffffff _EXCEPTION_REGISTRATION_RECORD
   +0x004 Handler          : 0x7776734b     _EXCEPTION_DISPOSITION  ntdll!FinalExceptionHandlerPad27+0
ffffffff
   +0x000 Next             : ???? 
   +0x004 Handler          : ???? 
Can't read memory at ffffffff, error 0
```

- `$teb` 는 TEB의 주소이다.

- SEH chain을 표시하는 더 간단한 방법은 다음을 사용하는 것이다.

```cpp
0:003> !exchain
032af770: ntdll!_except_handler4+0 (77759990)
  CRT scope  0, filter: ntdll!DbgUiRemoteBreakin+3b (7778db7b)
                func:   ntdll!DbgUiRemoteBreakin+3f (7778db7f)
032af7dc: ntdll!_except_handler4+0 (77759990)
  CRT scope  0, filter: ntdll!__RtlUserThreadStart+3d6c5 (77784c8a)
                func:   ntdll!__RtlUserThreadStart+3d75e (77784d23)
032af7f4: ntdll!FinalExceptionHandlerPad27+0 (7776734b)
Invalid exception stack at ffffffff
```

- SEH chain을 수동으로 검사 할 수 있다.

```cpp
0:003> dt 032af770 _EXCEPTION_REGISTRATION_RECORD
ntdll!_EXCEPTION_REGISTRATION_RECORD
   +0x000 Next             : 0x032af7dc _EXCEPTION_REGISTRATION_RECORD
   +0x004 Handler          : 0x77759990     _EXCEPTION_DISPOSITION  ntdll!_except_handler4+0
```

```toc
```