export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // ALBのエンドポイント
    const ALB_ENDPOINT =
      "http://blog-aws-practice-alb-169089192.ap-northeast-1.elb.amazonaws.com";

    // GraphQLエンドポイントへのプロキシ
    const targetUrl = `${ALB_ENDPOINT}${url.pathname}${url.search}`;

    // リクエストをプロキシ
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow",
    });

    // Origin headerを設定（CORSのため）
    proxyRequest.headers.set(
      "Origin",
      "https://blog-aws-practice-frontend.mrcdsamg63.workers.dev"
    );

    // バックエンドにリクエストを送信
    const response = await fetch(proxyRequest);

    // レスポンスヘッダーをコピー
    const responseHeaders = new Headers(response.headers);

    // CORSヘッダーを追加/上書き
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    responseHeaders.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // OPTIONSリクエストの処理
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

    // レスポンスを返す
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};
