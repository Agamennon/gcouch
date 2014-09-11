
var attachmentApi = function(dbName,relax){
    var api = {},
        cfg = {},

        qs = require('querystring'),
        extend = require('extend');

    /**
     * Save a doc and its attachements using multipart
     * data must be in the following format data[0] must be the document
     * data[1..x] are the files as a json object in the format {name:'fileName',data:fileData}
     * @param {[]} data
     * @param params
     * @param {callback} [cb] - Optional Callback
     * @returns {*}
     */
    api.multiSave = function(data,params,cb){
        var doc = data[0],
            att = {},
            cfg = {},
            x,
            file,
            multipartBody = [],
            openDelimiter,
            closeDelimiter,
            boundary,
            body,
            length;

        /**
         * criates the _attachements elements from the files add them to doc
         * also reformatas data array to be data[0] doc doc[1..x]  the data of the files
         * to be consumed.
         */
        for(x=1;x<data.length;x++){
            file = data[x];
            att[file.name] = {follows:true,'content-type':'application/octet-stream',length:file.data.length};
            data[x] = file.data;
        }
        doc._attachments = extend(true,{},doc._attachments,att);
        boundary = Math.random();
        openDelimiter = "--" + boundary + '\r\n' + "Content-Type : application/json"+ '\r\n' + '\r\n';
        multipartBody.push(new Buffer('\r\n'));
        for (x=0;x<data.length;x++){
            multipartBody.push(new Buffer(openDelimiter));
            if (x === 0){
                body = JSON.stringify(data[x]);
                multipartBody.push(new Buffer(body));
            }
            else{
                body = data[x];
                multipartBody.push(body);
            }
            multipartBody.push(new Buffer('\r\n'));
        }
        closeDelimiter = "--" + boundary + "--";
        multipartBody.push(new Buffer(closeDelimiter));

        cfg.data = Buffer.concat(multipartBody);
        length = cfg.data.length;

        cfg.headers = {
            'content-type': 'multipart/related; boundary=' + boundary,
            'content-length' : length
        };
        cfg.method = 'PUT';

        params = extend(true,{},params,doc._rev);

        cfg.path =  '/'+dbName+'/'+doc._id+'?'+qs.stringify(params);
        return relax(cfg).nodeify(cb);
    };

    api.multiGet = function(id,params,cb){
        cfg = {};
        cfg.method = 'GET';

        cfg.path =  '/'+dbName+'/'+id+'?attachments=true';
        cfg.onEnd = function(body){
            //todo PARSE mime multipart e retornar um objeto json formatado
            //todo add Accept:" header to the request with value "multipart/related".
            return {data:body};

        };
        return relax(cfg).nodeify(cb);
    };

    api.get = function(id,fileName,cb){
        cfg = {};
        cfg.method = 'GET';
        cfg.path =  '/'+dbName+'/'+id+'/'+fileName;
        cfg.onEnd = function(body){
            return body;
        };

     /*   var d = $q.defer();

        cfg.onResponse = function(res){
            d.resolve(res);
            return res;
        };

        var p = relax(cfg).nodeify(cb);
        //se for chamado com callback p nao vai ser definido nao retorna promessa;
        if (p){
            p.pipe = function(writestream){
                d.promise.then(function(res){
                    res.pipe(writestream);
                });
            };
        }
        return p;*/
        return relax(cfg).nodeify(cb);

    };

    api.delete = function(id,fileName,rev,cb){
        cfg = {};
        cfg.method = 'DELETE';
        cfg.path =  '/'+dbName+'/'+id+'/'+fileName+'?rev='+rev;
        return relax(cfg).nodeify(cb);
    };



    return api;
};

module.exports = attachmentApi;