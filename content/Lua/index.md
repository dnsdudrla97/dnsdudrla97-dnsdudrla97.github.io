---
emoji: 🧤
title: Lua 언어 정리
date: '2020-05-29 23:00:00'
author: Zer0Luck
tags: Language Lua
categories: Language
---

# Lua 언어 정리

### 주석 처리

```lua
-- 연속으로 사용한 대쉬가 있는 한 줄을 주석으로 처리한다.

--[[
	--[[ 해당 문법은 개행이 되었을때 주석을 처리할 수 있다.]]--
--]]
```

### 변수 처리

- 모든 수는 double 형으로 받는다.
- 64bit double 형에는  총 52bit의 정수값을 저장할 수 있다.

```lua
T = 'STIRNGSTRING' -- Python과 동일하게 바꿀 수 없는 문자열이다.
t = "stringstring"

Tt = [[ 이중으로 작성한 대괄호는
				여러 줄 문자열의 시작과 끝을 나타낸다. ]]

t = nil -- t는 정의되지 않은 변수를 만들며, 가비지 컬렉션 기능이 존재한다.
```

### 코드 블록 표기법

- 블록은 do, end로 표기된다.

```lua
while count < 50 do
	count = count + 1  -- 참고로 증감 연산자와 일반 단축 연산자 (++, +=...) 없다.
end
```

### 변수 및 흐름제어

```lua
if count > 30 then
	print('ERROR 30')
elseif n ~= 'PULL' then  -- '~=' 는 같지 않음을 나타낸다.
-- python과 같이 같음을 확인하는 연산자는 '=='이다. '=='는 문자열에도 사용 가능
io.write('NOT OVER 30\n') -- stdout 출력
else
	-- 변수들은 기본적으로 전역(Global) 변수로 생성된다.
	thisIsGlobal = 10 -- 변수 이름을 표기할 때는 CamelCase 표기법을 흔히 사용한다.
	
	-- 변수를 지역(local) 변수로 만드는 방법
	local line = io.read() -- stdin 줄을 읽는다.
	
	-- '..' 연산자를 사용하여 문자열 연결
	print("SO HAPPY," .. line)   -- SO HAPPY + 'stdin으로 입력한 문자열' 출력
end

-- 정의되지 않은 변수들은 nil을 리턴한다.
foo = UnknownVariable   -- foo에 UnknownVariable(정의되지 않은 변수)를 넣는다.
-- foo = nil

BoolValue = false

-- 불(boolean) 연산에서는 오직 nil, false만 거짓이다. 0, " 참이다.😀

```

```lua
if count > 30 then
	print('ERROR 30')
elseif n ~= 'PULL' then  -- '~=' 는 같지 않음을 나타낸다.
-- python과 같이 같음을 확인하는 연산자는 '=='이다. '=='는 문자열에도 사용 가능
io.write('NOT OVER 30\n') -- stdout 출력
else
	-- 변수들은 기본적으로 전역(Global) 변수로 생성된다.
	thisIsGlobal = 10 -- 변수 이름을 표기할 때는 CamelCase 표기법을 흔히 사용한다.
	
	-- 변수를 지역(local) 변수로 만드는 방법
	local line = io.read() -- stdin 줄을 읽는다.
	
	-- '..' 연산자를 사용하여 문자열 연결
	print("SO HAPPY," .. line)   -- SO HAPPY + 'stdin으로 입력한 문자열' 출력
end

-- 정의되지 않은 변수들은 nil을 리턴한다.
foo = UnknownVariable   -- foo에 UnknownVariable(정의되지 않은 변수)를 넣는다.
-- foo = nil

BoolValue = false

-- 불(boolean) 연산에서는 오직 nil, false만 거짓이다. 0, " 참이다.😀
if not BoolValue then print("twas false') end

-- 논리 연산자
ans = BoolValue and 'yes' or 'no' -->  'no' 삼항 연산자로 동작한다.

karlSum = 0
for i = 1, 100 do -- 그 범위의 양 끝을 포함한다.
	karlSum = karlSum + i
end

-- "100, 1, -1"를 쓰면 범위를 감소하도록 정할 수 있다.
fredSum = 0
for j = 100, 1 , -1 do
	fredSum = fredSum + j
end
-- 일반적으로, 범위는 시작, 끝 [, 증가 또는 감소량] 으로 표현

-- repat - until 루프 작성 법 C에서 do~While 유사
repeat
	print("NAMIN")
	num = num - 1
until num == 0

```

