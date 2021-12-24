module.exports = {
  title: `Zer0Luck`,
  description: `Hacking for humans`,
  language: `ko`, // `ko`, `en` => currently support versions for Korean and English
  siteUrl: `https://dnsdudrla97.github.io/`,
  ogImage: `/og-image.png`, // Path to your in the 'static' folder
  comments: {
    utterances: {
      repo: `dnsdudrla97/dnsdudrla97.github.io`,
    },
  },
  ga: '0', // Google Analytics Tracking ID
  author: {
    name: `Zer0Luck`,
    bio: {
      role: `Hacker`,
      description: ['Play!', 'We!', 'Exploit!'],
      thumbnail: 'sample.png', // Path to the image in the 'asset' folder
    },
    social: {
      github: `https://github.com/dnsdudrla97`,
      linkedIn: ``,
      email: ``, 
    },
  },

  // metadata for About Page
  about: {
    timestamps: [
      // =====       [Timestamp Sample and Structure]      =====
      // ===== 🚫 Don't erase this sample (여기 지우지 마세요!) =====
      {
        date: '',
        activity: '',
        links: {
          github: '',
          post: '',
          googlePlay: '',
          appStore: '',
          demo: '',
        },
      },
      // ========================================================
      // ========================================================
      {
        date: '2021.02 ~',
        activity: '개인 블로그 개발 및 운영',
        links: {
          post: '/gatsby-starter-zoomkoding-introduction',
          github: 'https://github.com/zoomkoding/zoomkoding-gatsby-blog',
          demo: 'https://www.zoomkoding.com',
        },
      },
    ],

    projects: [
      // =====        [Project Sample and Structure]        =====
      // ===== 🚫 Don't erase this sample (여기 지우지 마세요!)  =====
      {
        title: 'dumb fuzzing 이론을 적용한 윈도우 GUI 바이너리 fuzzing 개발',
        description: '윈도우 GUI 바이너리 fuzzing을 활용하여 Exploit 진행',
        techStack: ['python', 'PyQt4'],
        thumbnailUrl: 'AAAAAAAAAAAAAAAAAAAA.png',
        links: {
          post: '/project_fuzz_',
          github: 'https://github.com/dnsdudrla97/Fuzz',
          googlePlay: '',
          appStore: '',
          demo: 'https://github.com/dnsdudrla97/Fuzz/releases',
        },
      },
      // ========================================================
      // ========================================================
      {
        title: '상용 메타버스 기반 가상 오피스 플랫폼 취약점 분석',
        description: 'BoB 10기 취약점 분석 MetaVersPloit 팀, ',
        techStack: ['Brain'],
        thumbnailUrl: 'BOB_MVP.png',
        links: {
          post: '',
          github: '',
          demo: '',
        },
        
      },
      {
        title: 'dumb fuzzing 이론을 적용한 윈도우 GUI 바이너리 fuzzing 개발',
        description: '윈도우 GUI 바이너리 fuzzing을 활용하여 Exploit 진행',
        techStack: ['python', 'PyQt4'],
        thumbnailUrl: 'project_fuzz_fuzz.png',
        links: {
          post: '/project_fuzz_',
          github: 'https://github.com/dnsdudrla97/Fuzz',
          googlePlay: '',
          appStore: '',
          demo: 'https://github.com/dnsdudrla97/Fuzz/releases',
        },
      },
      
    ],
  },
};
