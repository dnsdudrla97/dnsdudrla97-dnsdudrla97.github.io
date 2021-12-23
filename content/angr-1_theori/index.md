---
emoji: 🤬
title: angr 바이너리 분석 활용 방안 1
author: Zer0Luck
date: '2020-08-14'
categories: analyzing binaries
tags: angr
---

## 프로젝트 선택

```python
# Angr을 이용해서 실행할 바이너리를 선택한다. (auto_load_libs=False -> unresolved)
# 실행에 부하가 걸릴시 False로 둔다.
p = angr.Project('./Binary', auto_load_libs=False)

p.arch  ->  아키텍처 출력
p.enrty ->  바이너리 진입점 
p.filename -> 바이너리 이름

```

## loader

- 이진 파일에서 가상 주소 공간에서 표현하는 것은 매우 복잡하다.
- 이를 처리하기 위하여 CLE 모듈이 있다.
- 로더라고 하는 CLE의 결과는 속성에서 사용할 수 있으며  프로그램과 함께 로드된 공유 라이버리를 보고 로드된 주소 공간에 대한 기본 쿼리를 숭행하는데 사용할 수 있다.

```python
>>> p.loader
<Loaded RedVelvet, maps [0x400000:0xa08000]>

>>> p.loader.shared_objects
OrderedDict([
('RedVelvet', <ELF Object RedVelvet, maps [0x400000:0x60209f]>),
('extern-address space', <ExternObject Object cle##externs, maps [0x800000:0x808000]>),
('cle##tls', <ELFTLSObjectV2 Object cle##tls, maps [0x900000:0x915010]>)])

>>> p.loader.min_addr
4194304
>>> p.loader.max_addr
10518528

>>> p.loader.main_object
<ELF Object RedVelvet, maps [0x400000:0x60209f]>

>>> p.loader.main_object.execstack # 실행 가능 스택 공간 여부
False
>>> p.loader.main_object.pic # 바이너리 위치가 독립적인지 여부
False

```

## p.factory (생성자들)

- `angr` 에는 많은 클래스가 있으며 대부분 프로젝트를 인스턴스화해야 한다.
- 모든 곳에서 프로젝트를 사용할 시 자주 사용하고 싶은 공통 객체에 대한 몇 가지 편리한 생성자를 제공한다. `project.factory`

## block

- `poject.facotry.block()` 주어진 주소에서 기본 코드 블록을 추출하는데 사용된다.

```python
>>> block = p.factory.block(p.entry) # 프로그램의 진입 점에서 코드 블록을 가져온다.
>>> block
<Block for 0x400890, 41 bytes>

>>> block.pp() # 디스 어셈블리를 stdout에 깔끔하게 출력함
0x400890:       xor     ebp, ebp
0x400892:       mov     r9, rdx
0x400895:       pop     rsi
0x400896:       mov     rdx, rsp
0x400899:       and     rsp, 0xfffffffffffffff0
0x40089d:       push    rax
0x40089e:       push    rsp
0x40089f:       mov     r8, 0x4016b0
0x4008a6:       mov     rcx, 0x401640
0x4008ad:       mov     rdi, 0x4011a9
0x4008b4:       call    0x4007e0

>>> hex(block.instructions) # 몇 개의 instructions이 있는지
'0xb'

>>> block.instruction_addrs # instructions 메모리 주소
[4196496, 4196498, 4196501, 4196502, 4196505, 4196509,
4196510, 4196511, 4196518, 4196525, 4196532]

>>> block.capstone # castone disassembly
<CapstoneBlock for 0x400890>

>>> block.vex # vex IRSB 프로그램의 메모리 주소
IRSB <0x29 bytes, 11 ins., <Arch AMD64 (LE)>> at 0x400890

```

## state

- 객체는 프로그램의 "초기화 이미지" 만을 나타낸다.
- `angr` 로 실행을 수행할 때 시뮬레이션 된 프로그램 상태를 나타내는 특정 개체인 `SimState` 로 작업한다.

```python
>>> state = p.factory.entry_state()
>>> state
<SimState @ 0x400890>
```

- `SimState` 는 프로그램의 메모리, 레지스터, 파일 시스템 데이터를 포함하고 있다.

```python
<SimState @ 0x400890>
>>> state.regs.rip  # 현재 명령 포인터 위치
<BV64 0x400890>
>>> state.regs.rax
<BV64 0x1c>
>>> state.mem[p.entry].int.resolved # entry point의 메모리를 C int로 해석
<BV32 0x8949ed31>
```

- 해당 값들은 파이썬의 정수가 아니다. `비트 벡터`이다.
- 파이썬 정수는 CPU의 단어와 동일한 의미를 갖지 않는다.

