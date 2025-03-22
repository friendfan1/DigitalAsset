<template>
  <div class="admin-verification-container">
    <h1>企业认证审核</h1>
    <el-table :data="verifications" style="width: 100%">
      <el-table-column prop="companyName" label="公司名称" />
      <el-table-column prop="creditCode" label="统一社会信用代码" />
      <el-table-column label="营业执照">
        <template #default="{ row }">
          <el-image
          style="width: 100px; height: 100px"
          :src="row.imageUrl"
          :preview-src-list="[row.imageUrl]"
          append-to-body
          preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="{ row }">
          <el-tag :type="row.approved ? 'success' : 'warning'">
            {{ row.approved ? '已通过' : '待审核' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button
            v-if="!row.approved"
            type="primary"
            size="small"
            @click="approveVerification(row.id)"
          >
            通过
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

interface CompanyVerification {
  id: number;
  companyName: string;
  creditCode: string;
  businessLicenseUrl: string;
  approved: boolean;
  imageUrl?: string; 
}

const verifications = ref<CompanyVerification[]>([]);

const fetchVerifications = async () => {
  try {
    const token = userStore.profile?.token;
    const response = await axios.get('/api/admin/company-verifications', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.data.success) {
      verifications.value = response.data.data || [];
      loadImages();
    } else {
      ElMessage.error(response.data.message || '加载认证记录失败');
    }
  } catch (error) {
    ElMessage.error('加载认证记录失败');
  }
};

const loadImages = async () => {
  for (const verification of verifications.value) {
    if (verification.businessLicenseUrl) {
      verification.imageUrl = await getImage(verification.businessLicenseUrl);
    }
  }
};

const approveVerification = async (id: number) => {
  try {
      const token = userStore.profile?.token;
      await axios.post(`/api/admin/company-verification/approve/${id}`, {}, {
          headers: {
              Authorization: `Bearer ${token}`
          }
      });
      ElMessage.success('审核通过');
      fetchVerifications();
  } catch (error) {
      ElMessage.error('审核失败');
  }
};

const getImageUrl = (fileName: string) => {
  return `/api/admin/get-verify-file/${fileName}`;
};

// 创建一个新的 axios 实例用于图片请求
const imageAxios = axios.create();

// 添加请求拦截器，设置请求头
imageAxios.interceptors.request.use(config => {
  const token = userStore.profile?.token;
  if (token) {
      config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const imageCache = new Map<string, string>(); // 缓存图片 URL

const getImage = async (fileName: string) => {
  if (imageCache.has(fileName)) {
    return imageCache.get(fileName); // 返回缓存的 URL
  }

  try {
    const response = await imageAxios.get(getImageUrl(fileName), { responseType: 'blob' });
    const blob = response.data;
    const url = URL.createObjectURL(blob);
    imageCache.set(fileName, url); // 缓存 URL
    return url;
  } catch (error) {
    console.error('获取图片失败', error);
    return ''; // 返回空字符串或占位图 URL
  }
};

onMounted(() => {
  fetchVerifications();
});
</script>

<style scoped lang="scss">
.admin-verification-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 70px);

  h1 {
      font-size: 24px;
      color: #2c3e50;
      margin-bottom: 20px;
  }

 .el-table {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: visible;

      .el-image {
          border-radius: 4px;
      }

      .el-tag {
          font-size: 14px;
      }

      .el-button {
          font-size: 14px;
      }

      .el-table__cell {
        z-index: auto;
      }
  }
}

@media (max-width: 768px) {
  .admin-verification-container {
      padding: 10px;

      h1 {
          font-size: 20px;
      }

      .el-table {
          font-size: 12px;

          .el-tag {
              font-size: 12px;
          }

          .el-button {
              font-size: 12px;
          }
      }
  }
}
</style>
