export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/mistakes/index',
    'pages/mine/index',
  ],
  subPackages: [
    {
      root: 'subpackages/exam',
      pages: [
        'pages/quiz/index',
        'pages/result/index',
        'pages/review/index',
      ]
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#E5C5C5',
    navigationBarTitleText: 'AI训练师题库',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#B8A089',
    selectedColor: '#D4A0A0',
    backgroundColor: '#FFFBF2',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/mistakes/index',
        text: '错题本'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})

