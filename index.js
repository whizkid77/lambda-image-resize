var AWS = require('aws-sdk');
var S3 = new AWS.S3();
var Sharp = require('sharp');

var BUCKET = process.env.BUCKET;
var URL = process.env.URL;

var extToType = {
    jpeg:'image/jpeg',
    png:'image/png',
}

var allowedSizes = [16,18,20,24,25,30,32,40,50,60,64,70,75,80,90,100,120,128,140,150,160,180,200,220,225,240,250,256,300,400,500,512,600,700,800,900,1000,1024,2000,2048];

exports.handler = function(event, context) {
  var key = event.queryStringParameters.key;
  var match = key.match(/([^\.]+)\/(\d*)x(\d*)(contain-white|contain-black|contain-transparent|cover|)\.(jpg|png)/);
  if (!match) {
    return context.fail(new Error('Path does not match.'));
  }

  var originalKey = match[1];
  var width = parseInt(match[2], 10) || null;
  var height = parseInt(match[3], 10) || null;
  if (width && allowedSizes.indexOf(width) == -1) {
    return context.fail(new Error('Width not allowed.'));
  }
  if (height && allowedSizes.indexOf(height) == -1) {
    return context.fail(new Error('Height not allowed.'));
  }
  var objectFit = match[4];
  var ext = match[5];
  if (ext == 'jpg') {
    ext = 'jpeg'
  }

  S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
    .then((data) => Sharp(data.Body)
        .resize(width, height)
    )
    .then((pipe) => {
        if (objectFit == 'contain-white') {
            return pipe.background('white').embed()
        } else if (objectFit == 'contain-black') {
            return pipe.background('black').embed()
        } else if (objectFit == 'contain-transparent') {
            return pipe.background({r: 0, g: 0, b: 0, alpha: 0}).embed()
        } else {
            return pipe
        }
    })
    .then((pipe) => {
        return pipe.toFormat(ext)
                   .toBuffer()
    })
    .then((buffer) => S3.putObject({
        Body: buffer,
        Bucket: BUCKET,
        ContentType: extToType[ext],
        Key: key,
        ACL: 'public-read',
      }).promise()
    )
    .then(() => context.succeed({
        statusCode: '301',
        headers: {'location': `${URL}/${key}`},
        body: ''
      })
    )
    .catch((err) => context.fail(err))
}
