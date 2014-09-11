var $q = require('q');
var designApi = function(dbName,relax){
    var api = {};

    api.save = function(doc,cb){
        var cfg = {};
        cfg.method = 'PUT';
        cfg.path = '/'+dbName+'/'+doc._id;
       // cfg.data = JSON.stringify(doc);
        cfg.data = doc;
        return relax(cfg).nodeify(cb);
    };

    api.delete = function(doc,cb){
        var cfg = {};
        cfg.method = 'DELETE';
        cfg.path = '/'+dbName+'/'+doc._id+'/?rev='+doc._rev;
        return relax(cfg).nodeify(cb);
    };

    api.get = function(id,cb){
        var cfg = {};
        cfg.method = 'GET';
        cfg.path = '/'+dbName+'/'+id;
        return relax(cfg).nodeify(cb);
    };

    api.update = function(doc,cb){
        var d = $q.defer();
        api.get(doc._id).then(
            function(data){
                var ddocrev = data._rev;
                delete data._rev;
                if (JSON.stringify(data) === JSON.stringify(doc)){
                    d.resolve({ok:'same'});
                }else{
                    doc._rev = ddocrev;
                    d.resolve(api.save(doc).thenResolve({ok:'updated'}));
                }
            },
            function(){
                d.resolve(api.save(doc).thenResolve({ok:'new'}));
            });
        return d.promise.nodeify(cb);
    };

    return api;
};

module.exports = designApi;