### 함수

```lua
-- 피보나치 수 (재귀 버전)
function fib(n)
	if n < 2 then return 1 end
	return fib(n-2)+fib(n-1)
end

-- 함수 안에 정의된 함수 (Closure)와 이름 없는 함수도 쓸 수 있다.
function adder(x) -- 리턴되는 함수는 adder가 호출될 때 생성된다. 그 후 x의 값을 기억한다.
	return function(y) return x + y end
end

a1 = adder(9)   -- adder가 처음 호출되었으므로 a1에 9가 들어간다.

print(a1(16))   -- a1에는 9가 들어 있다.
								-- 다시 a1 인스턴스 adder를 호출하였으므로, 9 + 16 = 25가 된다.
-- 리턴, 함수 호출, 할당은 모두 리스트로 동작한다. 
-- 리스트의 길이는 서로 다를 수 있다.
-- 매치되지 않는 수신자들은 nil로 취급된다.
-- 매치되지 않은 전송자들은 버려진다.

x, y, z = 1, 2, 3, 4
-- x = 1, y = 2, z = 3, 4는 버려진다.

function bar(a, b, c)
	print(a, b, c)
	return 4, 8, 5, 3, 2, 1
end

x, y = bar('NAMIN') -- "NAMIN nil nil' 형식으로 출력된다.
- x = 4, y = 8 이 할 당된다. 나머지 값은 버려진다.

-- 함수는 지역, 전역일 수 있다.
-- 다음 두 줄은 같다.
function f(x) return x * x end
f = function (x) return x * X end

-- 다음 두 줄도 같다.
local function g(x) return math.sin(x) end
local g; g = function (x) return math.sin(x) end
-- local g 선언은 g를 자기 참조 가능하게 만든다.

-- 삼각 함수는 라디안으로 동작한다.

-- 매개변수에 한 문자열만 들어갈 때는 (함수를 호출할 때) 괄호를 붙이지 않아도 된다.
print 'hello' -- 요런 형식으로
```

### 테이블

- 테이블은 루아의 유일한 합성 자료 구조이다.
- 테이블은 연관 배열이다.
- php 배열, 자바스크립트 객체와 비슷하다.
- 테이블은 리스트로도 사용될 수 있는 해시 참조 사전이다.

