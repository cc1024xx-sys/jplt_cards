# 日语闪卡

浏览器端日语学习闪卡 Web MVP：词语、语法、语料库三类卡片，熟悉度复习，JSON 备份导入导出。

## 功能

- **词语闪卡**：正面中文释义，背面日语表达、场景与例句
- **语法闪卡**：正面核心句式，背面意思、场景与例句
- **语料库闪卡**：正面口语场景，背面常用词与句式
- **复习**：掌握 / 熟悉 / 不熟，按间隔安排下次复习
- **备份**：设置页导出/导入 JSON（覆盖本机数据）

## 开发

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
npm run preview
```

## 备份格式

导出文件 `japanese-learning-backup-YYYY-MM-DD.json` 包含 `version`、`decks`、`cards` 字段，可在另一浏览器中导入恢复。
