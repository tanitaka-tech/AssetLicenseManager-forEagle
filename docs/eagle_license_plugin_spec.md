# Eagle License Manager Plugin 仕様書

## 1. 概要

Eagle License Manager Plugin は、Eagle のフォルダ単位でライセンス設定ファイルを管理し、配下の素材に対してライセンス情報を継承させるための Eagle プラグインである。

本仕様では、運用性を重視し、ライセンスの正本は JSON ファイルとして管理する。スキーマ検証には JSON Schema を使用し、Eagle 上の検索性を確保するために、フォルダおよび素材アイテムへ最小限のタグを同期する。

## 2. 目的

このプラグインの目的は、Eagle 内の素材に対して、ライセンス情報を人間が確認しやすく、かつ MCP サーバーや Skill から機械的に解決できる形で管理することである。

主な目的は次の通り。

- Eagle フォルダ単位でライセンス情報を定義できるようにする
- フォルダ配下の素材は、そのフォルダのライセンスを継承したものとして扱う
- ライセンス情報を JSON Schema により検証する
- Eagle 上でライセンス設定を専用 UI から編集できるようにする
- MCP サーバーがライセンス情報を解決しやすい構造にする
- Eagle のタグ検索でも最低限のライセンス条件を絞り込めるようにする

## 3. 基本方針

ライセンス情報の正本は、Eagle に登録された `.eagle-license.json` アイテムとする。

OS 上に単にファイルを置くだけではなく、Eagle の通常アイテムとして取り込み、対象フォルダに所属させる。これにより、Eagle の UI から存在を確認でき、バックアップやライブラリ移行時にも扱いやすくなる。

Eagle の内部管理ファイルやライブラリ内部構造は直接変更しない。すべてのアイテム更新、タグ更新、保存処理は Eagle Plugin API 経由で行う。

## 4. 対象範囲

### 4.1 対象に含むもの

- フォルダ単位のライセンス設定作成
- 既存ライセンス設定の編集
- JSON Schema による検証
- ライセンス設定ファイルの Eagle アイテム登録
- フォルダおよび配下素材への検索用タグ同期
- 配下素材のライセンス解決プレビュー
- MCP サーバー向けの解決仕様

### 4.2 対象に含めないもの

- ライセンス条文そのものの法的解釈
- 外部サイトのライセンス自動判定
- Eagle ライブラリ内部ファイルの直接編集
- バイナリ形式の独自データ管理
- 素材ファイル本体の再配布可否判断の自動保証

## 5. 用語定義

### ライセンス設定ファイル

対象フォルダに所属する `.eagle-license.json` のこと。フォルダ配下の素材へ継承されるライセンス情報を保持する。

### ライセンス正本

ライセンス判定に使う正式なデータ。原則として `.eagle-license.json` を正本とする。

### 検索用タグ

Eagle 上で検索や絞り込みをしやすくするために同期する短いタグ。正本ではない。

### 継承

対象フォルダ配下の素材が、そのフォルダのライセンス設定を利用すること。

### オーバーライド

素材個別、または下位フォルダで上位フォルダのライセンス設定を上書きすること。

## 6. ファイル構成

対象フォルダには、次のライセンス設定ファイルを置く。

```text
.eagle-license.json
```

Eagle 上では、このファイル自体もアイテムとして登録される。

例:

```text
Music
  ├─ Pixabay BGM
  │    ├─ sad-piano-loop.wav
  │    ├─ rain-ending.mp3
  │    └─ .eagle-license.json
  │
  ├─ Artlist
  │    ├─ cinematic-rise.wav
  │    └─ .eagle-license.json
  │
  └─ Unknown
       └─ .eagle-license.json
```

## 7. ライセンス JSON スキーマ

### 7.1 基本構造

`.eagle-license.json` は次の構造を持つ。

```json
{
  "schema": "eagle-license/v1",
  "scope": "folder",
  "license_id": "pixabay-content-license",
  "license_name": "Pixabay Content License",
  "source": {
    "provider": "Pixabay",
    "url": "https://example.com/source",
    "author": "Example Artist"
  },
  "permissions": {
    "commercial_use": true,
    "modification": true,
    "youtube": true,
    "client_work": true
  },
  "requirements": {
    "credit_required": false,
    "credit_text": null
  },
  "restrictions": {
    "redistribution_as_stock": true,
    "ai_training": "unknown"
  },
  "evidence": {
    "captured_at": "2026-05-06",
    "license_page_url": "https://example.com/license",
    "snapshot_item_id": null,
    "notes": ""
  },
  "inherit": true,
  "priority": 100,
  "status": "active"
}
```

