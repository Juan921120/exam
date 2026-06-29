// 小程序端题库数据 - 与H5端统一使用包含完整explanation的题库
// 注意：题库数据将被放入分包(subpackages/exam)，不影响主包体积
// 备份：questions-minimal.json 保留作为不含解析的精简版备用
import questionsJson from '../../questions.json';
export const questionsData = questionsJson;