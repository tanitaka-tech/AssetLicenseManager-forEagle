# Asset License Manager for Eagle

Eagle のフォルダ単位でライセンス設定ファイル（`.eagle-license.json`）を管理し、配下の素材へライセンス情報を継承させる Eagle プラグイン。

詳細仕様は `docs/` 配下を参照。

- [docs/eagle_license_plugin_spec.md](docs/eagle_license_plugin_spec.md)
- [docs/asset_license_config_spec.md](docs/asset_license_config_spec.md)

## 開発

```sh
npm ci
npm run dev
```

## ビルド

```sh
npm run build
```

`dist/` を Eagle にプラグインとしてインポートする。

## スクリプト

| Script | 用途 |
| ------ | ---- |
| `npm run dev` | Vite 開発サーバー |
| `npm run build` | 型チェック + 本番ビルド |
| `npm run preview` | ビルド成果物のプレビュー |
| `npm run lint` | ESLint |
| `npm run check` | Biome (lint + format) チェック |
| `npm run check:fix` | Biome 自動修正 |
| `npm run test` | Vitest（watch） |
| `npm run test:ci` | Vitest（1回実行） |
| `npm run storybook` | Storybook 起動 |
| `npm run build-storybook` | Storybook ビルド |
