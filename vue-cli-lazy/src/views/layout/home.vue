<template>
  <div class="home-container">
    <!-- 数据统计卡片栏 -->
    <el-row :gutter="20" class="statistics-row">
      <el-col :span="6">
        <div class="card-item green-grad">
          <div class="card-content">
            <div class="card-title">系统用户数</div>
            <div class="card-value">{{ userCount }} <span class="unit">个</span></div>
          </div>
          <el-icon class="card-icon"><User /></el-icon>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card-item blue-grad">
          <div class="card-content">
            <div class="card-title">系统角色数</div>
            <div class="card-value">{{ roleCount }} <span class="unit">个</span></div>
          </div>
          <el-icon class="card-icon"><UserFilled /></el-icon>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card-item orange-grad">
          <div class="card-content">
            <div class="card-title">系统菜单数</div>
            <div class="card-value">{{ menuCount }} <span class="unit">个</span></div>
          </div>
          <el-icon class="card-icon"><Menu /></el-icon>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card-item purple-grad">
          <div class="card-content">
            <div class="card-title">安全运行时间</div>
            <div class="card-value">124 <span class="unit">天</span></div>
          </div>
          <el-icon class="card-icon"><Timer /></el-icon>
        </div>
      </el-col>
    </el-row>

    <!-- 下半部分：左侧系统信息，右侧扫雷游戏 -->
    <el-row :gutter="20" class="main-row">
      <el-col :span="12">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Monitor /></el-icon> 系统配置与说明</span>
            </div>
          </template>
          <div class="info-body">
            <div class="project-intro">
              <h4>🌸 花卉销售与后台管理系统 🌸</h4>
              <p>这是一个现代化、精简版的权限管理底座，采用目前前端主流的 <strong>Vue 3</strong>、<strong>Element Plus</strong> 技术栈，配合轻量级 <strong>KoaLite</strong> (Node.js) 后端开发框架，并持久化数据至 <strong>MySQL</strong> 数据库。</p>
            </div>
            
            <el-descriptions title="开发环境配置" :column="2" border>
              <el-descriptions-item label="前端框架">Vue 3.5</el-descriptions-item>
              <el-descriptions-item label="组件库">Element Plus</el-descriptions-item>
              <el-descriptions-item label="后端框架">Koa 3.x</el-descriptions-item>
              <el-descriptions-item label="数据库">MySQL 8.0</el-descriptions-item>
              <el-descriptions-item label="路由库">Vue Router 5.0</el-descriptions-item>
              <el-descriptions-item label="状态管理">Pinia 2.x</el-descriptions-item>
            </el-descriptions>
            
            <div class="update-log">
              <h5>最新更新日志：</h5>
              <ul>
                <li>⚡️ 引入 Element Plus 全量组件及图标集</li>
                <li>🛠️ 建立 MySQL 表自初始化与连接池持久化方案</li>
                <li>🔗 实现包含菜单、角色、用户的全功能闭环管理</li>
                <li>🎯 优化主界面菜单折叠动效与面包屑定位逻辑</li>
              </ul>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 扫雷小游戏 -->
      <el-col :span="12">
        <el-card class="game-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Coordinate /></el-icon> 系统娱乐室 - 扫雷彩蛋</span>
              <el-button type="success" size="small" @click="resetGame">重新开始</el-button>
            </div>
          </template>
          <div class="game-body">
            <div class="mine-board">
              <div class="tr" v-for="(item, y) in map" :key="y">
                <div 
                  class="td" 
                  v-for="(x, i) in item" 
                  :key="i"
                  :style="{'color': isMine(`${x}-${y}`) && activeCoordinate[`${x}-${y}`] ? '#f56c6c' : ''}"
                  :class="{
                    'active': activeCoordinate[`${x}-${y}`], 
                    'mine-cell': isMine(`${x}-${y}`) && activeCoordinate[`${x}-${y}`]
                  }"
                  @click="clickCell(`${x}-${y}`)"
                >
                  <span v-if="activeCoordinate[`${x}-${y}`]">
                    <el-icon v-if="isMine(`${x}-${y}`)" class="bomb-icon"><WarnTriangleFilled /></el-icon>
                    <span v-else>{{ coordinate[`${x}-${y}`] }}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div class="game-rules">
              <el-tag type="info" class="rule-tag">点击格子进行扫雷</el-tag>
              <el-tag type="danger" v-if="gameOver" class="status-tag">💥 游戏结束，您踩雷了！</el-tag>
              <el-tag type="success" v-else-if="gameWon" class="status-tag">🎉 恭喜，排雷成功！</el-tag>
              <el-tag type="warning" v-else class="status-tag">🛡️ 努力排雷中...</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { nextTick } from 'vue';
