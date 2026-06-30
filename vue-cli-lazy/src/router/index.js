import { createWebHistory, createRouter } from 'vue-router'
import { useAppStore } from '../store/app'
import routes from './routes'
import { useUserStore } from '../store/user'
const router = createRouter({
  history: createWebHistory(),
  routes,
})

import { getUserInfo } from '../api/user'

router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore()
  appStore.clearRequests()
  
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    return next('/login')
  } else if (to.path === '/login' && token) {
    return next('/home/index')
  }
  
  // 权限验证逻辑
  if (token && to.path !== '/login') {
    const userStore = useUserStore()
    
    // 如果没有加载过权限菜单，先拉取一次
    if (!userStore.menus || userStore.menus.length === 0) {
      try {
        const res = await getUserInfo()
        if (res && res.code === 0) {
          userStore.setInfo(res.data.user)
          userStore.setMenus(res.data.menus || [])
        } else {
          // 获取失败可能 token 过期，交由响应拦截器处理
          return next()
        }
      } catch (e) {
        return next()
      }
    }
    
    // 静态白名单路由，不需要动态权限验证
    const whiteList = ['/home/index', '/404', '/login']
    if (whiteList.includes(to.path) || to.path === '/') {
      return next()
    }
    
    // 动态路由权限验证
    const hasPermission = userStore.menus.some(menu => menu.path === to.path)
    if (!hasPermission) {
      // 没有权限则拦截
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.error('您没有权限访问该页面！')
      })
      return next('/home/index')
    }
  }
  
  next()
})

export default router