```python
>>> bv = state.solver.BVV(0x1234, 32) # 값이 0x1234인 32비트 벡터를 만든다.
>>> bv
<BV32 0x1234>
>>> state.solver.eval(bv) # python int 형으로 변환한다.
4660
```

- 이러한 비트 벡터를 레지스터 및 메모리에 다시 저장하거나 Python 정수를 직접 저장할 수 있다.
- 적절한 크기의 비트 벡터로 변환된다.

```python
>>> state.regs.rsi = state.solver.BVV(3, 64)
>>> state.regs.rsi
<BV64 0x3>
>>> state.regs.rsi
<BV64 0x3>
>>> state.mem[0x1000].long = 3
>>> state.mem[0x1000].long.resolved
<BV64 0x3>
>>> state.mem[0x1000].long = 4
>>> state.mem[0x1000].long.resolved
```

- `배열[인덱스]` 표기법을 사용해 주소를 지정
- <type> : char, short, int, long, size_t, uint8_t, uint16_t...)
- 비트 벡터 또는 파이썬 정수 중에 하나에 값을 저장할 수 있다.
- 값을 비트 벡터로 가져 오는 데 사용된다. `.resolved`
- 값을 python int 형으로 가져 오는 데 사용 `.concrete`

```python
>>> state.regs.rdi
<BV64 reg_rdi_1_64{UNINITIALIZED}>
```

- 64 비트의 비트 벡터이지만 숫자 값을 포함하지 않는다.
- 대신에 이름이 있다. 이를 `symbolic Variable` 라고 하며 토대이다.

```python
1. p.factory.blank_state() : empty state
2. p.factory.entry_state() : entrypoint state 생성 (main start)
3. p.factory.full_init_state() : _init start
4. p.factory.call_state() : select function start
```

- 정확한 메모리 주소를 사용해야 하며 해당 프로그램이 인자 값을 받는 경우 entry_state,
full_init_state를 통해 인자값을 제공

## Simulation Managers

- `state` 는 우리가 주어진 시점에서 프로그램을 대표할 경우에 얻을 수 있는 방법이 있어야  한다.

## p.factory.simgr (p.factory.simulation_manager)

```python
sm = p.factory.simgr(state)
sm = p.factory.simulation_manager(state)
sm.active
[<SimState @ 0x400580>]
```

- `symbolic execution` 을 제어하고 `state` 공간 탐색을 위한 알고리즘을 적용한다.

```python
>>> sm.step()
<SimulationManager with 1 active>
```

- 방금 명령 과정으로 기본 블록의 Symbolix을 실행하였다.
- `active stash` 를 다시 살펴보고 업데이트 되었음을 알 수 있다.
- 또한 원래 상태를 수정 하지 않았 음을 알 수 있다.
- `SimState` 객체는 실행에 의해 변경 불가능한 것으로 처리된다.
- 단일 상태를 여러 번의 실행을 위한 "기본"으로 안전하게 사용할 수 있다.

```python
>>> sm.active
[<SimState @ 0x400540>]
>>> simgr.active[0]
<SimState @ 0x400540>
>>> state.regs.rip
<BV64 0x400580>
```

## Analyses

- angr은 프로그램에서 재미있는 정보를 추출하는데 사용할 수있는 몇 가지 기본 제공 분석과 함께 미리 패키지로 제공된다.

```python
>>> p.analyses.
p.analyses.BackwardSlice(                   p.analyses.Propagator(
p.analyses.BasePointerSaveSimplifier(       p.analyses.ReachingDefinitions(
p.analyses.BinDiff(                         p.analyses.Reassembler(
p.analyses.BinaryOptimizer(                 p.analyses.RecursiveStructurer(
p.analyses.BoyScout(                        p.analyses.RegionIdentifier(
p.analyses.CDG(                             p.analyses.RegionSimplifier(
p.analyses.CFB(                             p.analyses.SootClassHierarchy(
p.analyses.CFBlanket(                       p.analyses.StackCanarySimplifier(
p.analyses.CFG(                             p.analyses.StackPointerTracker(
p.analyses.CFGEmulated(                     p.analyses.StaticHooker(
p.analyses.CFGFast(                         p.analyses.StructuredCodeGenerator(
p.analyses.CFGFastSoot(                     p.analyses.Structurer(
p.analyses.CalleeCleanupFinder(             p.analyses.Typehoon(
```

## sm.explore(), found 결과 출력

```python
# find, avoid 인수 -> find 허용할 값, avoid 피해가야 할 위치
# find, avoid -> (메모리 주소, 문자열)
sm.explore(find=0x401546, avoid=(0x4007D0))

print(sm.found[0].posix.dumps(0))
```

```toc
```