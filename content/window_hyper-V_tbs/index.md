---
emoji: 🥔
title: 윈도우 하이버파이저 Ubuntu 20.04 전체 화면 설정 (오류 해결)
author: Zer0Luck
date: '2021-04-01'
categories: troubleshooting
tags: Hyper-V Windows
---

# 윈도우 하이퍼바이저 Ubuntu 20.04 VM

## 윈도우 하이버바이저 기능 설정 후

![./0.png](./0.png)

## 윈도우 하이버바이저 관리자

![./1.png](./1.png)

- 하이퍼관라자  에서 `빨리 만들기` 선택후 가상 컴퓨터 만들기 창으로 이동
- `Ubuntu 20.04` 선택후 가상 컴퓨터 만들기 클릭 후 대기

![./2.png](./2.png)

- 설치 완료후 Ubuntu 부팅 완료

## Ubuntu VM Full screen 설정 방법

```
vim /etc/default/grub
```

- grub 설정 파일 편집

![./3.png](./3.png)

- line 10 편집

```
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash video=hyperv_fb:1920x1080
```

![./4.png](./4.png)

- 설정 편집후 업데이트 명령 실행

![./5.png](./5.png)



```
init 6
```

- 재부팅

## 전체 화면 설정 완료

![./6.png](./6.png)


```toc
```