```lua
-- 테이블을 사전이나 맵으로 사용하기
-- 사전은 기본적으로 문자열 키(key)를 가진다.
t = {key1 = 'value1', key2 = false}

-- 문자열 키는 자바스크립트 같은 점 표기를 쓸 수 있다.
print(t.key1) -- 'value1' 출력
t.newKey = {} -- 새로운 key/value 쌍 추가
t.key2 = nil -- 테이블 t에서 key2 제거

-- 키로 (nil이 아닌) 임의의 표기를 사용할 수도 있다.
T = {['@!#'] = 'qbert', [{}] = 1325, [4.23] = 'tau'}
print(T[4.23]) -- 값 tau 출력

-- 키 매칭은 기본적으로 숫자와 문자열 값으로 수행된다.
-- 테이블은 동질성에 의해 수행된다.
a = T['@!#'] -- a = qbert
b = T[{}]    -- 1325가 들어갈 것같지만 아니다. 실제로 들어가는 값은 nil이다. b = nil
-- 이유는 검색에 실패하기 때문
-- 검색 실패 이유는 우리가 사용한 키가 원래 값을 저장할 때 사용된 것과 같은 객체가 아니기 때문
-- 그래서 더 이식성 높은 키는 문자열과 숫자열을 사용해야 한다.

-- 매개 변수가 테이블 하나인 함수 호출에서는 괄호가 필요 없다.
function h(x) print(x.key1) end
h{key1 = 'Namin!23'} -- 'Namin!23' 출력

for key, val in pairs(u) do -- 테이블 반복
	print(key, val)
end

-- _G는 모든 전역들 위한 특별한 테이블이다.
print(_G['_G'] == _G) -- 'true' 출력

-- 테이블을 리스트 또는 배열로 사용하기
-- 리스트는 암묵적으로 정수형 키를 설정한다.
v = {'vaule1', 'value2', 4.23, 'addr'}
for i = 1 #v do -- #v 는 리스트 v의 크기(size)이다.
	print(v[i]) -- 인덱스는 1 부터 시작
end
-- 리스트는 실제 타입이 아니다. v는 그저 하나의 테이블
-- 이 테이블은 연속적인 정수 키를 가지며, 리스트로 취급된다.
```

### 메타데이블과 메타메소드

- 테이블 하나는 메타테이블 하나를 가질 수 있다.
- 그 메타테이블은 '연산자 오버로딩'을 제공한다.

```lua
f1 = {a = 1, b = 2} -- 분수 a/b를 표현
f2 = {a = 2, b = 3}
-- f1 + f2 실패한다. (분수에 대한 덧셈은 루아에 정의되어 있지 않다.)

metafraction = {}
function metafraction.__add(f1, f2)
	sum = {}
	sum.b = f1.b * f2.b
	sum.a = f1.a * f2.b + f2.a * f1.b
	return sum
end

setmetatable(f1, metafraction)
setmetatable(f2, metafraction)

s = f1 + f2  -- f1의 메타테이블에 있는 __add(f1, f2)를 호출한다.

-- f1, f2는 자바스크립트의 프로토타입과 달리 메타테이블에 키가 없다.
-- 반드시 그 키들을 getmetatable(f1)과 같이 다시 받아와야 한다.
-- 메타테이블은 루아가 그것에 대해 아는 키를 가진 보통 테이블이다. __add 같다.

-- 다음 문법은 실패한다. 왜냐하면 s에는 메타테이블이 없기 때문
-- t = s + s
-- 아래 주어진 클래스 같은 패턴들이 이 문제를 해결한다.

-- 메터테이블에서 __index는 (myFavs.animal에 있는 점 처럼) 점 참조를 오버로드 한다.
defaultFavs = {animal = 'Namin', food = 'Woon'}
myFavs = {food = 'apple'}
setmetatable(myFavs, {__index = defaultFavs})
eatenBy = myFavs.animal

-- 직접적 테이블 검색이 실패하면, (검색은) 그 메타테이블의 __index 값을 사용하여 다시 시도
-- 계속해서 반복된다.

-- __index 값은 사용자가 원하는 대로 맞춰진 검색을 위한 함수(테이블, 키)일 수 있다.
-- (add같은) __index의 값들을 메타메소드라 불른다.
-- 메타 메소드의 전체 목록이다. a 는 메타메소드를 가진 한 테이블이다.

-- __add(a, b) --------------->  for a + b
-- __sub(a, b) --------------->  for a - b
-- __mul(a, b) --------------->  for a * b
-- __div(a, b) --------------->  for a / b
-- __mod(a, b) --------------->  for a % b
-- __pow(a, b) --------------->  for a ^ b
-- __unm(a)    --------------->  for -a
-- __concat(a, b) ------------>  for a .. b
-- __len(a)    --------------->  for #a
-- __eq(a, b)  --------------->  for a == b
-- __lt(a, b)  --------------->  for a < b
-- __le(a, b)  --------------->  for a <= b
-- __index(a, b) <함수 또는 테이블> --------------->  for a.b
-- __newindex(a, b, c) --------------->  for a.b = c
-- __call(a, ...) --------------->  for a(...)
```

