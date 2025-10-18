// Script para testar a API em produção
const https = require('https');

const testUrls = [
    {
        name: 'Cloudflare Worker',
        url: 'https://trackmax-proxy.trackmax-proxy.workers.dev/api/server'
    },
    {
        name: 'Netlify Functions',
        url: 'https://dashboard-trackmax.netlify.app/.netlify/functions/proxy/server'
    },
    {
        name: 'Firebase Hosting (via Cloudflare)',
        url: 'https://dashboard-trackmax-web.web.app/api/server'
    }
];

const credentials = Buffer.from('admin:admin').toString('base64');

function testUrl(urlInfo) {
    return new Promise((resolve) => {
        const options = {
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        };

        console.log(`\n🧪 Testando ${urlInfo.name}...`);
        console.log(`URL: ${urlInfo.url}`);

        const req = https.request(urlInfo.url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const result = {
                    name: urlInfo.name,
                    url: urlInfo.url,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: res.headers,
                    data: data
                };
                
                if (res.statusCode === 200) {
                    console.log(`✅ ${urlInfo.name}: OK (${res.statusCode})`);
                    try {
                        const jsonData = JSON.parse(data);
                        console.log(`   Resposta: ${JSON.stringify(jsonData).substring(0, 100)}...`);
                    } catch (e) {
                        console.log(`   Resposta: ${data.substring(0, 100)}...`);
                    }
                } else {
                    console.log(`❌ ${urlInfo.name}: ERRO (${res.statusCode})`);
                    console.log(`   Status: ${res.statusCode} ${res.statusText}`);
                    console.log(`   Resposta: ${data.substring(0, 200)}...`);
                }
                
                resolve(result);
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ${urlInfo.name}: ERRO DE CONEXÃO`);
            console.log(`   Erro: ${error.message}`);
            resolve({
                name: urlInfo.name,
                url: urlInfo.url,
                error: error.message
            });
        });

        req.setTimeout(10000, () => {
            console.log(`❌ ${urlInfo.name}: TIMEOUT`);
            req.destroy();
            resolve({
                name: urlInfo.name,
                url: urlInfo.url,
                error: 'Timeout'
            });
        });

        req.end();
    });
}

async function runTests() {
    console.log('🚀 Iniciando testes de produção...');
    console.log('🔑 Credenciais: admin:admin');
    
    const results = [];
    
    for (const urlInfo of testUrls) {
        const result = await testUrl(urlInfo);
        results.push(result);
    }
    
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('====================');
    
    results.forEach(result => {
        if (result.error) {
            console.log(`❌ ${result.name}: ERRO - ${result.error}`);
        } else if (result.status === 200) {
            console.log(`✅ ${result.name}: OK`);
        } else {
            console.log(`❌ ${result.name}: ERRO ${result.status}`);
        }
    });
    
    const successCount = results.filter(r => r.status === 200).length;
    const totalCount = results.length;
    
    console.log(`\n🎯 Resultado: ${successCount}/${totalCount} testes passaram`);
    
    if (successCount === totalCount) {
        console.log('🎉 Todos os testes passaram! O erro 401 foi resolvido.');
    } else {
        console.log('⚠️  Alguns testes falharam. Verifique os logs acima.');
    }
}

runTests().catch(console.error);



