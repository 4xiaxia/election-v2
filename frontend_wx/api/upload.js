import COS from 'cos-wx-sdk-v5';
import { request } from './index';

const cosConfig = {
  Bucket: 'unmanned-1329333904',
  Region: 'ap-beijing',
};

let cosInstance = null;

/**
 * 获取并封装 COS 实例（单例模式）
 */
const getCOS = () => {
  if (!cosInstance) {
    cosInstance = new COS({
      // 强制使用 STS 临时密钥
      getAuthorization: async (options, callback) => {
        try {
          // 使用项目中统一的 request 接口获取 STS
          const res = await request({
            url: '/upload/getSTS',
            method: 'POST'
          });

          if (res && res.code === 200) {
            const result = res.data;
            const credentials = result.credentials;
            callback({
              TmpSecretId: credentials.tmpSecretId,
              TmpSecretKey: credentials.tmpSecretKey,
              SecurityToken: credentials.sessionToken,
              StartTime: result.startTime,
              ExpiredTime: result.expiredTime,
            });
          } else {
            console.error('COS 授权失败:', res);
          }
        } catch (err) {
          console.error('COS 授权接口请求失败:', err);
        }
      }
    });
  }
  return cosInstance;
};

/**
 * 封装统一的上传方法
 * @param {Object} options 
 * @param {string} options.filePath - 本地文件路径
 * @param {string} options.path - 业务路径 (例如 'clean', 'user_avatar')
 */
export const uploadFileToCOS = ({ filePath, path = 'others' }) => {
  const cos = getCOS();
  const fileName = filePath.split('/').pop();
  const timestamp = Date.now();
  
  let userPrefix = 'anonymous';
  try {
    const infoData = wx.getStorageSync('infoData') ? JSON.parse(wx.getStorageSync('infoData')) : {};
    if (infoData.phone && infoData.userId) {
      userPrefix = `${infoData.phone}_${infoData.userId}`;
    } else if (infoData.phone) {
      userPrefix = infoData.phone;
    } else if (infoData.userId) {
      userPrefix = infoData.userId;
    }
  } catch (e) {
    console.error('获取用户信息失败, 使用匿名目录:', e);
  }

  const key = `${userPrefix}/${path}/${timestamp}-${fileName}`;

  return new Promise((resolve, reject) => {
    cos.postObject({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: key,
      FilePath: filePath,
    }, (err, data) => {
      if (err) {
        console.error('COS 上传失败:', err);
        reject(err);
      } else {
        // 返回符合项目原有约定的格式
        const url = `https://${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com/${key}`;
        resolve({
          url: url,
          path: `/${key}`,
          filename: fileName
        });
      }
    });
  });
};