### 7.2 JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.local/schemas/eagle-license-v1.schema.json",
  "title": "Eagle Folder License",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema",
    "scope",
    "license_id",
    "license_name",
    "source",
    "permissions",
    "requirements",
    "restrictions",
    "evidence",
    "inherit",
    "priority",
    "status"
  ],
  "properties": {
    "schema": {
      "type": "string",
      "const": "eagle-license/v1"
    },
    "scope": {
      "type": "string",
      "enum": ["folder", "asset"]
    },
    "license_id": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[a-z0-9][a-z0-9._-]*$"
    },
    "license_name": {
      "type": "string",
      "minLength": 1
    },
    "source": {
      "type": "object",
      "additionalProperties": false,
      "required": ["provider", "url"],
      "properties": {
        "provider": { "type": "string", "minLength": 1 },
        "url": { "type": "string" },
        "author": { "type": ["string", "null"] }
      }
    },
    "permissions": {
      "type": "object",
      "additionalProperties": false,
      "required": ["commercial_use", "modification", "youtube", "client_work"],
      "properties": {
        "commercial_use": { "type": "boolean" },
        "modification": { "type": "boolean" },
        "youtube": { "type": "boolean" },
        "client_work": { "type": "boolean" }
      }
    },
    "requirements": {
      "type": "object",
      "additionalProperties": false,
      "required": ["credit_required", "credit_text"],
      "properties": {
        "credit_required": { "type": "boolean" },
        "credit_text": { "type": ["string", "null"] }
      }
    },
    "restrictions": {
      "type": "object",
      "additionalProperties": false,
      "required": ["redistribution_as_stock", "ai_training"],
      "properties": {
        "redistribution_as_stock": { "type": "boolean" },
        "ai_training": {
          "type": "string",
          "enum": ["allowed", "prohibited", "unknown"]
        }
      }
    },
    "evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["captured_at", "license_page_url", "snapshot_item_id", "notes"],
      "properties": {
        "captured_at": {
          "type": "string",
          "format": "date"
        },
        "license_page_url": { "type": ["string", "null"] },
        "snapshot_item_id": { "type": ["string", "null"] },
        "notes": { "type": "string" }
      }
    },
    "inherit": { "type": "boolean" },
    "priority": {
      "type": "integer",
      "minimum": 0,
      "maximum": 1000
    },
    "status": {
      "type": "string",
      "enum": ["active", "deprecated", "review_required", "unknown"]
    }
  }
}
```

## 8. Eagle タグ設計

### 8.1 ライセンス設定ファイル用タグ

`.eagle-license.json` アイテムには、次のタグを付与する。

```text
license-config
scope:folder
license:<license_id>
commercial:ok | commercial:ng
credit:required | credit:not-required
license-status:active | license-status:review-required | license-status:unknown
```

例:

```text
license-config
scope:folder
license:pixabay-content-license
commercial:ok
credit:not-required
license-status:active
```

### 8.2 フォルダ用タグ

対象フォルダには、必要に応じて検索用タグを付与する。

```text
license:<license_id>
commercial:ok | commercial:ng
credit:required | credit:not-required
inherit-license:true
```

### 8.3 アセット用タグ

配下アセットには、検索効率を上げるため、最小限のタグのみ同期する。

```text
license:inherited
license:<license_id>
commercial:ok | commercial:ng
credit:required | credit:not-required
```

ただし、アセット側タグは正本ではない。正本は常に `.eagle-license.json` とする。

## 9. ライセンス解決ルール

MCP サーバーおよびプラグインのプレビュー機能は、次の順序でライセンスを解決する。

1. アセット個別の `.eagle-license.json` または個別ライセンス設定を確認する
2. アセットが所属するフォルダの `.eagle-license.json` を確認する
3. 親フォルダを順に遡って `.eagle-license.json` を確認する
4. 複数フォルダに所属し、複数の有効なライセンスが見つかった場合は競合扱いにする
5. `status` が `review_required` または `unknown` の場合は、利用不可ではなく要確認として返す
6. どこにもライセンスが見つからない場合は `license:unknown` とする

## 10. 競合ルール

複数のライセンス設定が見つかった場合、次のルールで処理する。

### 10.1 同一 license_id の場合

同じ `license_id` であれば競合とはみなさない。ただし、内容ハッシュが異なる場合は警告を出す。

### 10.2 異なる license_id の場合

異なる `license_id` が複数見つかった場合、原則として競合扱いにする。

例:

```json
{
  "status": "conflict",
  "reason": "multiple_folder_licenses",
  "licenses": [
    "pixabay-content-license",
    "artlist-project-license"
  ]
}
```

### 10.3 priority の扱い

`priority` は自動解決のためではなく、UI 表示やレビュー補助に使う。ライセンス衝突を黙って上書きする用途には使わない。

## 11. プラグイン UI 仕様

### 11.1 メイン画面

プラグイン起動時、現在選択中のフォルダまたはアイテムを対象として表示する。

表示項目:

- 対象フォルダ名
- ライセンス設定ファイルの有無
- 現在の license_id
- 商用利用可否
- クレジット要否
- ステータス
- 継承の有効/無効
- 配下アセット数
- 要確認アセット数
- 競合アセット数

### 11.2 ライセンス編集フォーム

編集フォームでは、JSON を直接編集させず、原則としてフォーム入力で編集する。

入力項目:

- ライセンスID
- ライセンス名
- 提供元
- 元URL
- 作者名
- 商用利用可否
- 改変可否
- YouTube利用可否
- クライアントワーク利用可否
- クレジット要否
- クレジット表記
- 素材集としての再配布禁止フラグ
- AI学習利用可否
- ライセンス確認日
- ライセンスページURL
- 証跡アイテムID
- メモ
- ステータス

### 11.3 JSON プレビュー

フォーム内容から生成される JSON を読み取り専用で表示する。

上級者向けに直接編集モードを用意してもよいが、保存時には必ず JSON Schema 検証を行う。

### 11.4 検証結果表示

保存前に次の検証結果を表示する。

- JSON Schema 検証結果
- 必須項目の不足
- URL 未入力警告
- クレジット必須なのに credit_text が空の警告
- `status: unknown` の警告
- 既存ライセンス設定との競合

### 11.5 配下アセット同期画面

保存後、配下アセットへ検索用タグを同期するか選択できる。

同期モード:

- 同期しない
- ライセンス設定ファイルのみ更新
- フォルダタグのみ同期
- 配下アセットへ最小タグを同期
- 配下アセットの既存ライセンスタグを置換して同期

初期値は「フォルダタグのみ同期」とする。

## 12. プラグイン機能一覧

### 12.1 Create Folder License

選択中フォルダに `.eagle-license.json` が存在しない場合、新規作成する。

処理内容:

- デフォルト JSON を生成
- JSON Schema で検証
- `.eagle-license.json` として保存
- Eagle アイテムとして対象フォルダへ登録
- `license-config` タグを付与
- フォルダタグを同期

### 12.2 Edit Folder License

選択中フォルダの `.eagle-license.json` を読み込み、編集する。

処理内容:

- 対象フォルダから `license-config` アイテムを検索
- JSON を読み込む
- フォームに展開
- 編集後に JSON Schema で検証
- 保存
- タグ同期

### 12.3 Validate License Tree

対象フォルダ配下のライセンス状態を検証する。

検証項目:

- ライセンス設定ファイルの有無
- JSON Schema 違反
- 複数ライセンス競合
- 不明ライセンス
- クレジット表記不足
- 証跡不足

### 12.4 Preview Resolved License

選択中アセットについて、実際に解決されるライセンス情報を表示する。

表示例:

```json
{
  "asset_id": "ITEM_ID",
  "asset_name": "sad-piano-loop.wav",
  "resolved_from": "folder",
  "folder_id": "FOLDER_ID",
  "license_id": "pixabay-content-license",
  "commercial_use": true,
  "credit_required": false,
  "status": "active"
}
```

### 12.5 Sync License Tags

対象フォルダおよび配下素材へ検索用タグを同期する。

同期対象タグ:

```text
license:<license_id>
commercial:ok | commercial:ng
credit:required | credit:not-required
license-status:<status>
license:inherited
```

## 13. MCP サーバー連携仕様

MCP サーバーは、Eagle から素材情報を取得した後、対象アセットの所属フォルダをもとにライセンスを解決する。

### 13.1 MCP ツール案

```ts
resolve_asset_license(assetId: string): ResolvedLicense

