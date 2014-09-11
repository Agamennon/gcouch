var qs = require('querystring');
module.exports = function(params){
    if (!params){
        return '';
    }
    for (var i in params){
        if (params[i] !== true && params[i] !== false){
            params[i] = JSON.stringify(params[i]);
        }
    }
    return (qs.stringify(params));
};