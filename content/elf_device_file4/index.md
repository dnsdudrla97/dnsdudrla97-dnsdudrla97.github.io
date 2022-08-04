---
emoji: 📠
title: ELF 프로그램 헤더 (ELF Program Header)
author: Zer0Luck
date: '2020-08-16'
categories: AnalyzingBinaries
tags: ELF
---

# ELF 프로그램 헤더

```c
#define EI_NIDENT 16

           typedef struct {
               unsigned char e_ident[EI_NIDENT];
               uint16_t      e_type;
               uint16_t      e_machine;
               uint32_t      e_version;
               ElfN_Addr     e_entry;
               ElfN_Off      e_phoff;
               ElfN_Off      e_shoff;
               uint32_t      e_flags;
               uint16_t      e_ehsize;
               uint16_t      e_phentsize;
               uint16_t      e_phnum;
               uint16_t      e_shentsize;
               uint16_t      e_shnum;
               uint16_t      e_shstrndx;
           } ElfN_Ehdr;
```

- ELF 프로그램 헤더는 프로그램 로딩에 필요한 `바이너리 세그먼트`를 정의한다.
- `세그먼트`는 디스크에 저장된 실행 파일이 커널에 의해 로드되는 과정에서 어떤 메모리 구조로 매핑될 것인지를 정의한다.
- 프로그램 헤더 테이블은 ELF 헤더의 멤버인 `e_phoff` (프로그램 헤더 테이블 오프셋)를 조회해 접근한다.

- 주로 사용하는 프로그램 헤더는 5가지로 실행 파일 및 공유 라이브러리의 세그먼트를 정의하고 세그먼트 형식(어떤 형식의 데이터 또는 코드가 있는지를 나타낸다.)
- 32비트 ELF 실행 파일의 프로그램 헤더 테이블을 조회해 `ELF32_Phdr` 구조체가 형성하는 프로그램 헤더를 분석해도록 하겠다.

<script src="https://gist.github.com/cfd77d6ea6a5cab5e51811028893e7cc.js"></script>

## PT_LOAD

- 실행 파일에는 `PT_LOAD` 형식의 세그먼트가 하나 이상 있어야 한다.
- 해당 형식의 프로그램 헤더는 로드 가능한 세그먼트 형식으로 메모리에 로드 또는 매핑된다.

```c
동적 링킹이 가능한 ELF 실행 파일에 두 가지 로드 가능한 세그먼트(PT_LAOD)가 포함된다.

1. 프로그램 코드가 위치한 텍스트 세그먼트

2. 전역 변수와 동적 링킹 정보가 위치한 데이터 세그먼트
```

- 두 세그먼트는 `p_align` 값을 이용해 정렬된 후 메모리에 매핑된다.
- Phdr 구조체가 나타내는 세그먼트가 파일과 메모리에서 어떤 방식으로 동작하는지 이해하기 위해 리눅스의 `ELF(5) man` 페이지를 읽어보자
- 프로그램 헤더는 프로그램이 메모리에서 실행될 때의 구조를 나타낸다.

## *Code Segment*

- `PF_X | PF_R (READ+EXECUTE)` 라는 세그먼트 퍼미션을 가진다.

## *Data Segment*

- `PF_W | PF_R (READ+WRITE)` 라는 세그먼트 퍼미션을 가진다.

## PT_DYNAMIC

- 동적 세그먼트에서 사용하는 프로그램 헤더
- 동적 링킹되는 실행 파일에서 사용되며 동적 링커가 사용하는 정보가 담겨 있다.

## PT_DYNAMIC 주로 사용하는 값

- 실행 시간에 링크되는 공유 라이브러리 목록
- 전역 오프셋 테이블 (GOT)의 주소나 위치
- 재배열 엔트리(relocation entry) 정보

## PT_DYNAMIC 주로 사용하는 태그
<script src="https://gist.github.com/dnsdudrla97/2b8bbd81148a879c2fc7fd87eea834ba.js"></script>


- 동적 세그먼트에는 동적 링킹 정보가 담겨 있다.
- `d_tag` 구조체 멤버는 `d_num` 구조체를 제어한다.

```c
typedef struct
{
    Elf32_Sword d_tag;
    union {
        Elf32_Word d_val;
        Elf32_Addr d_ptr;
    } d_un;
} Elf32_Dyn;
extern Elf32_Dyn _DYNAMIC[];
```

## PT_NOTE

- 특정 벤더나 시스템에 관한 부가적인 정보를 포함한다.
- 벤더 또는 시스템 빌더는 `SHT_NOTE` 섹션 형식과 `PT_NOTE` 프로그램 헤더를 이용하여 오브젝트 파일에 호환성 등의 정보를 기록할 수 있다.
- 섹션과 프로그램 헤더는 4바이트 워드 형식의 문자열 형태이며 저장 공간의 제약은 없다.
- 레이블도 추가정보를 나타내기 위해 포함될 수 있으나 필수 요구사항은 아니다.

- `PT_NOTE` 세그먼트는 OS에서만 참조하기 때문에 실행 파일이 실행되는 동안에 꼭 필요한 정보가 아니다.

## PT_INTERP

- 크기가 작은 해당 섹션은 NULL 종료 문자열의 주소와 크기, 그리고 프로그램 인터프리터의 위치를 나타낸다.
- 프로그램 인터프리터는 동적 링커라고 도 하며 일반적으로 `/lib/linux-ld.so.2` 에 위치한다.

![/assets/img/posts/ELF/ELF-5/0.png](/assets/img/posts/ELF/ELF-5/0.png){: width="70%" height="70%"}

## PT_PHDR

- 프로그램 해더의 주소와 크기를 나타낸다.
- 프로그램 헤더 테이블은 프로그램 헤더의 세그먼트가 파일과 메모리 이미지의 어는 곳에 있는지를 가리킨다.

```c
readelf -l <binary>
```

![/assets/img/posts/ELF/ELF-5/1.png](/assets/img/posts/ELF/ELF-5/1.png){: width="70%" height="70%"}

- 실행 파일의 엔트리 포인트와 앞에서 말한 여러 종류의 세그먼트 형시을 볼 수 있다.
- 권한 플래그의 오른쪽에 위치한 오프셋과 두 개의 `PT_LOAD` 세그먼트에 있는 정렬 플래그를 보게 되면
- 텍스트 세그먼트는 `READ+WRITE` 퍼미션을 가지고 있으며, 데이터 세그먼트는 `READ+WRITE` 퍼미션을 가지고 있다.
- 두 세그먼트는 `0x600e10` , `0x600e28` 정렬 오프셋을 가지고 있으며, 이 값은 32비트 실행 파일에서의 페이지 크기와 같다.
- 오프셋은 프로그램이 로드되는 과정에서 정렬을 위해 사용한다.

``` toc
```