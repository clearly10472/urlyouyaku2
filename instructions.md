# URL One-Line Summary - 詳細解説

このドキュメントでは、URL One-Line Summaryサービスの詳細な処理フロー、API仕様、およびデプロイに関するヒントを説明します。

## 処理フロー

1. **リクエスト受信**
   - ユーザーから `GET /summary?url={エンコードされたURL}` のリクエストを受け取ります
   - URLパラメータの存在と形式を検証します

2. **コンテンツ抽出**
   - `node-fetch` を使用して指定されたURLからHTMLを取得します
   - `jsdom` でHTMLをDOMに変換します
   - `@mozilla/readability` を使用して主要なコンテンツテキストを抽出します

3. **要約生成**
   - 抽出されたテキストを Google Gemini API に送信します
   - 以下のプロンプトを使用します:
     ```
     次の内容を日本語で120字以内で1行要約してください。
     --------
     ${extractedText}
     --------
     ```
   - Gemini API からの応答を受け取ります

4. **レスポンス返却**
   - 成功時: `{ "summary": "要約テキスト" }` を JSON 形式で返します
   - エラー時: 適切なステータスコードとエラーメッセージを返します

## API仕様

### エンドポイント

- **URL**: `/summary`
- **メソッド**: GET
- **パラメータ**: `url` (要約対象のURL、URLエンコード済み)

### レスポンス

#### 成功時 (200 OK)

```json
{
  "summary": "要約されたテキスト（120字以内の日本語）"
}
```

#### エラー時

- **400 Bad Request**: URLパラメータが不足または無効
  ```json
  {
    "error": "URL parameter is required"
  }
  ```
  または
  ```json
  {
    "error": "Invalid URL format"
  }
  ```

- **502 Bad Gateway**: Gemini API エラー
  ```json
  {
    "error": "Gemini API error: {詳細なエラーメッセージ}"
  }
  ```

- **500 Internal Server Error**: その他のエラー
  ```json
  {
    "error": "Internal server error"
  }
  ```

## デプロイ Tips

### ローカル開発

1. `.env` ファイルを設定する
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=3000
   ```

2. 依存関係をインストール
   ```bash
   npm install
   ```

3. サーバーを起動
   ```bash
   node index.js
   ```

### クラウドデプロイ

#### Heroku

1. Heroku CLI をインストール
2. アプリを作成
   ```bash
   heroku create url-one-line-summary
   ```
3. 環境変数を設定
   ```bash
   heroku config:set GEMINI_API_KEY=your_api_key_here
   ```
4. デプロイ
   ```bash
   git push heroku main
   ```

#### Vercel

1. `vercel.json` ファイルを作成
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "index.js"
       }
     ]
   }
   ```
2. Vercel CLI をインストール
3. 環境変数を設定
4. デプロイ
   ```bash
   vercel --prod
   ```

### セキュリティ考慮事項

- API キーは必ず環境変数として設定し、コードにハードコーディングしないでください
- 本番環境では HTTPS を使用してください
- レート制限の実装を検討してください（特に公開APIの場合）
- 長いテキストを処理する場合はタイムアウト設定を調整してください

## トラブルシューティング

- **Gemini API エラー**: API キーが正しく設定されているか確認してください
- **メモリ使用量が多い**: 非常に大きなウェブページを処理する場合、メモリ制限を調整する必要があるかもしれません
- **タイムアウトエラー**: 大きなウェブページや応答の遅いウェブサイトの場合、タイムアウト設定を調整してください
