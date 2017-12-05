'use strict'

const https = require('https')
const Y = f => (x => f(v => x(x)(v)))
               (x => f(v => x(x)(v)))

const x_xsrf_token = ''
const cookie = ''

function request(method, path, host)
{
    const opt = {
        host: host || 'www.zhihu.com',
        port: 443,
        method: method,
        path: path,
        headers: {
            'x-xsrf-token': x_xsrf_token, // 关注专栏要这玩意
            Cookie: cookie
        }
    }

    const req = https.request(opt)
    req.write('')
    req.end()
}

function read(method, path, filter, action, MotherFucker)
{
    let res = []

    const opt = {
        host: 'www.zhihu.com',
        port: 443,
        path: path,
        method: method,
        headers: { Cookie: cookie }
    }

    const callback = action => res =>
    {
        res.setEncoding('utf-8')
        let raw = ''
        res.on('data', chunk => raw += chunk)
        res.on('end', () =>
        {
            let content = JSON.parse(raw)
            action(content)
        })
    }

    const req = (opt, callback) =>
    {
        let req = https.request(opt, callback)
        req.write('')
        req.end()
    }

    req(opt, callback(Y(proc => content =>
    {
        filter(res, content.data)

        if (!content.paging.is_end) {
            if (MotherFucker)
                // 知乎后端你妈死了
                opt.path = content.paging.next.slice(0, 21) + '/api/v4/' + content.paging.next.slice(22)
            else
                opt.path = content.paging.next
            req(opt, callback(proc))
        } else action(res)
    })))
}

function sync(token)
{
    let filter = id => (res, data) =>
    {
        for (let x of data)
            if (!x.is_following)
                res.push(x[id])
    }

    // 关注用户
    read('GET', `/api/v4/members/${token}/followees?limit=20&offset=0&include=data[*].is_following`, filter('url_token'), res =>
    {
        for (let x of res)
            request('POST', `/api/v4/members/${x}/followers`)
    })

    // 关注问题
    read('GET', `/api/v4/members/${token}/following-questions?limit=20&offset=0&include=data[*].is_following`, filter('id'), res =>
    {
        for (let x of res)
            request('POST', `/api/v4/questions/${x}/followers`)
    }, '操你妈地址不能用')

    // 关注收藏夹
    read('GET', `/api/v4/members/${token}/following-favlists?limit=20&offset=0&include=data[*].is_following`, filter('id'), res =>
    {
        for (let x of res)
            request('POST', `/api/v4/favlists/${x}/followers`)
    })

    // 关注专栏
    read('GET', `/api/v4/members/bhkinterp/following-columns?limit=20&offset=0&include=data[*].is_following`, filter('id'), res =>
    {
        for (let x of res)
            request('PUT', `/api/columns/${x}/follow`, 'zhuanlan.zhihu.com')
    }, '操你妈地址不能用')

    // 关注话题
    read('GET', `/api/v4/members/${token}/following-topic-contributions?limit=20&offset=0`, (res, data) =>
    {
        for (let x of data)
            res.push(x.topic.id)
    }, res =>
    {
        for (let x of res)
            request('POST', `/api/v4/topics/${x}/followers`)
    })
}
