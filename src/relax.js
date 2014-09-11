//http://stackoverflow.com/questions/6158933/how-to-make-an-http-post-request-in-node-js


var $q = require('q'),
    http = require('http');



function transform(cfg,data){
    var uniqueTemp = [],
        rows = [];
    if (cfg.remove_duplicates){
        for (var x=0; x < data.rows.length; x++){
            if (uniqueTemp.indexOf(data.rows[x].id) === -1){
                rows.push(data.rows[x]);
                uniqueTemp.push(data.rows[x].id);
            }
        }
        data.rows = rows;
    }
    return data;
}


var relax = function(couchUrl,port,user,pass) {
    return  function req(cfg){
        var d = $q.defer(),
            body,
            httpReq,
            cb;

        cfg.hostname = cfg.hostname || couchUrl;
        cfg.auth = cfg.auth || user+':'+pass;
        cfg.port = cfg.port || port;


        d.promise.pipe = function(wstream){
            cfg.pipe = wstream;
        };

        cb = function(response) {
          //  d2.resolve(response);

            if (cfg.pipe){
                //cfg.pipe.statusCode = response.statusCode;
               // cfg.pipe.headers = response.headers;
                cfg.pipe.writeHeader(response.statusCode, response.headers);
               //cfg.pipe.statusCode = response.statusCode;
               // response.pipe(cfg.pipe);
                response.pipe(cfg.pipe);
           // cfg.pipe.pipe(response);
            }else{
                body = '';
                if (cfg.onResponse){
                    response = cfg.onResponse(response);
                }

                response.on('data', function (chunk) {
                    body += chunk;
                    d.notify(chunk);
                });
                response.on('end', function () {
                    var code = response.statusCode;
                    if (cfg.onEnd)
                        body = cfg.onEnd(body,response);
                    else
                        body = JSON.parse(body);

                    if (code === 201 || code === 200){
                        d.resolve(transform(cfg,body));
                        //   d.resolve(body);
                    }else{
                        d.reject({statusCode:code,body:body});
                    }
                });
                response.on('error', function(e) {
                    d.reject(e.message);
                });
            }


        };

        httpReq = http.request(cfg, cb);

        if (cfg.onRequest){
            cfg.onRequest(httpReq);
        }

        if (cfg.data){
            if (!Buffer.isBuffer(cfg.data))
                cfg.data = JSON.stringify(cfg.data);
            httpReq.write(cfg.data);
        }

        httpReq.end();
        return d.promise;
    }
};
module.exports = relax;

