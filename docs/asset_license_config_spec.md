# 素材ライセンス管理コンフィグ仕様

## 概要

この仕様は、ゲーム・動画・Web・その他制作物で使用する素材のライセンス情報を管理するためのコンフィグファイル形式を定義するものです。

実データは `.eagle-license.yaml` に記述し、値の妥当性や enum の検証は `.license.schema.json` で行うことを想定します。

YAML は人間が編集しやすくコメントも書ける一方で、enum や必須項目の検証には向いていません。そのため、設定ファイルは YAML、検証ルールは JSON Schema に分離します。

---

## ファイル構成

```text
.license.yaml        # 素材ライセンス情報の実データ
.license.schema.json # .license.yaml を検証するための JSON Schema
```

---

## 基本方針

ライセンス情報は、人間が確認するための情報と、ツールが判定するための情報を分けて管理します。

たとえば、ライセンステキストや備考は人間向けの情報です。一方で、商用利用の可否や加工可否はツールが判定しやすいように enum として管理します。

権限系の値には boolean を使わず、次の enum を使用します。

```yaml
allowed      # 許可
prohibited   # 禁止
conditional  # 条件付きで許可
unknown      # 不明・未確認
```

`true` / `false` だけでは、「条件付き可」や「未確認」を表現できないためです。

---

## .license.yaml の構造

```yaml
assets:
  - id: "bgm_001" # 素材を一意に識別するID。ファイル名や管理番号など

    name: "素材名" # 素材の表示名・タイトル
    source_url: "https://example.com/material" # 素材の配布ページURL

    author:
      name: "作者名" # 作者・配布者の名前
      url: "https://example.com/author" # 作者ページ、プロフィール、SNSなどのURL

    license:
      type: "CC-BY-4.0" # ライセンス種別。例: CC0, CC-BY-4.0, CC-BY-SA-4.0, MIT, CUSTOM, UNKNOWN
      text: "ライセンステキスト全文または要約" # 規約本文、または重要部分のメモ
      url: "https://creativecommons.org/licenses/by/4.0/" # ライセンス本文ページのURL
      checked_at: "2026-05-06" # ライセンス内容を確認した日付
      evidence_url: "https://example.com/license-page" # 判断根拠にしたページURL。素材ページや利用規約ページなど

    permissions:
      commercial_use: "allowed" # 商用利用。allowed=可, prohibited=不可, conditional=条件付き可, unknown=不明
      modification: "allowed" # 加工・改変。allowed=可, prohibited=不可, conditional=条件付き可, unknown=不明
      redistribution: "prohibited" # 再配布。素材そのもの、または加工後素材の配布可否
      age_restricted_content: "allowed" # 年齢制限付きコンテンツへの使用可否。R15、暴力表現など

    obligations:
      attribution_required: true # クレジット表記が必要か
      report_required: false # 利用報告が必要か
      credit_text: "作者名 / 素材名 / ライセンス名" # 実際に表記するクレジット文

    notes: "商用利用はクレジット表記必須。" # 判断メモ、注意事項、例外など
```

---

## 各フィールドの説明

### assets

素材情報の配列です。1つの素材につき1要素を追加します。

### id

素材を一意に識別するための ID です。

ファイル名、管理番号、内部IDなどを使用します。

例:

```yaml
id: "bgm_001"
```

### name

素材の表示名、タイトル、または管理上の名前です。

例:

```yaml
name: "森の朝 BGM"
```

### source_url

素材の配布ページ URL です。

素材ファイルそのものへの直リンクではなく、利用規約や作者情報を確認できるページを指定することを推奨します。

例:

```yaml
source_url: "https://example.com/material"
```

---

## author

作者または配布者の情報です。

### author.name

作者名または配布者名です。

```yaml
author:
  name: "作者名"
```

### author.url

作者ページ、プロフィールページ、SNS、配布サイト上の作者ページなどの URL です。

```yaml
author:
  url: "https://example.com/author"
```

---

## license

ライセンスに関する情報です。

### license.type

ライセンスの種類です。

使用可能な値は以下を基本とします。

```yaml
CC0
CC-BY-4.0
CC-BY-SA-4.0
MIT
CUSTOM
UNKNOWN
```

独自規約の場合は `CUSTOM`、確認できない場合は `UNKNOWN` を指定します。

### license.text

ライセンステキストの全文、または重要部分の要約を記述します。

独自規約の場合は、特に重要な条件をここに残しておくと確認しやすくなります。

### license.url

ライセンス本文ページの URL です。

Creative Commons や MIT License など、ライセンス文書が別ページにある場合に使用します。

### license.checked_at

ライセンス内容を確認した日付です。

日付形式は `YYYY-MM-DD` とします。

例:

```yaml
checked_at: "2026-05-06"
```

### license.evidence_url

ライセンス判断の根拠にしたページ URL です。

素材ページ、利用規約ページ、FAQ、作者の明記ページなどを指定します。

---

## permissions

素材の利用可否を管理する項目です。

各値には次の enum を使用します。