### 클래스 와 유사한 테이블과 상속

- 클래스는 (루아)에 내장되어 있지 않다.
- 클래스는 테이블과 메타테이블을 사용하여 만들어진다.

```lua
Dog = {}                             -- 1                              

function Dog:new()                   -- 2      
  newObj = {sound = 'woof'}          -- 3  
  self.__index = self                -- 4  
  return setmetatable(newObj, self)  -- 5  
end

function Dog:makeSound()             -- 6  
  print('I say ' .. self.sound)      
end

mrDog = Dog:new()                    -- 7      
mrDog:makeSound()  -- 'I say woof'   -- 8  
```

1. Dog는 클래스처럼 동작한다. (Dog는 테이블 형식이다.)
2. function 테이블이름:함수(...)는 function 테이블이름.함수(self,...) 동일하다.
    - ‘:’은 단지 함수의 첫 인자에 self를 추가한다.
3. newObj(새 객체)는 클래스 Dog의 한 인스턴스가 된다.
4. self = 인스턴스로 될 클래스.
    - 흔히 self = Dog이다. 그러나 상속으로 그것이 바뀔 수 있다.
    - 우리가 newObj의 메타테이블과 self의 __index를 self로 설정하면, newObj는 self의 함수들을 얻는다.
5. setmetatable은 그것의 첫 인자를 리턴한다.
6. ‘:’는 2처럼 동작한다. 그러나 이번에는 self가 클래스가 아닌 인스턴스가 된다.
7. Dog:new()는 Dog.new(Dog)와 같다. 그래서 new()에서 self=Dog이다.
8. mrDog:makeSound()는 mrDog.makeSound(mrDog)와 같다. 여기서 self=mrDog이다.

### 모듈

**임의의 모듈 module.lua**

```lua
local M = {}

local function testMod()
  print('Namin')
end

function M.testM()
  print('Module')
  testMod()
end

return M
```

**main section**

```lua
-- 다른 파일도 module.lua 파일에 있는 기능을 사용할 수 있다.
local mod = require('module') -- module.lua 파일 실행

-- require는 모듈을 포함(include) 하게 하는 표준 방법
local mod = (function ()
		<module.lua 파일의 내용>
end)()
-- module.lua는 한 함수에 들어있는 내용처럼 한 지역 변수 mod에 대입된다.
-- 그래서 module.lua 안에 있는 지역 변수와 지역 함수들은 그 함수 밖에서는 보이지 않게 된다.

-- mod는 module.lua의 반환값 M과 같다. 
mod.testM() -- Module Namin 출력
-- 지역 함수인 testMod은 오직 module.lua 안에서만 존재하므로 메모리에서 사라진다.
mod.testMod() -- error

-- require의 리턴 값들은 메모리에 저장되 require가 여러 번 호출되더라도 한 파일은 한번만 실행
-- 예를 들어, module2.lua가 "print("BROKE")를 포함한다면
local a = require('module2') -- BROKE 출력
local b = require('module2') -- 출력 불가 a=b

-- dofile은 require와 비슷하지만 메모리에 저장을 하지 않는다
dofile('module2.lua) -- BROKE 출력
dofile('module2.lua) -- BROKE 출력 (다시 출력)

-- loadfile은 문자열을 위한 loadfile이다.
g = loadstring('print(0306)') -- 한 함수를 리턴한다.
g() -- 0306 출력한다. 이 함수가 호출되기 전까지는 아무것도 출력되지 않는다.
```

```toc

```

### 참조 사이트

[Learn Lua in 15 Minutes](http://tylerneylon.com/a/learn-lua/)

[루아 15분 안에 배우기 (Learn Lua in 15 Minutes)](https://roboticist.tistory.com/576)