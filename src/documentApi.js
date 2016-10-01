//https://github.com/tomas/needle/blob/master/lib/multipart.js
//multipart  https://github.com/coolaj86/node-examples-js/blob/master/http-and-html5/http-upload.js
// http://www.andrewzammit.com/blog/node-js-handling-file-uploads-without-express/
// https://github.com/timoxley/file-uploader/blob/master/index.js
//https://github.com/standard-analytics/couch-multipart-stream

var documentApi = function(dbName,relax){
    var api = {},
        cfg,
        extend = require('extend'),
        makeqs = require('./makeqs.js');



    api.attachment = require('./attachmentApi.js')(dbName,relax);
    api.design = require('./designApi.js')(dbName,relax);



    /**
     * Insert a doc into couchdb
     * @param {json} doc - Doc to be inserted
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.save = function(doc,cb){
        cfg = {};
        cfg.path = '/'+dbName;
        cfg.method = (doc._id)? 'PUT':'POST';
        if (cfg.method === 'PUT')
            cfg.path = cfg.path + '/'+doc._id;
        //cfg.data = JSON.stringify(doc);
        cfg.data = doc;
        cfg.headers = {
            'Content-Type': 'application/json'
        };
        return relax(cfg).nodeify(cb);
    };


    /**
     * Get a doc into couchdb
     * @param {string} id - id of a doc to be fetched
     * @param {function} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.get = function(id,cb){
        cfg = {};
        cfg.method = 'GET';
        cfg.path = '/'+dbName+'/'+id;
        return relax(cfg).nodeify(cb);
    };

    /**
     * Deletes a doc from couchdb
     * @param {string} doc - doc to be deleted
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.del = function(doc,cb){
        cfg = {};
        cfg.method = 'DELETE';
        cfg.path = '/'+dbName+'/'+doc._id+'?rev='+doc._rev;
        return relax(cfg).nodeify(cb);
    };

    /**
     * Light HEAD request for doc information
     * @param {string} id - id of a doc to get its head
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.head = function(id,cb){
        cfg = {};
        cfg.method = 'HEAD';
        cfg.path = '/'+dbName+'/'+id;
        var response;
        cfg.onResponse = function(res){
            res.headers.etag = res.headers.etag.replace(/"/g,'');
            response = res;
            return response;
        };
        cfg.onEnd = function(body){
            return response.headers;
        };
        return relax(cfg).nodeify(cb);
    };

    /**
     * Get all documents from docKeys (an array containing ids)
     * @param {[]} docKeys - array with document ids
     * @param {{}} [params] - Optional Parameters
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.bget = function(docKeys,params,cb){
        cfg = {};
        cfg.method = 'POST';
        cfg.data = {keys:docKeys};
        cfg.headers = {
         'Content-Type':'application/json'
         }
        params = extend(true,{},params);
        if (!('include_docs' in params)){
            params['include_docs'] = true;
        }
        cfg.path = '/'+dbName+'/'+'_all_docs?'+makeqs(params);
        cfg.onEnd = function(body){
            body = JSON.parse(body);
            for (var x in body.rows){
                body.rows[x] = body.rows[x].doc;
            }
            return body.rows;
        };
        return relax(cfg).nodeify(cb);
    };

    /**
     * Save all documents from docs (an array containing docs)
     * @param {[]} docs - array with documents
     * @param {{}} [params] - Optional Parameters
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.bsave = function(docs,params,cb){
        cfg = {};
        cfg.method = 'POST';
        //cfg.data = JSON.stringify({docs:docs});
        cfg.data = {docs:docs};
        cfg.path = '/'+dbName+'/'+'_bulk_docs?'+makeqs(params);
        cfg.headers = {
            'Content-Type': 'application/json'
        };
        return relax(cfg).nodeify(cb);
    };

    /**
     *
     * @param {string} viewName - name of a view
     * @param {{}} params - couchb query options for view
     * @param {string} [designDoc] - name of design doc (defaults to dbname)
     * @param {callback} [cb] - optional callback
     * @returns {promise} - Q promise;
     */
        // api.view = function(viewName,params,designDoc,cb){
    api.view = function(cfg,cb){
//        cfg = {};
        cfg.method = 'GET';
        cfg.designDoc = cfg.designDoc || dbName;
        cfg.qs = cfg.qs || {};
        cfg.qs.reduce = (cfg.qs.reduce) ? cfg.qs.reduce : false;
        cfg.path =  '/'+dbName+'/_design/'+cfg.designDoc+'/_view/'+cfg.viewName+'?'+makeqs(cfg.qs);



        /*  var d = $q.defer();

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

    /**
     *
     * @param {string} viewName - name of a view
     * @param {string } listName - name of a list
     * @param {{}} [params] - optional couchdb query params
     * @param {{}} [data] - optional body to send the list function
     * @param {{}} designDoc - design doc name (defaults to dbname)
     * @param {callback} cb - optional callback
     * @returns {promise} - Q promise
     */
        // api.list = function(viewName,listName,params,data,designDoc,cb){
    api.list = function(cfg,cb){
        cfg.method = 'POST';
        cfg.designDoc = cfg.designDoc || dbName;
        cfg.qs = cfg.qs || {};
        cfg.data  = cfg.data || {};
        //   cfg.data = JSON.stringify(cfg.data);
        cfg.qs.reduce = (cfg.qs.reduce) ? cfg.qs.reduce : false;
        cfg.headers = {
            'Content-Type': 'application/json'
        };
        cfg.path =  '/'+dbName+'/_design/'+cfg.designDoc+'/_list/'+cfg.listName+'/'+cfg.viewName+ '?'+makeqs(cfg.qs);
        return relax(cfg).nodeify(cb);
    };

    /**
     *
     * @param {string} updateName - name of update function
     * @param {{}} [data] - data to send update function
     * @param {string} id - id for the update function to fetch a doc
     * @param {string} [designDoc] - design doc name (defaults to dbname)
     * @param  {callback} cb - optional callback
     * @returns  {promise} - Q promise
     */
        //api.update = function(updateName,data,id,params,designDoc,cb){
    api.update = function(cfg,cb){
        cfg.method = 'PUT';
        cfg.designDoc = cfg.designDoc || dbName;
        cfg.data  = cfg.data || {};
        cfg._id  = cfg._id || '';
        cfg.path =  '/'+dbName+'/_design/'+cfg.designDoc+'/_update/'+cfg.updateName+'/'+cfg._id+'?'+makeqs(cfg.qs);
        cfg.onEnd = function(body,response){
            body = JSON.parse(body);
            if (response.headers['x-couch-update-newrev']){
                //   console.log(response.headers['x-couch-update-newrev']);
                body._rev = response.headers['x-couch-update-newrev'];
            }
            return body;
        };
        return relax(cfg).nodeify(cb);
    };


    api.changes = function(filter,cb){
        var d  = $q.defer(),
            cfg = {},
            forever = require('forever-agent');

        if (filter)
            filter = 'filter='+dbName+'/' + filter +'&';
        api.get('_changes?limit=1&descending=true',function(erro,data){
            if (erro)
                d.reject(erro);
            else{
                if (data.last_seq){
                    cfg.method = 'GET';
                    cfg.agent = new forever();
                    cfg.path = '/'+dbName+'/_changes?'+filter+'feed=continuous&heartbeat=60000&since='+data.last_seq;
                    relax(cfg).progress(function(chunk){
                        try {
                            data = JSON.parse(chunk);
                        }
                        catch(e){
                            data = 'false';
                        }
                        finally {
                            if (data !== 'false'){
                                d.notify(data);
                                cb(data);
                            }
                        }
                    });
                }
                else{
                    d.reject('last_sec nao encontrado (changes api)');
                }
            }
        });
        return d.promise;
    };

    api.exec = require('./guerchtato')(api);

    return api
};

module.exports = documentApi;


//implementing stream (so para aprender)
/*  res.on('data',function(chunk){
 var ready = writestream.write(chunk);
 if (ready === false) {
 this.pause();
 writestream.once('drain', this.resume.bind(this))
 }
 });
 res.on('end', function() {
 writestream.end();
 })*/
