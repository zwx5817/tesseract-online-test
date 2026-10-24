export async function onRequestPost(context) {
    const { request, env } = context;
    
    let token = '';
    try {
        const body = await request.json();
        token = body.token || '';
    } catch (e) {}

    // 如果带了 Token，说明是手动点击，必须去 Cloudflare 验证
    if (token) {
        const SECRET_KEY = env.TURNSTILE_SECRET_KEY;
        if (!SECRET_KEY) {
            return new Response(JSON.stringify({ error: 'Server missing secret key' }), { status: 500 });
        }

        const formData = new FormData();
        formData.append('secret', SECRET_KEY);
        formData.append('response', token);

        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        });
        const verifyData = await verifyRes.json();

        // 验证失败直接拦截
        if (!verifyData.success) {
            return new Response(JSON.stringify({ error: 'Human verification failed' }), { status: 403 });
        }
    }

    // 走到这里说明要么是首次无感加载，要么是验证通过了。去查真实状态。
    try {
        const [mainRes, smallRes] = await Promise.all([
            fetch('https://api.mcstatus.io/v2/status/java/hmfree.tooo.top:20049'),
            fetch('https://api.mcstatus.io/v2/status/java/play.simpfun.cn:28381')
        ]);
        
        const mainData = await mainRes.json();
        const smallData = await smallRes.json();

        return new Response(JSON.stringify({ main: mainData, small: smallData }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Upstream API error' }), { status: 502 });
    }
}
