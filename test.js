process.env.BUCKET = 'hashed-dev';
process.env.URL = 'https://s3-us-west-2.amazonaws.com/hashed-dev';
process.env.URL = 'http://hashed-dev.s3-website-us-west-2.amazonaws.com';

var lambda = require('./index').handler

lambda({
    queryStringParameters:{
        key:'0136c72f-01f1-4f6c-86f8-3460753ca794/22x20contain-white.jpg'
    }
},{
    fail:e => console.log('FAIL',e),
    succeed:res => console.log('SUCCEED',res),
})