search_assets(input: {
  query: string;
  asset_type?: "image" | "audio" | "video" | "font" | "any";
  license?: {
    commercial_use?: boolean;
    credit_required?: boolean;
    status?: "active" | "review_required" | "unknown";
  };
  limit?: number;
}): AssetSearchResult[]

validate_license_tree(folderId: string): LicenseValidationReport
```

### 13.2 ResolvedLicense

```ts
type ResolvedLicense = {
  status: "resolved" | "unknown" | "conflict" | "invalid";
  resolved_from?: "asset" | "folder" | "parent_folder";
  asset_id: string;
  folder_id?: string;
  license?: EagleLicense;
  warnings: string[];
  conflicts?: EagleLicense[];
};
```

## 14. 実装方針

### 14.1 技術方針

- Eagle Plugin API を使用する
- UI は HTML/CSS/JavaScript で実装する
- JSON Schema 検証には Ajv を使用する
- ライセンスファイルの読み書きは Node.js の fs API を使用する
- Eagle アイテム更新は `item.tags` 更新後に `item.save()` する
- Eagle 内部管理ファイルは直接変更しない

### 14.2 保存処理

保存時の処理順序:

1. フォーム値を JSON に変換
2. JSON Schema で検証
3. 既存 `.eagle-license.json` をバックアップ
4. `.eagle-license.json` を保存
5. ライセンス設定アイテムのタグを更新
6. フォルダタグを更新
7. 必要に応じて配下アセットタグを同期
8. 結果レポートを表示

### 14.3 バックアップ

保存前に、同一フォルダ内またはプラグイン管理領域にバックアップを作成する。

例:

```text
.eagle-license.backup.20260506-153000.json
```

ただし、バックアップファイルを Eagle アイテムとして登録するかは設定で選択可能にする。

## 15. エラー設計

### 15.1 想定エラー

- 対象フォルダが選択されていない
- 複数フォルダが選択されている
- `.eagle-license.json` が複数存在する
- JSON が壊れている
- JSON Schema に違反している
- ファイル保存に失敗した
- Eagle アイテム更新に失敗した
- 配下アセットタグ同期中に一部失敗した

### 15.2 エラー表示方針

エラーは、原因、対象、対処方法を表示する。

例:

```text
ライセンス設定ファイルが複数見つかりました。
対象フォルダ: Pixabay BGM
見つかった設定: 2件
対処: 不要な .eagle-license.json を削除するか、片方を別フォルダへ移動してください。
```

## 16. セキュリティと安全性

- 外部 URL からライセンス情報を自動で信用しない
- ライセンス判定結果には必ず `status` を含める
- `unknown` や `review_required` は利用可能として扱わない
- ライセンス JSON に任意コードを含めない
- JSON 読み込み時に `eval` を使用しない
- 保存前に必ず JSON Schema 検証を行う

## 17. バージョニング

ライセンス JSON には `schema` を必ず含める。

```json
{
  "schema": "eagle-license/v1"
}
```

将来の拡張では、次のようにバージョンを上げる。

```text
eagle-license/v1
eagle-license/v2
```

v2 以降を導入する場合、プラグイン側にマイグレーション機能を用意する。

## 18. 初期リリースで実装する機能

初期リリースでは、次の機能に絞る。

- 選択フォルダへの `.eagle-license.json` 作成
- 既存ライセンス設定の編集
- JSON Schema 検証
- ライセンス設定アイテムへのタグ付与
- フォルダタグ同期
- 選択アセットのライセンス解決プレビュー

配下アセット全体への一括同期は、初期リリースでは任意機能とする。

## 19. 将来拡張

- 既存ライセンスプリセット機能
- ライセンス証跡スクリーンショットの保存
- 外部 URL からのライセンスページ取得補助
- MCP サーバーとの双方向同期
- 複数ライブラリ対応
- チーム運用向けレビュー状態管理
- ライセンス変更履歴の表示
- CSV/Markdown レポート出力

## 20. 推奨プリセット

初期状態で、次のプリセットを用意する。

- Unknown / 要確認
- Original / 自作素材
- Client Provided / クライアント提供素材
- Royalty Free / 汎用ロイヤリティフリー
- CC0
- CC BY 4.0
- Pixabay Content License
- Custom

## 21. まとめ

このプラグインでは、ライセンス情報の正本を `.eagle-license.json` として Eagle 上に登録し、JSON Schema で検証する。

Eagle のタグには検索用サマリのみを同期し、ライセンス判定の正式な根拠にはしない。

権限系の値は `boolean` ではなく、`allowed` / `prohibited` / `conditional` / `unknown` の enum として管理する。これにより、商用利用、加工、再配布、年齢制限付きコンテンツへの利用可否を、条件付きや未確認の状態も含めて扱える。

MCP サーバーや Skill は、Eagle の素材情報と `.eagle-license.json` を組み合わせて、フォルダ単位の継承ライセンスを解決する。

この設計により、人間が確認しやすく、プラグインで編集しやすく、MCP から機械的に扱いやすいライセンス管理を実現する。

