

var serverApi = function(relax){
    var api = {};

    function execute(action,path,cb,cfg){
        var cfg = cfg || {};
        cfg.method = 'GET';
        cfg.path = path;
        cfg.headers = {
            'Content-Type': 'application/json'
        };

        switch (action){
            case 'create': cfg.method = 'PUT';
                break;
            case 'delete': cfg.method ='DELETE';
                break;
            case 'replicateDb': cfg.method ='PUT';
                break;
            case 'replicate': cfg.method ='POST';
                break;
        }
        return relax(cfg).nodeify(cb);
    }

    /**
     * Create a database with dbName on couchdb server
     * @param {string} dbName - Database name
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.create = function(dbName,cb){
        return execute('create', '/'+dbName,cb);
    };
    /**
     * deletes a database with dbName on couchdb server
     * @param {string} dbName - Database name
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.delete = function(dbName,cb){
        return execute('delete', '/'+dbName,cb);
    };
    /**
     * Get information on a database with dbName on couchdb server
     * @param {string} dbName - Database name
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.get = function(dbName,cb){
        return execute('get', '/'+dbName,cb);
    };

    /**
     * Gets a array containing all databases on the server
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise - success param contains the array
     */
    api.list = function(cb){
        return execute('list', '/_all_dbs',cb);
    };

    api.compact= function(){
        //todo implementar src.compact
        //https://wiki.apache.org/couchdb/Compaction
    };


    /**
     * Replication
     * @param {json} data - json no formato  http://wiki.apache.org/couchdb/Replication
     * @param {callback} [cb] - Optional Callback
     * @returns {promise} - $q promise
     */
    api.replicate= function(data ,cb){
        var cfg = {};
        cfg.data = data;
        return execute('replicate','/_replicate',cb,cfg);

    };

    //todo terminar
    api.replicateDb= function(data ,cb){
        var cfg = {};
        cfg.data = data;
        return execute('replicate','/_replicator/'+'id_documento_replicacao',cb,cfg);
    };



    api.activeTasks = function (cb){
        return execute('GET','/_active_tasks',cb);

    };

    api.changes = function(){
        //todo implementar src.changes
    };

    /**
     * retorna um documentAPI do banco dbName
     * @param {string} dbName - nome do banco
     * @returns {{}} - api
     */
    api.use = function(dbName){
        api = require('./documentApi.js')(dbName,relax);

        return api;
    };

    return api
};


module.exports = serverApi;