import { getUserList } from '../../api/user';
import { getRoleList } from '../../api/role';
import { getMenuList } from '../../api/menu';

export default {
  name: 'Home',
  data() {
    return {
      userCount: 0,
      roleCount: 0,
      menuCount: 0,

      // 扫雷游戏数据
      mineSize: 10,       // 地图大小 10x10
      mineNum: 10,        // 雷总数
      mineCoordinate: [], // 雷坐标
      coordinate: {},     // 提示数字
      activeCoordinate: {}, // 是否已点击翻开
      map: [],
      gameOver: false,
      gameWon: false
    };
  },
  async created() {
    this.fetchStatistics();
    await nextTick();
    this.initGame();
  },
  methods: {
    // 获取后台统计数据
    async fetchStatistics() {
      try {
        const resUser = await getUserList({ pageSize: 1 });
        if (resUser && resUser.code === 0) {
          this.userCount = resUser.data.total || 0;
        }
        
        const resRole = await getRoleList({ pageSize: 1 });
        if (resRole && resRole.code === 0) {
          this.roleCount = resRole.data.total || 0;
        }

        const resMenu = await getMenuList();
        if (resMenu && resMenu.code === 0) {
          this.menuCount = resMenu.data.length || 0;
        }
      } catch (error) {
        console.error('获取首页统计数据失败', error);
      }
    },

    // 扫雷逻辑
    initGame() {
      this.gameOver = false;
      this.gameWon = false;
      this.map = [];
      this.coordinate = {};
      this.activeCoordinate = {};
      this.mineCoordinate = [];

      for (let x = 0; x < this.mineSize; x++) {
        this.map[x] = [];
        for (let y = 0; y < this.mineSize; y++) {
          this.map[x].push(y);
          this.activeCoordinate[`${x}-${y}`] = false;
          this.coordinate[`${x}-${y}`] = '';
        }
      }
      // 布雷
      this.buriedMine();
      // 计算数字
      for (let key in this.coordinate) {
        if (!this.isMine(key)) {
          const count = this.surroundingMinesCount(key);
          this.coordinate[key] = count > 0 ? count : '';
        }
      }
    },
    buriedMine() {
      let count = 0;
      while (count < this.mineNum) {
        const x = Math.floor(Math.random() * this.mineSize);
        const y = Math.floor(Math.random() * this.mineSize);
        const coord = `${x}-${y}`;
        if (!this.mineCoordinate.includes(coord)) {
          this.mineCoordinate.push(coord);
          count++;
        }
      }
    },
    isMine(xy) {
      return this.mineCoordinate.includes(xy);
    },
    clickCell(xy) {
      if (this.gameOver || this.gameWon) return;

      // 踩到雷了
      if (this.isMine(xy)) {
        this.gameOver = true;
        // 把所有的雷都翻出来
        this.mineCoordinate.forEach(coord => {
          this.activeCoordinate[coord] = true;
        });
        return;
      }

      // 翻开格子
      this.spread(xy);
      
      // 检查是否胜利
      this.checkWin();
    },
    spread(cell) {
      if (this.activeCoordinate[cell]) return;
      this.activeCoordinate[cell] = true;

      if (this.coordinate[cell] === '') {
        const [x, y] = cell.split('-').map(Number);
        for (let i = x - 1; i <= x + 1; i++) {
          for (let j = y - 1; j <= y + 1; j++) {
            if (i >= 0 && i < this.mineSize && j >= 0 && j < this.mineSize) {
              const neighbor = `${i}-${j}`;
              if (!this.activeCoordinate[neighbor] && !this.isMine(neighbor)) {
                this.spread(neighbor);
              }
            }
          }
        }
      }
    },
    surroundingMinesCount(cell) {
      const [x, y] = cell.split('-').map(Number);
      let count = 0;
      for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
          if (i >= 0 && i < this.mineSize && j >= 0 && j < this.mineSize) {
            if (this.isMine(`${i}-${j}`)) {
              count++;
            }
          }
        }
      }
      return count;
    },
    checkWin() {
      // 如果所有非雷格子都被翻开，则胜利
      let won = true;
      for (let x = 0; x < this.mineSize; x++) {
        for (let y = 0; y < this.mineSize; y++) {
          const coord = `${x}-${y}`;
          if (!this.isMine(coord) && !this.activeCoordinate[coord]) {
            won = false;
            break;
          }
        }
      }
      if (won) {
        this.gameWon = true;
      }
    },
    resetGame() {
      this.initGame();
    }
  }
};
</script>

