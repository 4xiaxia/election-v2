
const 首页 = {
  path: '/home',
  name: 'home',
  meta: {
    module: '首页'
  },
  redirect: '/home/index',
  component: () => import('../views/common/index.vue'),
  children: [
		{
      path: '/home/index',
      name: 'homeIndex',
      meta: {
        title: '首页',
      },
      component: () => import('../views/layout/home.vue'),
    },
	],
}

const 系统管理 = {
  path: '/system',
  name: 'system',
  meta: {
    module: '系统管理'
  },
  redirect: '/system/user',
  component: () => import('../views/common/index.vue'),
  children: [
    {
      path: '/system/user',
      name: 'systemUser',
      meta: {
        title: '用户管理',
      },
      component: () => import('../views/system/user.vue'),
    },
    {
      path: '/system/role',
      name: 'systemRole',
      meta: {
        title: '角色管理',
      },
      component: () => import('../views/system/role.vue'),
    },
    {
      path: '/system/menu',
      name: 'systemMenu',
      meta: {
        title: '菜单管理',
      },
      component: () => import('../views/system/menu.vue'),
    },
    {
      path: '/system/station',
      name: 'systemStation',
      meta: {
        title: '站点管理',
      },
      component: () => import('../views/system/station.vue'),
    },
  ],
}

// 布局
const layout = {
  path: '/layout',
  name: 'layout',
  component: () => import('../views/layout/index.vue'),
  children: [
    首页,
    系统管理,
  ],
}

const index = {
	path: '',
	name: 'index',
	redirect: '/home',
}


const other = [{
		path: '/login',
		name: 'login',
		meta: {
			title: '登录',
			description: 'description',
			keywords: '',
		},
		component: () => import('../views/other/signIn.vue'),
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'NotFound',
		component: () => import('../views/other/notFound.vue')
	},
]

export default [index, layout, ...other]
