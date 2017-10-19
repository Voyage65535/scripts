const https = require('https')

// 把自己的Cookie粘过来
const cookie = ''

function user(opr, token)
{
    // 构造请求模板
    const opt = {
        host: 'www.zhihu.com',
        port: '443',
        headers: {
            'Cookie': cookie
        }
    }

    switch (opr) {
    // 根据指定操作补完请求
    case 'follow':
        opt.method = 'POST'
        opt.path = `/api/v4/members/${token}/followers`
        break
    case 'unfollow':
        opt.method = 'DELETE'
        opt.path = `/api/v4/members/${token}/followers`
        break
    case 'block':
        opt.method = 'POST'
        opt.path = `/api/v4/members/${token}/actions/block`
        break
    case 'unblock':
        opt.method = 'DELETE'
        opt.path = `/api/v4/members/${token}/actions/block`
        break
    }

    // 发起请求
    const req = https.request(opt)
    req.write('')
    req.end()
}

function answer(id)
{
    // 首先获取答案信息，拉黑回答者
    // 然后请求点赞者信息，拉黑点赞者

    // 拉黑目标
    let blist = []

    // 构造答案查询请求
    let opt = {
        host: 'www.zhihu.com',
        port: '443',
        path: `/api/v4/answers/${id}`,
        headers: {
            'Cookie': cookie
        }
    }

    // 处理请求的响应
    // 构造回调闭包来重用代码
    let callback = action => res =>
    {
        // 获取并解析返回的对象
        res.setEncoding('utf-8')
        let raw = ''
        res.on('data', chunk => raw += chunk)
        res.on('end', () =>
        {
            // 为确保数据完整性，在此处解析对象并处理
            let content = JSON.parse(raw)
            action(content)
        })
    }

    // 发起请求
    https.get(opt, callback(content =>
    {
        // 先取关，后拉黑
        if (content.author.is_following)
            user('unfollow', content.author.url_token)
        blist.push(content.author.url_token)
    }))
    
    // 知乎的回答点赞者只能分块获取
    // 具体是怎么分的自己看请求响应的paging部分

    // 构造点赞者查询请求
    opt.path = `/api/v4/answers/${id}/voters?include=data[*].is_following`

    // 发起请求
    https.get(opt, callback(function (content) // 不用箭头函数以确保argements.callee是此函数
    {
        // 将这些人加入目标名单中
        for (let x of content.data) {
            // 先取关，后拉黑
            if (x.is_following)
                user('unfollow', x.url_token)
            // 匿名用户没有url_token
            if (x.url_token)
                blist.push(x.url_token)
        }
        
        if (!content.paging.is_end) {
            // 获取下一批点赞者
            opt.path = content.paging.next
            // 指定自身作为回调函数
            https.get(opt, callback(arguments.callee))
        } else {
            // 获取完毕，开始拉黑
            for (let x of blist)
                user('block', x)
        }
    }))
}