<style lang="less" scoped>
.home-container {
  font-family: 'Inter', sans-serif;
}

// 统计卡片样式
.statistics-row {
  margin-bottom: 20px;
}

.card-item {
  height: 110px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  color: #fff;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.12);
  }

  .card-content {
    .card-title {
      font-size: 14px;
      opacity: 0.85;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .card-value {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
      
      .unit {
        font-size: 14px;
        font-weight: 400;
        margin-left: 4px;
        opacity: 0.8;
      }
    }
  }

  .card-icon {
    font-size: 40px;
    opacity: 0.3;
  }
}

// 四种渐变配色
.green-grad {
  background: linear-gradient(135deg, #049f6c 0%, #08b47b 100%);
}
.blue-grad {
  background: linear-gradient(135deg, #1890ff 0%, #36a3ff 100%);
}
.orange-grad {
  background: linear-gradient(135deg, #ff9c6e 0%, #ffb68c 100%);
}
.purple-grad {
  background: linear-gradient(135deg, #b37feb 0%, #ca9ff6 100%);
}

// 主面板样式
.main-row {
  margin-top: 10px;
}

.info-card, .game-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  
  :deep(.el-card__header) {
    background-color: #fafbfc;
    border-bottom: 1px solid #f0f2f5;
    padding: 16px 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: #333;
      
      span {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1d3557;
      }
    }
  }
}

.info-body {
  .project-intro {
    margin-bottom: 24px;
    
    h4 {
      margin: 0 0 10px 0;
      color: #049f6c;
      font-size: 18px;
    }
    
    p {
      margin: 0;
      color: #666;
      line-height: 1.6;
      font-size: 14px;
    }
  }
  
  .update-log {
    margin-top: 24px;
    h5 {
      margin: 0 0 10px 0;
      font-size: 15px;
      color: #1d3557;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      li {
        margin-bottom: 8px;
        font-size: 13.5px;
        color: #555;
        line-height: 1.5;
      }
    }
  }
}

// 扫雷面板布局
.game-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0;

  .mine-board {
    background: #eef1f6;
    padding: 8px;
    border-radius: 12px;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
    display: inline-block;
    margin-bottom: 20px;
    
    .tr {
      display: flex;
    }
    
    .td {
      width: 32px;
      height: 32px;
      text-align: center;
      line-height: 30px;
      border: 1px solid #dcdfe6;
      background: #fdfdfd;
      margin: 2px;
      cursor: pointer;
      user-select: none;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #f0f2f5;
        border-color: #c0c4cc;
      }

      &.active {
        background: #ecf5ff;
        border-color: #d9ecff;
        color: #409eff;
        box-shadow: none;
      }

      &.mine-cell {
        background: #fef0f0;
        border-color: #fde2e2;
        color: #f56c6c;
      }
    }
  }
  
  .game-rules {
    display: flex;
    gap: 10px;
    align-items: center;
    
    .rule-tag {
      font-weight: 500;
    }
    
    .status-tag {
      font-weight: 600;
    }
  }
}
</style>
