# URL One-Line Summary

URLを入力すると、そのページの内容を日本語で120字以内の1行で要約するAPIサービスです。

## セットアップ

```bash
# リポジトリをクローンして移動
git clone https://github.com/yourusername/url-one-line-summary.git
cd url-one-line-summary

# 環境変数ファイルを準備
cp .env.example .env

# .envファイルを編集してGEMINI_API_KEYを設定
# エディタで.envを開き、APIキーを入力してください
# GEMINI_API_KEY=your_api_key_here

# 依存パッケージをインストール
npm install

# サーバーを起動
node index.js
```

## 環境変数の設定

`.env`ファイルに以下の環境変数を設定します：

- `GEMINI_API_KEY`: Google Gemini APIのキー（[Google AI Studio](https://makersuite.google.com/app/apikey)から取得）
- `PORT`: （オプション）サーバーのポート番号（デフォルト: 3000）

## 使用方法

サーバーが起動したら、以下のようにAPIを使用できます：

### URLの要約を取得

```bash
# curlでリクエスト例
curl "http://localhost:3000/summary?url=https://example.com"

# レスポンス例
# {"summary":"Exampleドメインは説明用に予約されたドメインで、文書作成やテスト目的で自由に使用できる安全なウェブサイトです。"}
```

## APIの仕様

### エンドポイント

- `GET /summary?url={エンコードされたURL}`

### パラメータ

- `url`: 要約したいウェブページのURL（必須）

### レスポンス

成功時:
```json
{
  "summary": "要約されたテキスト（120字以内の日本語）"
}
```

エラー時:
- URLパラメータが不足または無効: 400 Bad Request
- Gemini APIエラー: 502 Bad Gateway
- その他のエラー: 500 Internal Server Error
