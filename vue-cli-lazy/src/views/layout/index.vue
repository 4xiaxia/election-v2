<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <div :class="['sidebar-container', isCollapse ? 'collapsed' : '']">
      <div class="logo-wrapper">
        <el-icon size="24" color="#049f6c"><Platform /></el-icon>
        <span v-show="!isCollapse" class="logo-title">花卉系统后台</span>
      </div>
      
      <el-scrollbar>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          background-color="#111c24"
          text-color="#b8c7ce"
          active-text-color="#049f6c"
          :unique-opened="true"
          router
          class="sidebar-menu"
        >
          <!-- 静态首页菜单 -->
          <el-menu-item index="/home/index">
            <el-icon><HomeFilled /></el-icon>
            <template #title>首页仪表盘</template>
          </el-menu-item>

          <!-- 动态权限菜单 -->
          <template v-for="menu in menuTree" :key="menu.menu_id">
            <!-- 拥有子菜单的目录 (M) -->
            <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="String(menu.menu_id)">
              <template #title>
                <el-icon><component :is="menu.icon || 'Menu'" /></el-icon>
                <span>{{ menu.menu_name }}</span>
              </template>
              <el-menu-item 
                v-for="child in menu.children" 
                :key="child.menu_id" 
                :index="child.path"
              >
                <el-icon><component :is="child.icon || 'Document'" /></el-icon>
                <template #title>{{ child.menu_name }}</template>
              </el-menu-item>
            </el-sub-menu>

            <!-- 没有子菜单的独立菜单 (C) -->
            <el-menu-item v-else :index="menu.path">
              <el-icon><component :is="menu.icon || 'Menu'" /></el-icon>
              <template #title>{{ menu.menu_name }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </div>

    <!-- 右侧内容区 -->
    <div :class="['main-container', isCollapse ? 'collapsed' : '']">
      <!-- 顶部导航栏 -->
      <div class="navbar">
        <div class="left-menu">
          <div class="toggle-btn" @click="toggleSidebar">
            <el-icon size="20">
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </div>
          <!-- 面包屑 -->
          <el-breadcrumb class="breadcrumb-container" separator="/">
            <el-breadcrumb-item :to="{ path: '/home/index' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="(item, index) in currentBreadcrumb" :key="index">
              {{ item.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="right-menu">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-profile">
              <el-avatar :size="32" class="user-avatar" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <span class="user-name">{{ userNickName }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 内容区主体 -->
      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { getUserInfo } from '../../api/user';
import { useUserStore } from '../../store/user';
import { ElMessage } from 'element-plus';

export default {
  name: 'Layout',
  data() {
    return {
      isCollapse: false,
      menuTree: [],
      currentBreadcrumb: [],
      userNickName: localStorage.getItem('nickName') || '管理员'
    };
  },
  computed: {
    activeMenu() {
      return this.$route.path;
    }
  },
  watch: {
    $route() {
      this.routeInit();
    }
  },
  created() {
    this.fetchUserInfoAndMenus();
    this.routeInit();
  },
  methods: {
    toggleSidebar() {
      this.isCollapse = !this.isCollapse;
    },
    routeInit() {
      this.currentBreadcrumb = [];
      for (let item of this.$route.matched) {
        if (item.meta && item.meta.title && item.meta.title !== '首页') {
          this.currentBreadcrumb.push(item);
        }
      }
    },
    async fetchUserInfoAndMenus() {
      try {
        const userStore = useUserStore();
        if (!userStore.menus || userStore.menus.length === 0) {
          // 如果为空兜底获取一次
          const res = await getUserInfo();
          if (res && res.code === 0) {
            userStore.setInfo(res.data.user);
            userStore.setMenus(res.data.menus || []);
            this.userNickName = res.data.user.nick_name;
            localStorage.setItem('nickName', this.userNickName);
          }
        } else {
          this.userNickName = userStore.info.nick_name || localStorage.getItem('nickName') || '管理员';
        }
        // 构建树形菜单
        this.menuTree = this.buildMenuTree(userStore.menus || []);
      } catch (error) {
        console.error(error);
      }
    },
    buildMenuTree(list) {
      // 过滤掉按钮类型并且克隆一份
      const menus = list
        .filter(item => item.menu_type !== 'F')
        .map(item => ({ ...item, children: [] }));
      
      const map = {};
      menus.forEach(item => {
        map[item.menu_id] = item;
      });

      const tree = [];
      menus.forEach(item => {
        // parent_id 为 0 或在 map 中找不到的作为顶级菜单
        if (item.parent_id === 0 || !map[item.parent_id]) {
          tree.push(item);
        } else {
          map[item.parent_id].children.push(item);
        }
      });

      // 根据 order_num 排序
      const sortNode = (nodeList) => {
        nodeList.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
        nodeList.forEach(node => {
          if (node.children && node.children.length > 0) {
            sortNode(node.children);
          }
        });
      };
      sortNode(tree);
      
      return tree;
    },
    handleCommand(command) {
      if (command === 'logout') {
        this.handleLogout();
      } else if (command === 'profile') {
        ElMessage.info('个人中心模块开发中');
      }
    },
    handleLogout() {
      localStorage.clear();
      ElMessage.success('安全退出成功');
      this.$router.push('/login');
    }
  }
};
</script>

<style lang="less" scoped>
.app-wrapper {
  position: relative;
  height: 100vh;
  width: 100vw;
  display: flex;
  background-color: #f5f7f9;
}

// 侧边栏样式
.sidebar-container {
  width: 240px;
  height: 100%;
  background-color: #111c24;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 1001;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  &.collapsed {
    width: 64px;
  }
  
  .logo-wrapper {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    background-color: #0b1217;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    gap: 12px;
    
    .logo-title {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      letter-spacing: 0.5px;
    }
  }

  .sidebar-menu {
    border-right: none;
    
    &:not(.el-menu--collapse) {
      width: 240px;
    }
    
    :deep(.el-menu-item), :deep(.el-sub-menu__title) {
      height: 50px;
      line-height: 50px;
      
      &:hover {
        background-color: #1a2a36 !important;
        color: #ffffff !important;
      }
    }
    
    :deep(.el-menu-item.is-active) {
      background-color: rgba(4, 159, 108, 0.1) !important;
      border-left: 3px solid #049f6c;
      color: #049f6c !important;
      font-weight: 600;
    }
  }
}

// 主内容区样式
.main-container {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s ease;
  background-color: #f4f6f9;
}

.navbar {
  height: 60px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;

  .left-menu {
    display: flex;
    align-items: center;
    gap: 16px;

    .toggle-btn {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      transition: background 0.3s;
      
      &:hover {
        background: #f0f2f5;
      }
    }
  }

  .right-menu {
    .user-profile {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 8px;
      transition: background 0.3s;
      
      &:hover {
        background: #f0f2f5;
      }
      
      .user-avatar {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .user-name {
        font-size: 14px;
        color: #333;
        font-weight: 500;
      }
    }
  }
}

.app-main {
  flex: 1;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
}

// 动画
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