```yaml
allowed      # 許可
prohibited   # 禁止
conditional  # 条件付きで許可
unknown      # 不明・未確認
```

### permissions.commercial_use

商用利用の可否です。

例:

```yaml
commercial_use: "allowed"
```

### permissions.modification

加工・改変の可否です。

色変更、トリミング、音量調整、ループ加工、形式変換などを含みます。

例:

```yaml
modification: "conditional"
```

条件付きの場合は、条件の詳細を `notes` に記載します。

### permissions.redistribution

再配布の可否です。

素材そのものの再配布、または加工後素材の配布可否を管理します。

例:

```yaml
redistribution: "prohibited"
```

### permissions.age_restricted_content

年齢制限付きコンテンツへの使用可否です。

R15、暴力表現、ホラー表現、その他プラットフォーム上で年齢制限が付く可能性のあるコンテンツを想定します。

例:

```yaml
age_restricted_content: "allowed"
```

---

## obligations

利用時に必要な義務を管理する項目です。

### obligations.attribution_required

クレジット表記が必要かどうかです。

```yaml
attribution_required: true
```

### obligations.report_required

作者や配布サイトへの利用報告が必要かどうかです。

```yaml
report_required: false
```

### obligations.credit_text

実際に記載するクレジット文です。

```yaml
credit_text: "作者名 / 素材名 / ライセンス名"
```

クレジット表記が不要な場合でも、管理上のメモとして残しておくことは可能です。

---

## notes

判断メモ、注意事項、例外、条件付き許可の条件などを記述します。

例:

```yaml
notes: "商用利用は可能。ただしクレジット表記が必要。素材単体での販売は禁止。"
```

`permissions` に `conditional` を指定した場合は、条件の内容を必ず `notes` に記載します。

---

## JSON Schema 例

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["assets"],
  "properties": {
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "source_url", "license", "permissions"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "source_url": { "type": "string", "format": "uri" },
          "author": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "url": { "type": "string", "format": "uri" }
            }
          },
          "license": {
            "type": "object",
            "required": ["type", "checked_at"],
            "properties": {
              "type": {
                "type": "string",
                "enum": ["CC0", "CC-BY-4.0", "CC-BY-SA-4.0", "MIT", "CUSTOM", "UNKNOWN"]
              },
              "text": { "type": "string" },
              "url": { "type": "string", "format": "uri" },
              "checked_at": { "type": "string", "format": "date" },
              "evidence_url": { "type": "string", "format": "uri" }
            }
          },
          "permissions": {
            "type": "object",
            "required": [
              "commercial_use",
              "modification",
              "redistribution",
              "age_restricted_content"
            ],
            "properties": {
              "commercial_use": {
                "$ref": "#/$defs/permissionStatus"
              },
              "modification": {
                "$ref": "#/$defs/permissionStatus"
              },
              "redistribution": {
                "$ref": "#/$defs/permissionStatus"
              },
              "age_restricted_content": {
                "$ref": "#/$defs/permissionStatus"
              }
            }
          },
          "obligations": {
            "type": "object",
            "properties": {
              "attribution_required": { "type": "boolean" },
              "report_required": { "type": "boolean" },
              "credit_text": { "type": "string" }
            }
          },
          "notes": { "type": "string" }
        }
      }
    }
  },
  "$defs": {
    "permissionStatus": {
      "type": "string",
      "enum": ["allowed", "prohibited", "conditional", "unknown"]
    }
  }
}
```

---

## 運用ルール

`permissions` の値が `conditional` の場合は、必ず `notes` に条件を記載します。

`license.checked_at` は、素材を追加した日、またはライセンス確認を行った日を記録します。

ライセンスページや素材配布ページが変更される可能性があるため、重要な素材については定期的に確認日を更新します。

ライセンスが不明な素材は `UNKNOWN` や `unknown` を使い、使用判断を保留します。

不明な素材を `allowed` として扱わないようにします。

---

## 最小必須項目

最低限、以下の項目は必須とします。

```yaml
id
name
source_url
license.type
license.checked_at
permissions.commercial_use
permissions.modification
permissions.redistribution
permissions.age_restricted_content
```

`author` や `obligations` は素材によって不明な場合もあるため、必須にはしません。ただし、確認できる場合は記載することを推奨します。

---

## 推奨する判定方針

不明なものは `unknown` として扱います。

条件があるものは `conditional` として扱い、条件の詳細を `notes` に記載します。

明確に禁止されているものは `prohibited` として扱います。

明確に許可されているものだけを `allowed` として扱います。

---

## まとめ

この仕様では、素材ライセンス情報を `.eagle-license.yaml` に集約し、enum や必須項目の検証を `.license.schema.json` で行います。

YAML は編集しやすさを優先し、JSON Schema は正しさの検証を担当します。

権限系の項目には boolean を使わず、`allowed` / `prohibited` / `conditional` / `unknown` の enum を使用します。

これにより、商用利用、加工、再配布、年齢制限付きコンテンツへの利用可否を、曖昧にせず管理できます。

