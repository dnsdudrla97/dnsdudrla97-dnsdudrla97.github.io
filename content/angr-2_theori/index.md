---
emoji: 🤬
title: angr 바이너리 분석 활용 방안 2
author: Zer0Luck
date: '2020-08-14'
categories: AnalyzingBinaries
tags: angr
---
## The Loader

- `example/fauxware/fauxware` 를 로드하고 로더와 상호 작용 하는 방법에 대해 알아보자

- 예제로 사용할 바이너리는 다음 링크에서 다운로드: [dnsdudrla97/angr-doc](https://github.com/dnsdudrla97/angr-doc/tree/master/examples/fauxware-SOLVED)

```python
>>> import angr, monkeyhex
>>> p = angr.Project('./fauxware')
>>> p.loader
<Loaded fauxware, maps [0x400000:0xc08000]>
```

---

## Loaded Objects

- CLE 로더 (cle.Loader)는 로드된 바이너리 객체의 전체 그룹을 나타내며 단일 메모리 공간에 로드되고 매핑된다.
- 각 바이너리 객체는 파일 형식(cle.Backend의 subclass)을 처리할 수 있는 loader backend에 의해 로드된다.
- *예를 들어, cle.ELF 는 ELF 바이너리 파일을 로드 하는 데 사용된다.*
- 메모리에 로드된 바이너리 수 와 일치하지 않는 객체도 있을 것이며 예를 들어, `Thread-local Storage` 지원을 제공하는 데 사용되는 객체와 확인되지 않은 Symbols을 제공하는데 사용되는 외부 객체
- CLE가 `loader.all_objects` 와 함께 로드한 전체 목록뿐만 아니라 다음과 같이 몇 가지 추가 표적 분류도 얻을 수있다.

```python
>>> p.loader.all_objects
[<ELF Object fauxware, maps [0x400000:0x60105f]>,
 <ELF Object libc-2.31.so, maps [0x700000:0x8f14d7]>,
 <ELF Object ld-2.31.so, maps [0x900000:0x92f18f]>,
 <ExternObject Object cle##externs, maps [0xa00000:0xa80000]>,
 <ELFTLSObjectV2 Object cle##tls, maps [0xb00000:0xb15010]>,
 <KernelObject Object cle##kernel, maps [0xc00000:0xc08000]>]

# 프로젝트 로드시 직접 지정한 main_object
>>> p.loader.main_object
<ELF Object fauxware, maps [0x400000:0x60105f]>

# shared 객체와 이름을 매핑해서 보여줌
>>> p.loader.shared_objects
{'fauxware': <ELF Object fauxware, maps [0x400000:0x60105f]>,
 'libc.so.6': <ELF Object libc-2.31.so, maps [0x700000:0x8f14d7]>,
 'ld-linux-x86-64.so.2': <ELF Object ld-2.31.so, maps [0x900000:0x92f18f]>,
 'extern-address space': <ExternObject Object cle##externs, maps [0xa00000:0xa80000]>,
 'cle##tls': <ELFTLSObjectV2 Object cle##tls, maps [0xb00000:0xb15010]>}

# ELF 파일에서 로드된 모든 객체
# Window OS 일 경우 all_pe_object를 사용하자
>>> p.loader.all_elf_objects
[<ELF Object fauxware, maps [0x400000:0x60105f]>,
 <ELF Object libc-2.31.so, maps [0x700000:0x8f14d7]>,
 <ELF Object ld-2.31.so, maps [0x900000:0x92f18f]>]

# externs_object
>>> p.loader.extern_object
<ExternObject Object cle##externs, maps [0xa00000:0xa80000]>

# kernel_object : syscall에 주소를 제공하는데 사용
>>> p.loader.kernel_object
<KernelObject Object cle##kernel, maps [0xc00000:0xc08000]>

#주소가 주어진 객체에 대한 참조를 얻을 수 있다
>>> p.loader.find_object_containing(0x400000)
<ELF Object fauxware, maps [0x400000:0x60105f]>
```

- 해당 객체들과 직접 상호 작용하여 메타 데이터를 추출 할 수 있다.

```python
>>> obj = p.loader.main_object
# 객체의 entry point
>>> obj.entry
0x400580
>>> obj.min_addr, obj.max_addr
(0x400000, 0x60105f)

# ELF의 세그먼트와 섹션을 검색한다.
>>> obj.segments
<Regions: [
	<ELFSegment flags=0x5, relro=0x0, vaddr=0x400000, memsize=0xa74, filesize=0xa74, offset=0x0>,
	<ELFSegment flags=0x4, relro=0x1, vaddr=0x600e28, memsize=0x1d8, filesize=0x1d8, offset=0xe28>,
	<ELFSegment flags=0x6,  relro=0x0, vaddr=0x601000, memsize=0x60, filesize=0x50, offset=0x1000>]>

>>> obj.sections
<Regions: [
	<Unnamed | offset 0x0, vaddr 0x0, size 0x0>,
	<.interp | offset 0x238, vaddr 0x400238, size 0x1c>,
	<.note.ABI-tag | offset 0x254, vaddr 0x400254, size 0x20>,
	<.note.gnu.build-id | offset 0x274, vaddr 0x400274, size 0x24>,
	<.gnu.hash | offset 0x298, vaddr 0x400298, size 0x1c>,
	<.dynsym | offset 0x2b8, vaddr 0x4002b8, size 0xd8>,
	<.dynstr | offset 0x390, vaddr 0x400390, size 0x5a>,
	<.gnu.version | offset 0x3ea, vaddr 0x4003ea, size 0x12>,
	<.gnu.version_r | offset 0x400, vaddr 0x400400, size 0x20>,
	<.rela.dyn | offset 0x420, vaddr 0x400420, size 0x18>,
	<.rela.plt | offset 0x438, vaddr 0x400438, size 0xa8>,
	<.init | offset 0x4e0, vaddr 0x4004e0, size 0x18>,
	<.plt | offset 0x500, vaddr 0x400500, size 0x80>,
	<.text | offset 0x580, vaddr 0x400580, size 0x338>,
	<.fini | offset 0x8b8, vaddr 0x4008b8, size 0xe>,
	<.rodata | offset 0x8c8, vaddr 0x4008c8, size 0x63>,
	<.eh_frame_hdr | offset 0x92c, vaddr 0x40092c, size 0x44>,
	<.eh_frame | offset 0x970, vaddr 0x400970, size 0x104>,
	<.ctors | offset 0xe28, vaddr 0x600e28, size 0x10>,
	<.dtors | offset 0xe38, vaddr 0x600e38, size 0x10>,
	<.jcr | offset 0xe48, vaddr 0x600e48, size 0x8>,
	<.dynamic | offset 0xe50, vaddr 0x600e50, size 0x190>,
	<.got | offset 0xfe0, vaddr 0x600fe0, size 0x8>,
	<.got.plt | offset 0xfe8, vaddr 0x600fe8, size 0x50>,
	<.data | offset 0x1038, vaddr 0x601038, size 0x18>,
	<.bss | offset 0x1050, vaddr 0x601050, size 0x10>,
	<.comment | offset 0x1050, vaddr 0x0, size 0x2a>,
	<.shstrtab | offset 0x107a, vaddr 0x0, size 0xfe>,
	<.symtab | offset 0x18f8, vaddr 0x0, size 0x6d8>,
	<.strtab | offset 0x1fd0, vaddr 0x0, size 0x278>]>

# 포함되어진 주소로 개별 세그먼트 또는 섹션을 가져올 수 있다.
>>> obj.find_segment_containing(obj.entry)
<ELFSegment flags=0x5, relro=0x0, vaddr=0x400000,
	memsize=0xa74, filesize=0xa74, offset=0x0>
>>> obj.find_section_containing(obj.entry)
<.text | offset 0x580, vaddr 0x400580, size 0x338>

# symbols 대한 PLT stub 주소를 가져 온다.
>>> obj.plt
{'puts': 0x400510,
 'printf': 0x400520,
 'read': 0x400530,
 '__libc_start_main': 0x400540,
 'strcmp': 0x400550,
 'open': 0x400560,
 'exit': 0x400570}
>>> obj.plt['strcmp']
0x400550
>>> obj.reverse_plt[0x400550]
'strcmp'

# prelinked base, CLE에 이해 실제로 메모리에 매핑 된 위치를 표시한다.
>>> obj.linked_base
0x400000
>>> obj.mapped_base
0x400000
```

---

## Symbols and Relocations

- CLE를 사용하는 동안 Symbolic으로 작업 할 수 도 있다.
- Symbolic은 이름을 주소에 효과적으로 매핑하는 실행 가능한 형식 이다.
- CLE에서 Symbolic을 가져 오는 가장 쉬운 방법은 `loader.find_symbol` 을 사용하는 것이다.
- 해당 방법은 이름이나 주소를 취하고 `Symbol` 객체를 반환한다.

```python
>>> strcmp = p.loader.find_symbol('strcmp')
>>> strcmp
<Symbol "strcmp" in libc-2.31.so at 0x7a22d0>
```

- Symbolic에서 가장 유용한 속성은 이름, 소유자 및 주소이지만 Symbol의 주소는 모호할 수 있다.
- Symbol 객체에는 주소를 얻을 수 있는 세 가지 방법이 있다.
    - `.rebased_addr`
        - 전역 주소 공간의 주소이다.
    - `.linked_addr`
        - 바이너리의 미리 연결된 베이스에 상대적인 주소, 예를 들어 `readelf(1)`
    - `.relative_addr`
        - 객체 기반에 상대적인  주소이다.
        - 이는 문헌(Window 문헌)에서 RVA(상대 가상 주소)로 알려져 있다.

```python
>>> strcmp.name
'strcmp'
>>> strcmp.owner
<ELF Object libc-2.31.so, maps [0x700000:0x8f14d7]>

>>> strcmp.rebased_addr
0x7a22d0
>>> strcmp.linked_addr
0xa22d0
>>> strcmp.relative_addr
0xa22d0
```

- 디버그 정보를 제공하는 것 외에도 심볼은 동적 연결 개념도 지원한다.
- `libc stcmp` Symbol를 내보내기로 제공하며 기본 바이너리가 이에 종속이 된다.
- CLE에 게 주 개체에서 직접 `strcmp` 기호를 제공하도록 요청하면 이것이 가져 오기 Symbol임을 알려준다.
- 가져 오기 Symbol에는 연관된 의미 있는 주소가 없겠지만 `.resolvedby` 와 같이 이를 해결하는데 사용 된 기호에 대한 참조를 제공한다.

```python
>>> strcmp.is_export
True
>>> strcmp.is_import
False
# Loader에서 메서드는 Symbol을 찾기 위해 검색 작업을 수행하므로 find_symbol이다.
# 단일 객체에서 메서드는 주어진 이름을 가진 심볼이 하나만 있을 수 있기 때문에 get_symbol이다.
>>> main_strcmp = p.loader.main_object.get_symbol('strcmp')
<Symbol "strcmp" in fauxware (import)>

>>> main_strcmp.is_export
False

>>> main_strcmp.is_import
True

>>> main_strcmp.resolvedby
<Symbol "strcmp" in libc-2.31.so at 0x7a22d0>
```

- `import` , `export` 사이의 링크가 메모리에 등록되어야 하며 특정 방법은 재배치라는 또 다른 개념에 의해 처리가 된다.
- `재배치` 는 "[import]를 export symbol와 일치 시킬 때 [format] 형식의 [locate]에 export 주소를 써라" 라고 말한다.
- 객체 (Relocation 인스턴스) 에 대한 전체 재배치 목록을 obj.relocs로 볼 수 있거나 심볼 이름에서 Relocationd으로 매핑 (obj.import) 만 볼 수 있다.
- 해당 export symbol 목록이 없

- 재배치의 해당 가져 오기 Symbol로 액세스 할 수 있다.
- 재배치가 쓸 주소는 Symbol에 사용할 수 있는 모든 주소 식벌자을 통해 액세스 할 수 있다.
- `.owner` 로 재배치를 요청하는 객체에 대한 참조도 가져올 수 있다.

```python
>>> p.loader.shared_objects['libc.so.6'].imports
{'__libpthread_freeres': <cle.backends.elf.relocation.amd64.R_X86_64_GLOB_DAT object at 0x7f96c40a80a0>,
 '_rtld_global': <cle.backends.elf.relocation.amd64.R_X86_64_GLOB_DAT object at 0x7f96c403af40>,
 '__libc_enable_secure': <cle.backends.elf.relocation.amd64.R_X86_64_GLOB_DAT object at 0x7f96c405ad60>,
 '_rtld_global_ro': <cle.backends.elf.relocation.amd64.R_X86_64_GLOB_DAT object at 0x7f96c405a100>,
 '_dl_starting_up': <cle.backends.elf.relocation.amd64.R_X86_64_GLOB_DAT object at 0x7f96c405aeb0>,
 '__libdl_freeres': <cle.backends.elf.relocation.amd64.R_X86_64_GLOB_DAT object at 0x7f96c408f8b0>,
 '_dl_argv': <cle.backends.elf.relocation.amd64.R_X86_64_GLOB_DAT object at 0x7f96c405a2e0>,
 '__tls_get_addr': <cle.backends.elf.relocation.amd64.R_X86_64_JUMP_SLOT object at 0x7f96c4045100>,
 '_dl_exception_create': <cle.backends.elf.relocation.amd64.R_X86_64_JUMP_SLOT object at 0x7f96c4045460>,
 '__tunable_get_val': <cle.backends.elf.relocation.amd64.R_X86_64_JUMP_SLOT object at 0x7f96c4045910>,
 '_dl_find_dso_for_object': <cle.backends.elf.relocation.amd64.R_X86_64_JUMP_SLOT object at 0x7f96c408fa00>}
```

- 예를 들어 공유 라이브러리를 찾을 수 없어서 import를 export로 확인할 수 있 없는 경우 CLE는 externsn  객체
- (loader.extern_obj) 를 자동으로 업데이트 하여 심볼을 내보내기로 제공한다.

---

## Loading Options

- `angr.Project`로 바이너리를 로드하고 Project가 암시 적으로 생성하는 `cle.Loader` 인스턴스에 옵션을 전달하려는 경우 키워드 인수를 Project 생성자에 직접 전달할 수 있으며 `CLE` 에 전달된다.

## Basic Options

- `auto_load_libs` 공유 라이브러리 종속성을 자동으로 해결하려는 `CLE` 의 시도를 활성화 또는 비활성화 하며 기본적으로 켜 져 있다.
- 또한 그 반대인 `except_missing_libs` 가 있다. `True` 로 설정하면 바이너리에 해결할 수 없는 공유 라이브러리 종속성이 있을 때마다 예외가 발생한다.

- `force_load_libs` 에 문자열 목록을 전달할 수 있으며 나열된 모든 항목은 게이트에서 바로 해결되지 않은 공유 라이브러리 종속성으로 처리되거나 해당 이름의 라이브러리가 종속성으로 확인되지 않도록 문자열 목록을 `skip_libs` 에 전달할 수 있다.
- 또한 문자열 목록  (또는 단일 문자열)을 `ld_path` 에 전달할 수 있다.
- 이 목록은 공유 라이브러리에 대한 추가 검색 경로로 사용될 수 있다.
- 기본 값은 로드 된 프로그램과 동일한 디렉토리, 현재 작업 디렉토리, 및 시스템 라이브러리 가 있다.

## Per-Binary Options

- 특정 바이너리 객책에만 적용되는 일부 옵션을 지정하려면 CLE도 그렇게 할 수 있다.
- `main_opts` 및 `lib_opts` 매개 변수는 옵션을 사전을 사용하여 이를 수행한다.
- `main_opts` 는 옵션 이름에서 옵션 값으로 매핑이고 `libs_opts` 는 라이브러리 이름에서 옵션 값으로 옵션 이름을 매핑하는 사전으로의 매핑이다.

- 사용할 수 있는 옵션은 벡엔드마다 다르지만 몇 가지 일반적인 옵션은 다음과 같다.
    1. backend - class , name으로 사용할 수 있는 백엔드
    2. base_addr - 기본 주소 사용
    3. entry_point - 엔트리 포인트 사용
    4. arch - 사용할 아키텍처의 이름

```python
>>> angr.Project('./fauxware',
	main_opts={'backend': 'blob', 'arch':'i386'},
	lib_opts={'libc.so.6':{'backend':'elf'}}
)
WARNING | 2020-08-14 18:43:05,284 | cle.backends.blob | No entry_point was specified for blob fauxware, assuming 0
WARNING | 2020-08-14 18:43:05,284 | cle.backends.blob | No base_addr was specified for blob fauxware, assuming 0
<Project ./fauxware>
```

---

## Backends

- `CLE` 에는 현재 `ELF, PE, CGC, Mach-O, ELF core dump` 을 정적으로 로드하고 IDA를 사용하여 바이너리를 로드하고 파일을 flat 주소 공간으로 로드하는 백엔드가 있다.
- CLE는 대부분의 경우에 사용할 올바른 백엔드를 자동으로 감지하므로 이상한 작업을 수행하지 않는 한 사용중인 백엔드를 지정할 필요가 없다.
- 옵션 사전에 키를 포함하여 CLE가 객체에 특정 백엔드를 사용하도록 할 수 있다.
- 일부 백엔드는 사용할 아키텍처를 자동 감지 할 수 없으며 `arch`를 지정해야 한다.
- 키는 아키텍처 목록과 일치할 필요가 없다.
- angr은 지원되는 `arch` 에 대한 거의 모든 공통 식별자를 제공한 아키텍처를 식별한다.

<script src="https://gist.github.com/dnsdudrla97/d19c56ca03c361c1a70a1dd4e33c9bbe.js"></script>

## Symbolic Function Summaries

- Project는 `SimProcedures` 라는 Symbol 요약을 사용하여 라이브러리 함수에 대한 외부 호출을 대체하려고 시도한다.
- 사실상 state에 대한 라이브러리 함수의 효과를 모방하는 Python 함수이다.

### auto_load_libs (TRUE)

- 만약 `auto_load_libs` 가 True(기본 값)이면 실제 라이브러리 함수가 대신 실행된다.
- 예를 들어, `libc` 의 일부 함수는 분석하기가 배우 복잡하며 이를 실행하려는 경로의 상태 수가 폭발적으로 증가 할 가능성이 높다.

### auto_load_libs (FALSE)

- 만약 `auto_load_libs` 가 False이면 외부 함수가 해결되지 않고 Project는 이를 `ReturnUnconstrained` 라는 일반 "Stub" `SimProcedure로 해결한다.
- 이름이 말해는대로 수행한다. 호출될 때 마다 고유 한 제한되지 않은 Symbol을 반환한다.

### use_sim_procedure (cle.Lodaer가 아닌 angr.Project에 대한 매개변수) (FALSE)

- False (기본 값 : True) 인 경우, extern 객체에서 제공하는 기호 만 `SimProcedure` 로 대체되고 `Stub ReturnUnconstrained` 대체된다.
- Symbol 값을 반환한다.

<script src="https://gist.github.com/dnsdudrla97/a091b3fbcd251f803e028fdefb4f1f7f.js"></script>

## Hooking

- `angr` 이 라이브러리 코드를 파이썬 요약으로 대체하는 메커니즘을 후킹이라고 한다.
- 시뮬레이션을 수행 할 때 모든 단계에서 angr은 현재 주소가 `hook` 되었는지 확인하고, 그렇다면 해당 주소에서 바이너리 코드 대신에 `hook`를 실행한다.
- 이를 수행 할 수있는 API는 `proj.hook(addr, hook)` 이며, 여기서 `hook` 은 `SimProcedure` 인스턴스이다.
- `.is_hooked, .unhook , .hooked_by` 로 프로젝트를 `hook` 를 관리할 수 있다.
- `proj.hook(addr)` 을 함수 decorator로 사용하여 `hook` 로 사용할 고유 한 기능을 지정할 주소 `hooking` 을 위한 대체 API가 있다.
- 선택적으로 `length` 키워드 인수를 지정하여 `hook`가 완료된 후 실행이 몇 바이트 앞으로 점프하도록 할 수 있다.

```python
>>> stub_func = angr.SIM_PROCEDURES['stubs']['ReturnUnconstrained']
<class 'angr.procedures.stubs.ReturnUnconstrained.ReturnUnconstrained'>

>>> p.hook(0x10000, stub_func()) # class의 인스턴스와 연결
>>> p.is_hooked(0x10000) # class의 인스턴스에 연결되었는지
True
>>> p.hooked_by(0x10000)
<SimProcedure ReturnUnconstrained>
>>> p.unhook(0x10000)
>>> @p.hook(0x20000, length=5)
... def my_hook(state):
...     state.regs.rax = 1
... 
>>> p.is_hooked(0x20000)
True
```

- `p.hook_symbol(name, hook)` 을 사용하여 symbol의 name을 첫 번째 인수로 제공하여 symbol가 있는 주소를 hook 할 수 있다.
- 이것의 매우 중요한 용도 중 하나는 angr의 내장 라이브러리 SimProcedures의 동작을 확장하는 것이다.
- 이러한 라이브러리 함수는 클래스일 뿐 이므로 하위 클래스를 생성하여 동작의 일부를 재정의 한 다음 후크에서 하위 클래스를 사용할 수 있다.

---

``` toc
```