module.exports = {
  title: `Zer0Luck`,
  description: `Hacking for humans`,
  language: `ko`, // `ko`, `en` => currently support versions for Korean and English
  siteUrl: `https://zer0luck.kr/`,
  ogImage: `/og-image.png`, // Path to your in the 'static' folder
  comments: {
    utterances: {
      repo: `dnsdudrla97/dnsdudrla97.github.io`,
    },
  },
  ga: 'UA-215889404-1', // Google Analytics Tracking ID
  author: {
    name: `Zer0Luck`,
    bio: {
      role: `Hacker`,
      description: ['Play!', 'We!', 'Exploit!'],
      thumbnail: 'z_l.png', // Path to the image in the 'asset' folder
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
        date: '2016.08 ~ 2016.11',
        activity: 'Nurilab Digital Forensics Intern',
        links: {
          post: '',
          github: 'https://www.nurilab.com/',
          demo: 'https://www.nurilab.com/',
        },
      },
      {
        date: '2021.07 ~ 2022.04',
        activity: 'Best of the Best 10th Vulnerability Analysis Track',
        links: {
          post: '',
          github: 'https://www.kitribob.kr/',
          demo: 'https://www.kitribob.kr/',
        },
      },
      {
        date: '2022.05 ~ ',
        activity: 'SCVSoft Blockchain Researcher',
        links: {
          post: '',
          github: 'https://scvsoft.net/',
          demo: 'https://scvsoft.net/',
        },
      },
    ],

    projects: [
      // =====        [Project Sample and Structure]        =====
      // ===== 🚫 Don't erase this sample (여기 지우지 마세요!)  =====
      {
        title: 'Development of window GUI binary fuzzing using the dump fuzzing theory.',
        description: 'Exploit progress using Windows GUI binary fuzzing',
        techStack: ['python', 'PyQt4', 'fuzz', 'win-driver', 'kernel'],
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
        title: 'Vulnerability analysis of commercial metaverse-based virtual office platform',
        description: "[Application Portal feature (Portal to another space) SandBox Escape RCE] \r\n [Exposing API Sensitive Data via Redux Trick and Manipulating During Rendering] \r\n[Vulnerability of XSS attack-based unsafe token theft and elevated authority] \r\n [Iframe plugin XSS vulnerability] \r\n [Picket Static Object XSS Vulnerability] \r\n [CSRF-token bypass CSRF attack using apiCall.] \r\n [[Android][ENG] Forced exploitation of Pro (Use Speech Captions, Host Settings) based on Pro Feature Bypass[High]] \r\n [[Android][ENG] Forced exploitation of HostSettings(Mute,unMute,remove,respwan..) based on Client Owner bypass[High]] \r\n [[Android][ENG] Application Level DOS attack based on Pro Feature(Congregate Around Actor, Respawn)[High]] \r\n [[Android][ENG] Vulnerability of forcibly tampering and deleting contents based on room contents save function / Contents Object Version Null Exception DOS attack[High]] \r\n [[Android][ENG] Exposing 3D face modeling data External stored in Android storage[Low]] \r\n [[Android][ENG] Task Hijacking attack based on unsafe task management.[Medium]] \r\n",
        techStack: ['Photon', "webGL", "web3", "ElectronJS", "Unity", "Javascript"],
        thumbnailUrl: 'BOB_MVP.png',
        links: {
          post: '/project_MetaVersPloit',
          github: '',
          demo: '',
        },
        
      },
      {
        title: 'onthelook GraphQL Injection Code Execution',
        description: 'onthelook GraphQL Injection Code Execution',
        techStack: ['react-native', 'graphql', 'nodejs', 'express'],
        thumbnailUrl: '',
        links: {
          post: '',
          github: '',
          googlePlay: '',
          appStore: '',
          demo: '',
        },
      }, 
      {
        title: 'Development of window GUI binary fuzzing using the dump fuzzing theory.',
        description: 'Exploit progress using Windows GUI binary fuzzing',
        techStack: ['python', 'PyQt4', 'fuzz', 'win-driver', 'kernel'],
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
