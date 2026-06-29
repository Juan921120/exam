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
    navigationBarBackgroundColor: '#1890ff',
    navigationBarTitleText: 'AI训练师题库',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#8c8c8c',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
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

